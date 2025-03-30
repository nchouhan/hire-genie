const express = require('express');
const router = express.Router();
const dataStore = require('../services/dataStore');
const geminiService = require('../services/geminiService');
const Job = require('../models/Job');
const Applicant = require('../models/Applicant');

// --- Job Routes ---
router.post('/jobs', async (req, res) => {
    try {
        // Basic validation
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required.' });
        }
        const newJob = new Job(
            req.body.title,
            req.body.department,
            req.body.location,
            req.body.description,
            req.body.requirements,
            req.body.niceToHave,
            req.body.salaryRange
            // Add createdBy based on logged-in user later
        );
        dataStore.addJob(newJob);
        res.status(201).json(newJob);
    } catch (error) {
        console.error("Error creating job:", error);
        res.status(500).json({ message: 'Failed to create job' });
    }
});

router.get('/jobs', (req, res) => {
    res.json(Object.values(dataStore.getJobs()));
});

router.get('/jobs/:jobId', (req, res) => {
    const job = dataStore.getJob(req.params.jobId);
    if (job) {
        res.json(job);
    } else {
        res.status(404).json({ message: 'Job not found' });
    }
});

router.post('/jobs/:jobId/apply', (req, res) => {
     try {
        const jobId = req.params.jobId;
        const job = dataStore.getJob(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        // Validation
        const { name, email, phone, resumeLink } = req.body;
         if (!name || !email || !phone || !resumeLink) {
            return res.status(400).json({ message: 'Name, email, phone, and resume link are required.' });
        }

        const newApplicant = new Applicant(
            jobId,
            name,
            email,
            phone,
            resumeLink,
            req.body.coverLetter,
            req.body.source
        );

        // Initialize first stage in history
         const firstStageConfig = dataStore.getStagesConfig()[0];
         newApplicant.stageHistory.push({
             stageId: firstStageConfig.id,
             enteredAt: new Date().toISOString(),
             assignedTo: job.createdBy || 'default.recruiter@example.com', // Assign to job creator or default
             feedback: [],
             overallFeedback: '',
             status: 'pending'
         });


        dataStore.addApplicant(newApplicant);

        // Add applicant ID to job listing
        job.applicants.push(newApplicant.id);
        dataStore.updateJob(job);

        res.status(201).json({ message: 'Application submitted successfully!', applicantId: newApplicant.id });
    } catch (error) {
        console.error("Error submitting application:", error);
        res.status(500).json({ message: 'Failed to submit application' });
    }
});

router.put('/jobs/:jobId', async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const existingJob = dataStore.getJob(jobId);

        if (!existingJob) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Get updated data from request body
        const updatedData = req.body;

        // Validate required fields haven't been cleared (optional but good)
        if (!updatedData.title || !updatedData.description) {
             return res.status(400).json({ message: 'Title and description cannot be empty.' });
        }
        // Create a new updated Job object or update properties directly
        // It's often safer to merge properties onto the existing object
        const updatedJob = {
            ...existingJob, // Keep existing properties like id, createdAt, applicants etc.
            title: updatedData.title,
            department: updatedData.department,
            location: updatedData.location,
            description: updatedData.description,
            requirements: updatedData.requirements, // Ensure format is consistent (array or string)
            niceToHave: updatedData.niceToHave,
            salaryRange: updatedData.salaryRange,
            // You might want to add an 'updatedAt' timestamp here
       };


       dataStore.updateJob(updatedJob); // Use the update function

       res.json(updatedJob); // Send back the updated job

   } catch (error) {
        console.error(`Error updating job ${req.params.jobId}:`, error);
        res.status(500).json({ message: 'Failed to update job' });
   }
});

 router.get('/jobs/:jobId/applicants', (req, res) => {
    const applicants = dataStore.getApplicantsForJob(req.params.jobId);
    res.json(applicants);
});


// --- Applicant Routes ---
 router.get('/applicants/:applicantId', (req, res) => {
    const applicant = dataStore.getApplicant(req.params.applicantId);
    if (applicant) {
        // Optionally enrich with job details here if needed by frontend
        res.json(applicant);
    } else {
        res.status(404).json({ message: 'Applicant not found' });
    }
});

