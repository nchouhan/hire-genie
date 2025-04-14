// server/routes/api.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra'); // Use fs-extra
const dataStore = require('../services/dataStore');
const geminiService = require('../services/geminiService');
const Applicant = require('../models/Applicant');
const Job = require('../models/Job');


// --- Multer Configuration (Save to Disk) ---
const UPLOADS_DIR = path.join(__dirname, '../uploads'); // Create an 'uploads' folder in project root

// Ensure uploads directory exists
fs.ensureDirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR); // Save files to the uploads directory
    },
    filename: function (req, file, cb) {
        // Create a unique filename: fieldname-timestamp-originalfilename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size (e.g., 10MB)
});
// --- End Multer Configuration ---

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
router.post('/applicants/:applicantId/feedback', async (req, res) => {
    try {
        const applicantId = req.params.applicantId;
        // Expecting stageId, authorEmail, overallComment, and objectiveRatings array
        const { stageId, authorEmail, overallComment, objectiveRatings } = req.body;

        // Basic Validation
        if (!stageId || !authorEmail || (!overallComment && !objectiveRatings)) {
            return res.status(400).json({ message: 'Stage ID, author email, and at least an overall comment or objective ratings are required.' });
        }
        // Deeper validation of objectiveRatings structure if needed

        const applicant = dataStore.getApplicant(applicantId);
        if (!applicant) {
            return res.status(404).json({ message: 'Applicant not found.' });
        }

        // Find the relevant stage history entry
        // IMPORTANT: This assumes stage IDs are unique in the history for now.
        // For repeatable stages, you might need a stageInstanceId.
        const stageEntry = applicant.stageHistory?.find(entry => entry.stageId === stageId && !entry.status?.includes('completed')); // Find active entry for stage
        if (!stageEntry) {
            return res.status(404).json({ message: `Active stage history entry for stage ${stageId} not found.` });
        }

        // Ensure feedback array exists
        stageEntry.feedback = stageEntry.feedback || [];

        const newFeedback = {
            by: authorEmail, // In real app, get from authenticated user session
            submittedAt: new Date().toISOString(),
            overallComment: overallComment || '', // Ensure string
            objectiveRatings: objectiveRatings || [] // Ensure array
        };

        stageEntry.feedback.push(newFeedback);

        dataStore.updateApplicant(applicant); // Save the updated applicant

        console.log(`Structured feedback added for applicant ${applicantId}, stage ${stageId} by ${authorEmail}`);
        res.status(201).json(newFeedback); // Return the newly created feedback

    } catch (error) {
        console.error("Error adding structured feedback:", error);
        res.status(500).json({ message: 'Failed to add structured feedback.' });
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
        // --- Get History from Separate Store ---
        const currentHistory = dataStore.getRecruiterChatHistory(jobId, applicantId);
        // Prepare context for Gemini if needed (use currentHistory)
        const contextForGemini = currentHistory.slice(-8); // Example
        // --- End Get History ---
        const modelResponse = await geminiService.assessCandidate(job, applicant, question /*, contextForGemini */);

        // --- Append to History Array (in memory) ---
        const updatedHistory = [
             ...currentHistory, // Get existing messages
             { role: 'user', parts: [{ text: question }] },
             { role: 'model', parts: [{ text: modelResponse }] }
        ];
        // --- End Append ---

        // --- Save Updated History to Separate Store ---
        dataStore.updateRecruiterChatHistory(jobId, applicantId, updatedHistory);
        console.log(`Updated chat history saved for applicant ${applicantId} / job ${jobId}.`);
        // --- End Save ---

        // Send ONLY the latest AI response back
        res.status(200).json({ assessment: modelResponse });
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

// --- Applicant Submission Route ---
// Handles file uploads AND links
router.post('/applicants/submit', upload.single('resumeFile'), async (req, res) => {
    try {
        const { jobId, linkedinUrl, githubUrl, portfolioUrl, otherLinks } = req.body;
        const resumeFile = req.file;

        console.log("--- Received PARSE request /api/applicants/submit ---");
        console.log(" > req.body:", req.body);
        console.log(" > req.file:", resumeFile);

        if (!jobId || (!resumeFile && !linkedinUrl && !githubUrl && !portfolioUrl)) {
             if (resumeFile && resumeFile.path) { await fs.unlink(resumeFile.path).catch(err => console.error("Cleanup failed:", err)); }
            return res.status(400).json({ message: 'Job ID and at least one resume source (file/link) are required.' });
        }
        // Optional: Check if job exists here too, but main check can be on confirmation

        // --- Trigger AI Parsing ---
        const parsedData = await geminiService.parseResumeAdvanced(resumeFile, { linkedinUrl, githubUrl, portfolioUrl, otherLinks });

        // // --- IMPORTANT: Delete the uploaded file AFTER parsing is done ---
        // if (resumeFile && resumeFile.path) {
        //     await fs.unlink(resumeFile.path).catch(err => console.error("Post-parse cleanup failed:", err));
        //     console.log("Cleaned up uploaded file:", resumeFile.path);
        // }
        // // --- END Delete ---


        if (parsedData.error) {
             return res.status(500).json({ message: "AI Parsing Failed", details: parsedData.error });
        }

        // Return the PARSED data to the frontend for review
        console.log("Sending parsed data back to frontend for review.");
        res.status(200).json({ parsedData: parsedData }); // Send parsed data back

    } catch (error) {
        console.error("Error during applicant parse request:", error);
        // Attempt cleanup on unexpected error
        if (req.file && req.file.path) {
             await fs.unlink(req.file.path).catch(cleanupError => console.error("Error cleaning up file on catch:", cleanupError));
        }
        res.status(500).json({ message: 'Application parsing failed unexpectedly.' });
    }
});

// --- NEW Applicant Confirmation Route ---
router.post('/applicants/confirm', async (req, res) => {
    try {
        const { jobId, confirmedData } = req.body; // Expect jobId and the potentially edited data

        console.log("--- Received CONFIRM request /api/applicants/confirm ---");
        console.log(" > Job ID:", jobId);
        // console.log(" > Confirmed Data:", confirmedData); // Log carefully if sensitive

        if (!jobId || !confirmedData || !confirmedData.name || !confirmedData.email) {
             return res.status(400).json({ message: 'Job ID and confirmed applicant data (including name/email) are required.' });
        }

        const job = dataStore.getJob(jobId);
        if (!job) {
             return res.status(404).json({ message: 'Job specified not found.' });
        }

        // Use the CONFIRMED data to create the Applicant
        // The Applicant constructor needs to handle this 'confirmedData' structure
        const newApplicant = new Applicant(jobId, confirmedData.source || 'Confirmed Upload/Link', confirmedData); // Pass confirmedData

        // Add appropriate initial stage
        newApplicant.currentStageId = 'submitted';
        newApplicant.stageHistory.push({ stageId: 'submitted', enteredAt: new Date().toISOString(), status: 'pending_review' });

        dataStore.addApplicant(newApplicant);

        // Add applicant to job's list
        job.applicants = job.applicants || []; // Ensure array exists
        job.applicants.push(newApplicant.id);
        dataStore.updateJob(job);

        console.log(`Applicant ${newApplicant.id} created and confirmed for job ${jobId}.`);
        res.status(201).json({ message: 'Application Confirmed and Submitted!', applicantId: newApplicant.id });

    } catch (error) {
        console.error("Error during applicant confirmation:", error);
        res.status(500).json({ message: 'Application confirmation failed.' });
    }
});

router.post('/ai/regenerate-summary', async (req, res) => {
    try {
        const { applicantId, jobId } = req.body;

        if (!applicantId || !jobId) {
            return res.status(400).json({ message: 'Applicant ID and Job ID are required.' });
        }

        const applicant = dataStore.getApplicant(applicantId);
        const job = dataStore.getJob(jobId);

        if (!applicant || !job) {
            return res.status(404).json({ message: 'Applicant or Job not found.' });
        }

        console.log(`Regenerating summary for Applicant: ${applicantId}, Job: ${jobId}`);

        // --- Call Gemini specifically for the summary ---
        const summaryPrompt = `Summarize why applicant ${applicant.name || 'ID '+applicant.id.slice(-4)} is a potential fit (or not) for the ${job.title} role, based on their profile (skills: ${applicant.skills?.map(s=>s.name).join(', ')}, experience: ${applicant.workExperience?.length} roles). Highlight strengths and potential gaps regarding required skills: ${job.jdKeywords?.requiredSkills?.map(s=>s.skill).join(', ')}. Be concise (1-2 sentences).`;
        console.log("Summary Prompt:", summaryPrompt);
        let generatedSummary = "AI summary regeneration failed."; // Default on error
        try {
             generatedSummary = await geminiService.callGeminiAPI(summaryPrompt); // Use base call
             generatedSummary = generatedSummary.substring(0, 250) + (generatedSummary.length > 250 ? '...' : '');
             console.log("Regenerated Summary:", generatedSummary);
        } catch (summaryError) {
             console.error("Failed to regenerate summary for applicant", applicantId, summaryError);
             // Keep default error message
        }

        // --- Update the applicant's ranking data ---
        if (!applicant.rankings) applicant.rankings = {};
        if (!applicant.rankings[jobId]) applicant.rankings[jobId] = {}; // Ensure job ranking object exists
        applicant.rankings[jobId].generatedSummary = generatedSummary;
        applicant.rankings[jobId].rankedAt = new Date().toISOString(); // Update timestamp

        dataStore.updateApplicant(applicant); // Save the updated applicant

        res.status(200).json({
            applicantId: applicantId,
            jobId: jobId,
            newSummary: generatedSummary
        }); // Send back the new summary

    } catch (error) {
        console.error("Error regenerating summary:", error);
        res.status(500).json({ message: 'Failed to regenerate summary.' });
    }
});
// --- Get Ranked Applicants for a Job ---
router.get('/jobs/:jobId/applicants/ranked', async (req, res) => {
    try {
       const jobId = req.params.jobId;
       const job = dataStore.getJob(jobId);
       if (!job) return res.status(404).json({ message: 'Job not found' });

       let applicants = dataStore.getApplicantsForJob(jobId); // Get all applicants for the job

       // --- Trigger Ranking Logic (potentially re-rank on request or use stored ranks) ---
       // This could be complex. For now, assume ranks are stored or calculated on the fly.
       // Example: Fetch stored ranks or re-rank if needed
       applicants = await geminiService.rankApplicantsForJob(job, applicants); // This function needs to exist and return ranked data
        // --- Get Stage Config for Name Lookup ---
        const stagesConfig = dataStore.getStagesConfig(); // Fetch config on backend

       // Filter/format data for HM view (summaries, scores)
       // Filter/format data for HM view
       const rankedList = applicants.map(app => {
        // --- Find Stage Name using Backend Config ---
        const stageConfig = stagesConfig.find(s => s.id === app.currentStageId);
        const stageName = stageConfig ? stageConfig.name : (app.currentStageId || 'Unknown'); // Get name or use ID/Unknown
        // --- End Find Stage Name ---

        return { // Return the formatted object
            id: app.id,
            name: app.anonymized ? 'Candidate ' + app.id.slice(-4) : app.name,
            email: app.anonymized ? '---' : app.email,
            overallScore: app.rankings?.[jobId]?.overallScore || 0,
            skillMatch: app.rankings?.[jobId]?.skillMatch || 0,
            experienceRelevance: app.rankings?.[jobId]?.experienceRelevance || 0,
            // ... other ranking categories
            summary: app.rankings?.[jobId]?.generatedSummary || 'N/A',
            isHiddenGem: app.rankings?.[jobId]?.isHiddenGem || false,
            currentStage: stageName // Use the resolved stageName
        };
    }).sort((a, b) => b.overallScore - a.overallScore);

    res.json(rankedList); // Send the list with resolved stage names
    } catch (error) {
        console.error("Error fetching ranked applicants:", error);
        res.status(500).json({ message: 'Failed to retrieve ranked applicants' });
    }
});


// --- Get Interview Prep Questions ---
router.get('/applicants/:applicantId/interview-prep', async (req, res) => {
   try {
        const applicant = dataStore.getApplicant(req.params.applicantId);
        if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
        const job = dataStore.getJob(applicant.jobId);
        if (!job) return res.status(404).json({ message: 'Associated job not found' });

        const questions = await geminiService.generateInterviewQuestions(job, applicant);
        res.json({ questions });
   } catch (error) {
        console.error("Error generating interview prep:", error);
        res.status(500).json({ message: 'Failed to generate interview questions' });
   }
});
// --- Get Parsed Applicant Data ---
router.get('/applicants/:applicantId/parsed', (req, res) => {
    const applicant = dataStore.getApplicant(req.params.applicantId);
    if (applicant) {
        const { id, jobId, currentStageId, stageHistory, notes, votes, name, email, phone, parsedSummary, workExperience, skills, education, certifications, advancedFields, careerTrajectory, discrepancies, originalCvPath } = applicant;
        res.json({ id, jobId, currentStageId, stageHistory, notes, votes, name, email, phone, parsedSummary, workExperience, skills, education, certifications, advancedFields, careerTrajectory, discrepancies, originalCvPath});
    } else {
        res.status(404).json({ message: 'Applicant not found' });
    }
});
// --- NEW: Add a Note ---
router.post('/applicants/:applicantId/notes', async (req, res) => {
    try {
        const applicantId = req.params.applicantId;
        const { noteText, authorEmail } = req.body; // Get text and author (replace with real auth later)

        if (!noteText || !authorEmail) {
            return res.status(400).json({ message: 'Note text and author email are required.' });
        }

        const applicant = dataStore.getApplicant(applicantId);
        if (!applicant) {
            return res.status(404).json({ message: 'Applicant not found.' });
        }

        // Ensure notes array exists
        applicant.notes = applicant.notes || [];

        const newNote = {
            by: authorEmail, // In real app, get from authenticated user session
            timestamp: new Date().toISOString(),
            text: noteText
        };

        applicant.notes.push(newNote); // Add to the start for reverse chrono: applicant.notes.unshift(newNote);
        applicant.notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort descending

        dataStore.updateApplicant(applicant); // Save the updated applicant

        console.log(`Note added for applicant ${applicantId} by ${authorEmail}`);
        res.status(201).json(newNote); // Return the newly created note

    } catch (error) {
        console.error("Error adding note:", error);
        res.status(500).json({ message: 'Failed to add note.' });
    }
});


// --- NEW: Add/Update a Vote ---
router.post('/applicants/:applicantId/vote', async (req, res) => {
    try {
        const applicantId = req.params.applicantId;
        const { voterEmail, voteValue } = req.body; // voteValue: 'yes', 'no', 'maybe', or potentially null/'' to clear vote

        // Basic validation for vote value
        const validVotes = ['yes', 'no', 'maybe', '', null];
        if (!voterEmail || !validVotes.includes(voteValue)) {
            return res.status(400).json({ message: 'Voter email and a valid vote value (yes, no, maybe, null, or empty) are required.' });
        }

        const applicant = dataStore.getApplicant(applicantId);
        if (!applicant) {
            return res.status(404).json({ message: 'Applicant not found.' });
        }

        // Ensure votes object exists
        applicant.votes = applicant.votes || {};

        if (voteValue === '' || voteValue === null) {
            // Allow clearing a vote
            delete applicant.votes[voterEmail];
            console.log(`Vote cleared for applicant ${applicantId} by ${voterEmail}`);
        } else {
            applicant.votes[voterEmail] = voteValue; // Add or update the vote
            console.log(`Vote '${voteValue}' recorded for applicant ${applicantId} by ${voterEmail}`);
        }

        dataStore.updateApplicant(applicant); // Save the updated applicant

        res.status(200).json(applicant.votes); // Return the updated votes object

    } catch (error) {
        console.error("Error recording vote:", error);
        res.status(500).json({ message: 'Failed to record vote.' });
    }
});
// --- NEW: Get Recruiter Chat History ---
router.get('/chats/:jobId/:applicantId', (req, res) => {
    try {
        const { jobId, applicantId } = req.params;
        if (!jobId || !applicantId) {
            return res.status(400).json({ message: "Job ID and Applicant ID are required." });
        }
        // Optional: Check if job/applicant actually exist for better validation
        const history = dataStore.getRecruiterChatHistory(jobId, applicantId);
        res.status(200).json({ history: history });

    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ message: "Failed to fetch chat history." });
    }
});
// --- NEW: Associate Existing Applicant with a Job ---
router.post('/jobs/:jobId/applicants/:applicantId/associate', async (req, res) => {
    try {
        const { jobId, applicantId } = req.params;
        // Optional: Add 'source' or 'reason' in req.body if needed
        const source = req.body.source || 'Matched from another job';

        console.log(`Attempting to associate Applicant ${applicantId} with Job ${jobId}`);

        const job = dataStore.getJob(jobId);
        const applicant = dataStore.getApplicant(applicantId);

        if (!job || !applicant) {
            return res.status(404).json({ message: 'Job or Applicant not found.' });
        }

        // --- Check if already associated ---
        // Option A: Check if applicant originally applied for this job
        // if (applicant.jobId === jobId) {
        //     return res.status(400).json({ message: 'Applicant originally applied for this job.' });
        // }
        // Option B: Check if already in the job's applicant list (more robust)
        job.applicants = job.applicants || []; // Ensure array exists
        if (job.applicants.includes(applicantId)) {
             console.log(`Applicant ${applicantId} already associated with job ${jobId}`);
             return res.status(200).json({ message: 'Applicant already associated with this job.' , applicantId: applicantId }); // Send success but indicate already done
        }

        // --- Associate Applicant ---
        // 1. Add applicant ID to the Job's applicant list
        job.applicants.push(applicantId);
        dataStore.updateJob(job);

        // 2. Optionally: Update Applicant's status for this NEW job context
        // This is complex if an applicant can be active for multiple jobs.
        // Simplest approach for now: Don't change applicant.currentStageId,
        // just add them to the job list. HM sees them via the ranked list.
        // OR: Add a specific stage like 'shortlisted_match' for this job?
        // For now, we just add to the job list. Ranking will determine visibility.

        console.log(`Successfully associated Applicant ${applicantId} with Job ${jobId}`);
        res.status(200).json({ message: 'Applicant successfully shortlisted for this job.', applicantId: applicantId });

    } catch (error) {
        console.error(`Error associating applicant ${req.params.applicantId} with job ${req.params.jobId}:`, error);
        res.status(500).json({ message: 'Failed to associate applicant with job.' });
    }
});
// --- NEW: Find Potential Matches from Existing Applicants ---
router.get('/jobs/:newJobId/potential-matches', async (req, res) => {
    try {
        const newJobId = req.params.newJobId;
        const newJob = dataStore.getJob(newJobId);

        if (!newJob) {
            return res.status(404).json({ message: 'Newly created job not found.' });
        }

        console.log(`Finding potential matches for new job: ${newJobId} (${newJob.title})`);

        // --- Get ALL existing applicants (excluding those already applied to this new job, if any) ---
        // This could be inefficient for very large numbers of applicants.
        // A database would allow more targeted querying (e.g., by broad skills).
        const allApplicants = Object.values(dataStore.getApplicants());
        const potentialCandidates = allApplicants.filter(app => app.jobId !== newJobId); // Filter out applicants for the *same* job

        console.log(`Found ${potentialCandidates.length} potential existing candidates to evaluate.`);

        if (potentialCandidates.length === 0) {
             return res.json({ matches: [], message: "No existing applicants found from other jobs." });
        }

        // --- Use Gemini/Ranking Service to Score Candidates against the NEW Job ---
        // We reuse the ranking logic, but apply it to existing candidates against the new job desc
        // The 'rankApplicantsForJob' should ideally accept the target job separately
        // For now, we might need a slightly adapted function or pass newJob explicitly
        // Let's assume rankApplicantsForJob can handle this or adapt it:

        // Conceptual modification needed in geminiService.rankApplicantsForJob:
        // It should rank the provided 'potentialCandidates' list against the 'newJob' object.
        // It should store the ranking results under a specific key in the applicant's ranking object,
        // perhaps a temporary one or directly using newJobId IF we decide to store cross-job rankings.
        // For simplicity here, we'll assume it returns ranked data without necessarily saving it permanently
        // to each applicant's main profile immediately unless desired.

        const rankedPotentials = await geminiService.rankApplicantsForJob(newJob, potentialCandidates);

        // --- Format and Select Top Matches ---
        const topMatches = rankedPotentials
            .map(app => ({ // Map to a simpler format for the frontend
                id: app.id,
                name: app.name, // Maybe anonymize later if needed
                email: app.email, // Maybe anonymize later if needed
                originalJobId: app.jobId, // Show which job they originally applied for
                originalJobTitle: dataStore.getJob(app.jobId)?.title || 'N/A', // Get original job title
                overallScore: app.rankings?.[newJobId]?.overallScore || 0, // Get score FOR THE NEW JOB
                summary: app.rankings?.[newJobId]?.generatedSummary || 'N/A' // Get summary FOR THE NEW JOB
            }))
            .sort((a, b) => b.overallScore - a.overallScore) // Sort by score descending
            .slice(0, 10); // Get top 10

        console.log(`Returning top ${topMatches.length} potential matches.`);
        res.json({ matches: topMatches });

    } catch (error) {
        console.error("Error finding potential matches:", error);
        res.status(500).json({ message: 'Failed to find potential matches.' });
    }
});


module.exports = router;