router.put('/applicants/:applicantId/stage', (req, res) => {
     try {
        const applicant = dataStore.getApplicant(req.params.applicantId);
        const { newStageId, assignedTo, feedbackStatus } = req.body; // feedbackStatus: 'passed', 'rejected'
        const stagesConfig = dataStore.getStagesConfig();

        if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
        if (!newStageId || !stagesConfig.find(s => s.id === newStageId)) {
             return res.status(400).json({ message: 'Invalid new stage ID' });
        }

        // 1. Update status of the *current* stage in history
        const currentStageEntry = applicant.stageHistory.find(entry => entry.stageId === applicant.currentStageId && !entry.status.includes('completed')); // Find active entry
         if (currentStageEntry) {
             currentStageEntry.status = feedbackStatus === 'passed' ? 'completed-passed' : 'completed-rejected';
             // Add overall feedback if provided
             if (req.body.overallFeedback) {
                 currentStageEntry.overallFeedback = req.body.overallFeedback;
             }
        } else {
             console.warn(`Could not find active stage history entry for applicant ${applicant.id}, stage ${applicant.currentStageId}`);
         }


        // 2. Add entry for the *new* stage (only if passed)
         if (feedbackStatus === 'passed') {
             const newStageConfig = stagesConfig.find(s => s.id === newStageId);
             applicant.stageHistory.push({
                 stageId: newStageId,
                 enteredAt: new Date().toISOString(),
                 assignedTo: assignedTo || 'default.recruiter@example.com', // Assign to someone
                 feedback: [],
                 overallFeedback: '',
                 status: 'pending'
             });
             applicant.currentStageId = newStageId; // Update current stage
         } else {
             // If rejected, don't move stage, maybe update overall applicant status?
             applicant.status = 'rejected'; // Add an overall status field to Applicant model if needed
         }


        dataStore.updateApplicant(applicant);
        res.json(applicant);
         // TODO: Trigger notification/scheduling request here
    } catch (error) {
        console.error("Error updating applicant stage:", error);
        res.status(500).json({ message: 'Failed to update stage' });
    }
});
// --- Feedback Routes ---
router.post('/applicants/:applicantId/feedback', (req, res) => {
     try {
         const applicant = dataStore.getApplicant(req.params.applicantId);
         const { stageId, feedbackBy, comment, rating } = req.body; // feedbackBy could be logged-in user email

         if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
         if (!stageId || !feedbackBy || !comment) {
             return res.status(400).json({ message: 'Stage ID, feedback provider, and comment are required.' });
         }

         const stageEntry = applicant.stageHistory.find(entry => entry.stageId === stageId); // Might need more specific logic if stages repeat
         if (!stageEntry) {
             return res.status(404).json({ message: `Stage history for ${stageId} not found.` });
         }

         stageEntry.feedback.push({
             by: feedbackBy,
             comment: comment,
             rating: rating || null, // Optional rating
             submittedAt: new Date().toISOString()
         });

         dataStore.updateApplicant(applicant);
         res.status(201).json(stageEntry.feedback);

    } catch (error) {
        console.error("Error adding feedback:", error);
        res.status(500).json({ message: 'Failed to add feedback' });
    }
});

// --- AI Routes ---
router.post('/ai/enhance-jd', async (req, res) => {
    try {
        const enhancedDesc = await geminiService.enhanceJobDescription(req.body);
        res.json({ enhancedDescription: enhancedDesc });
    } catch (error) {
        res.status(500).json({ message: 'Failed to enhance job description via AI' });
    }
});
// --- AI Candidate Assessment Routes ---
router.post('/ai/assess-candidate', async (req, res) => {
     try {
        const { jobId, applicantId, question } = req.body;
        const job = dataStore.getJob(jobId);
        const applicant = dataStore.getApplicant(applicantId);

        if (!job || !applicant || !question) {
            return res.status(400).json({ message: 'Job ID, Applicant ID, and Question are required.' });
        }

        const assessment = await geminiService.assessCandidate(job, applicant, question);
        res.json({ assessment: assessment });
    } catch (error) {
        res.status(500).json({ message: 'Failed to assess candidate via AI' });
    }
});
// --- AI Candidate Chat Routes ---
 router.post('/ai/candidate-chat', async (req, res) => {
    try {
        const { applicantId, message } = req.body;
        const applicant = dataStore.getApplicant(applicantId);

        if (!applicant || !message) {
            return res.status(400).json({ message: 'Applicant ID and message are required.' });
        }

         // Add user message to history
        applicant.chatHistory.push({ role: 'user', parts: [{ text: message }] });

        // Call Gemini
        const modelResponse = await geminiService.candidateChat(applicantId, message, applicant.chatHistory);

         // Add model response to history
        applicant.chatHistory.push({ role: 'model', parts: [{ text: modelResponse }] });

         // Limit history length if necessary
        // const MAX_HISTORY = 20; // Keep last 10 pairs
        // if(applicant.chatHistory.length > MAX_HISTORY) {
        //     applicant.chatHistory = applicant.chatHistory.slice(-MAX_HISTORY);
        // }


        dataStore.updateApplicant(applicant); // Save updated chat history

        res.json({ reply: modelResponse });

    } catch (error) {
        res.status(500).json({ message: 'Failed to process candidate chat message' });
    }
});
// --- AI Job Description Enhancement Routes ---
router.post('/ai/suggest-jd-enhancements/:jobId', async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const job = dataStore.getJob(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const suggestions = await geminiService.getJobDescriptionSuggestions(job);

        if (suggestions.error) {
             // Send back a server error if AI failed
            return res.status(500).json({ message: suggestions.error, details: suggestions.details });
        }

        res.json(suggestions); // Send the structured JSON suggestions back

    } catch (error) {
         console.error(`Error suggesting enhancements for job ${req.params.jobId}:`, error);
         res.status(500).json({ message: 'Failed to get enhancement suggestions' });
    }
});


// --- Config Routes ---
router.get('/config/stages', (req, res) => {
    res.json(dataStore.getStagesConfig());
});


module.exports = router;