document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const createJobBtn = document.getElementById('create-job-btn');
    const jobListDiv = document.getElementById('job-list');
    const createJobView = document.getElementById('create-job-view');
    const jobDetailsView = document.getElementById('job-details-view');
    const applicantDetailsView = document.getElementById('applicant-details-view');
    const welcomeView = document.getElementById('welcome-view');
    const createJobForm = document.getElementById('create-job-form');
    const enhanceJdBtn = document.getElementById('enhance-jd-btn');
    const enhancedJdOutputDiv = document.getElementById('enhanced-jd-output');
    const enhancedJdContentCode = document.getElementById('enhanced-jd-content');
    const useEnhancedJdBtn = document.getElementById('use-enhanced-jd-btn');
    const applicantListDiv = document.getElementById('applicant-list');
    const jobDetailsTitle = document.getElementById('job-details-title');
    const jobDetailsId = document.getElementById('job-details-id');
    const jobDetailsFullDesc = document.getElementById('job-details-full-desc');
    const backToJobBtn = document.getElementById('back-to-job-btn');
    // Applicant Details Elements
    const applicantNameH2 = document.getElementById('applicant-name');
    const applicantEmailSpan = document.getElementById('applicant-email');
    const applicantPhoneSpan = document.getElementById('applicant-phone');
    const applicantResumeLink = document.getElementById('applicant-resume');
    const applicantCoverLetterPre = document.getElementById('applicant-cover-letter');
    const applicantAppliedAtSpan = document.getElementById('applicant-applied-at');
    const lifecycleStagesDiv = document.getElementById('lifecycle-stages');
    const currentStageNameSpan = document.getElementById('current-stage-name');
    const currentStageObjectivesSpan = document.getElementById('current-stage-objectives');
    const currentStageAssignedSpan = document.getElementById('current-stage-assigned');
    const currentStageFeedbackListDiv = document.getElementById('current-stage-feedback-list');
    const addFeedbackForm = document.getElementById('add-feedback-form');
    const feedbackApplicantIdInput = document.getElementById('feedback-applicant-id');
    const feedbackStageIdInput = document.getElementById('feedback-stage-id');
    const feedbackCommentTextarea = document.getElementById('feedback-comment');
    const feedbackRatingInput = document.getElementById('feedback-rating');
    const feedbackByInput = document.getElementById('feedback-by'); // Assuming static for now
    const changeStageForm = document.getElementById('change-stage-form');
    const stageChangeApplicantIdInput = document.getElementById('stage-change-applicant-id');
    const stageDecisionSelect = document.getElementById('stage-decision');
    const nextStageSelectorDiv = document.getElementById('next-stage-selector');
    const nextStageIdSelect = document.getElementById('next-stage-id');
    const nextStageAssigneeInput = document.getElementById('next-stage-assignee');
    const overallFeedbackTextarea = document.getElementById('overall-feedback');
    // Recruiter AI Chat Elements
    const recruiterChatHistoryDiv = document.getElementById('recruiter-chat-history');
    const recruiterChatForm = document.getElementById('recruiter-chat-form');
    const aiChatApplicantIdInput = document.getElementById('ai-chat-applicant-id');
    const aiChatJobIdInput = document.getElementById('ai-chat-job-id');
    const recruiterChatInput = document.getElementById('recruiter-chat-input');


    // --- State ---
    let jobsData = {}; // { jobId: jobObject }
    let applicantsData = {}; // { applicantId: applicantObject }
    let stagesConfig = [];
    let selectedJobId = null;
    let selectedApplicantId = null;

    // --- API Helper ---
    async function apiRequest(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
             // Handle cases where response might be empty (e.g., 204 No Content)
             const contentType = response.headers.get("content-type");
             if (contentType && contentType.indexOf("application/json") !== -1) {
                 return await response.json();
             } else {
                 return await response.text(); // Or handle as needed
             }
        } catch (error) {
            console.error('API Request Error:', error);
            alert(`API Error: ${error.message}`); // Simple error feedback
            throw error; // Re-throw for caller handling if needed
        }
    }

    // --- Rendering Functions ---
    function renderJobList() {
        jobListDiv.innerHTML = ''; // Clear list
        console.log("Rendering job list with data:", jobsData);
        if (Object.keys(jobsData).length === 0) {
            jobListDiv.innerHTML = '<p>No jobs created yet.</p>';
            return;
        }
        Object.values(jobsData).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(job => {
            const jobItem = document.createElement('div');
            jobItem.classList.add('job-item');
            jobItem.dataset.jobId = job.id;
            jobItem.innerHTML = `
                <h4>${job.title}</h4>
                <p>${job.location || 'N/A'} - ${job.status}</p>
            `;
            if (job.id === selectedJobId) {
                jobItem.classList.add('selected');
            }
            jobItem.addEventListener('click', () => selectJob(job.id));
            jobListDiv.appendChild(jobItem);
        });
    }

     function renderApplicantList(jobId) {
         applicantListDiv.innerHTML = '<p>Loading applicants...</p>';
         const jobApplicants = Object.values(applicantsData).filter(app => app.jobId === jobId);

         if (jobApplicants.length === 0) {
             applicantListDiv.innerHTML = '<p>No applicants for this job yet.</p>';
             return;
         }

         applicantListDiv.innerHTML = ''; // Clear loading message
         jobApplicants.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)).forEach(applicant => {
             const applicantItem = document.createElement('div');
             applicantItem.classList.add('applicant-item');
             applicantItem.dataset.applicantId = applicant.id;
             applicantItem.innerHTML = `
                <span>${applicant.name} (${applicant.email})</span>
                <span class="stage">${getStageName(applicant.currentStageId)}</span>
             `;
             applicantItem.addEventListener('click', () => selectApplicant(applicant.id));
             applicantListDiv.appendChild(applicantItem);
         });
     }

    function renderApplicantDetails(applicantId) {
        const applicant = applicantsData[applicantId];
        const job = jobsData[applicant.jobId];
        if (!applicant || !job) {
            console.error("Applicant or Job data missing for rendering details");
            return;
        }
        selectedApplicantId = applicantId;

        applicantNameH2.textContent = applicant.name;
        applicantEmailSpan.textContent = applicant.email;
        applicantPhoneSpan.textContent = applicant.phone;
        applicantResumeLink.href = applicant.resumeLink;
        applicantResumeLink.textContent = applicant.resumeLink ? 'View Resume' : 'N/A';
        applicantCoverLetterPre.textContent = applicant.coverLetter || 'No cover letter provided.';
        applicantAppliedAtSpan.textContent = new Date(applicant.appliedAt).toLocaleDateString();

        // Set IDs for forms
        feedbackApplicantIdInput.value = applicantId;
        stageChangeApplicantIdInput.value = applicantId;
        aiChatApplicantIdInput.value = applicantId;
        aiChatJobIdInput.value = job.id; // Needed for AI context

        renderLifecycleStages(applicant);
        renderCurrentStageDetails(applicant);
        renderRecruiterChatHistory(applicant.id, job.id); // Pass job ID too

        showView('applicant-details-view');
    }

     function renderLifecycleStages(applicant) {
         lifecycleStagesDiv.innerHTML = ''; // Clear previous stages
         const currentStageIndex = stagesConfig.findIndex(s => s.id === applicant.currentStageId);

         stagesConfig.forEach((stage, index) => {
             const stageStep = document.createElement('div');
             stageStep.classList.add('stage-step');

              // Determine status: completed, rejected, current, future
             const historyEntry = applicant.stageHistory.find(h => h.stageId === stage.id);
             let stageStatus = 'future'; // Default

             if (historyEntry) {
                 if (historyEntry.status?.includes('completed-passed')) {
                      stageStatus = 'completed';
                 } else if (historyEntry.status?.includes('completed-rejected')) {
                     stageStatus = 'rejected';
                 } else if (stage.id === applicant.currentStageId) {
                     stageStatus = 'current';
                 }
             } else if (index < currentStageIndex && applicant.status !== 'rejected') {
                 // Assume stages before current (if not explicitly rejected) were passed
                 stageStatus = 'completed';
             } else if (stage.id === applicant.currentStageId) {
                 stageStatus = 'current';
             }


             if (stageStatus !== 'future') {
                stageStep.classList.add(stageStatus);
             }


             stageStep.innerHTML = `
                 <div class="stage-dot"></div>
                 <div class="stage-name">${stage.name}</div>
             `;
             lifecycleStagesDiv.appendChild(stageStep);
         });
     }

     function renderCurrentStageDetails(applicant) {
        const currentStageConfig = stagesConfig.find(s => s.id === applicant.currentStageId);
        const currentStageHistory = applicant.stageHistory.find(h => h.stageId === applicant.currentStageId); // Find latest entry for stage

        if (!currentStageConfig) return;

        currentStageNameSpan.textContent = currentStageConfig.name;
        currentStageObjectivesSpan.textContent = currentStageConfig.objectives.join(', ');
        currentStageAssignedSpan.textContent = currentStageHistory?.assignedTo || 'N/A';
        feedbackStageIdInput.value = applicant.currentStageId; // For feedback form

        // Render feedback list for the current stage
        currentStageFeedbackListDiv.innerHTML = '';
        const feedbackForStage = currentStageHistory?.feedback || [];
        if (feedbackForStage.length > 0) {
             feedbackForStage.forEach(fb => {
                 const fbItem = document.createElement('div');
                 fbItem.classList.add('feedback-item');
                 fbItem.innerHTML = `
                     <p>${fb.comment}</p>
                     <strong>By:</strong> ${fb.by} |
                     <strong>Rating:</strong> ${fb.rating || 'N/A'} |
                     <strong>On:</strong> ${new Date(fb.submittedAt).toLocaleString()}
                 `;
                 currentStageFeedbackListDiv.appendChild(fbItem);
             });
         } else {
            currentStageFeedbackListDiv.innerHTML = '<p>No feedback yet for this stage.</p>';
         }

        // Populate next stage options
         populateNextStageOptions(applicant.currentStageId);
     }

      function renderRecruiterChatHistory(applicantId, jobId) {
           // In a real app, you'd likely fetch chat history separately
           // For now, we'll just clear it and rely on future updates
           recruiterChatHistoryDiv.innerHTML = '<p>Ask the AI assistant about this candidate...</p>';
           // Reset input
           recruiterChatInput.value = '';
           aiChatApplicantIdInput.value = applicantId;
           aiChatJobIdInput.value = jobId;
       }

      function addChatMessage(container, role, text) {
           const messageDiv = document.createElement('div');
           messageDiv.classList.add('chat-message', role);
           messageDiv.innerHTML = `<strong>${role === 'user' ? 'You' : 'AI Assistant'}:</strong> ${text}`;
           container.appendChild(messageDiv);
           container.scrollTop = container.scrollHeight; // Scroll to bottom
      }

    // --- UI Logic ---
    function showView(viewId) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.classList.add('active');
        } else {
            welcomeView.classList.add('active'); // Default fallback
        }
    }

     function selectJob(jobId) {
        selectedJobId = jobId;
        selectedApplicantId = null; // Clear applicant selection when changing jobs
        const job = jobsData[jobId];
        jobDetailsTitle.textContent = job.title;
        jobDetailsId.textContent = `ID: ${job.id}`;
        jobDetailsFullDesc.textContent = `Department: ${job.department || 'N/A'}\nLocation: ${job.location}\nStatus: ${job.status}\n\nDescription:\n${job.description}\n\nRequirements:\n${Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements}\n\nNice to Have:\n${job.niceToHave || 'N/A'}\n\nSalary: ${job.salaryRange || 'N/A'}`;

        renderJobList(); // Re-render to highlight selection
        loadApplicantsForJob(jobId);
        showView('job-details-view');
    }

     function selectApplicant(applicantId) {
         renderApplicantDetails(applicantId); // This also calls showView
     }

     function populateNextStageOptions(currentStageId) {
         nextStageIdSelect.innerHTML = ''; // Clear options
         const currentStageIndex = stagesConfig.findIndex(s => s.id === currentStageId);
         if (currentStageIndex < stagesConfig.length - 1) {
             const nextStage = stagesConfig[currentStageIndex + 1];
             const option = document.createElement('option');
             option.value = nextStage.id;
             option.textContent = nextStage.name;
             nextStageIdSelect.appendChild(option);
             // Add more future stages if needed, though typically only the immediate next one is shown
         } else {
              const option = document.createElement('option');
             option.value = "";
             option.textContent = "Final Stage Reached";
             option.disabled = true;
             nextStageIdSelect.appendChild(option);
         }
     }

      function getStageName(stageId) {
          const stage = stagesConfig.find(s => s.id === stageId);
          return stage ? stage.name : 'Unknown Stage';
      }


    // --- Event Handlers ---
    createJobBtn.addEventListener('click', () => {
        createJobForm.reset(); // Clear form
        enhancedJdOutputDiv.style.display = 'none'; // Hide AI output
        showView('create-job-view');
    });

    enhanceJdBtn.addEventListener('click', async () => {
        const draftData = {
            title: document.getElementById('job-title').value,
            department: document.getElementById('job-department').value,
            location: document.getElementById('job-location').value,
            description: document.getElementById('job-description').value,
            requirements: document.getElementById('job-requirements').value,
            niceToHave: document.getElementById('job-nice-to-have').value,
            salaryRange: document.getElementById('job-salary').value,
        };
        if (!draftData.title || !draftData.description || !draftData.requirements) {
            alert("Please fill in Title, Core Responsibilities, and Required Skills before enhancing.");
            return;
        }
        try {
            enhanceJdBtn.textContent = 'Enhancing...';
            enhanceJdBtn.disabled = true;
            const result = await apiRequest('/api/ai/enhance-jd', 'POST', draftData);
            enhancedJdContentCode.textContent = result.enhancedDescription;
            enhancedJdOutputDiv.style.display = 'block';
        } catch (error) {
            // Error already alerted by apiRequest
        } finally {
            enhanceJdBtn.textContent = 'Enhance with AI';
            enhanceJdBtn.disabled = false;
        }
    });

     useEnhancedJdBtn.addEventListener('click', () => {
         // Very basic parsing - assumes AI follows a predictable structure
         // A more robust solution would parse markdown or structured output
         const enhancedText = enhancedJdContentCode.textContent;
         // Try to extract sections (simple example)
         const descMatch = enhancedText.match(/Description:\s*([\s\S]*?)\s*(?=Requirements:|Required Qualifications:)/i);
         const reqMatch = enhancedText.match(/(?:Requirements:|Required Qualifications:)\s*([\s\S]*?)\s*(?=Nice-to-Have:|Salary:|$)/i);

         if (descMatch && descMatch[1]) {
            document.getElementById('job-description').value = descMatch[1].trim();
         } else {
             // Fallback: put the whole thing in description if parsing fails
             document.getElementById('job-description').value = enhancedText;
         }
         if (reqMatch && reqMatch[1]) {
              document.getElementById('job-requirements').value = reqMatch[1].trim().replace(/-\s/g, ''); // Simple list item removal
         }
          alert("Enhanced content populated. Review and adjust before saving.");
         enhancedJdOutputDiv.style.display = 'none'; // Hide after using
     });


    createJobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const jobData = {
            title: document.getElementById('job-title').value,
            department: document.getElementById('job-department').value,
            location: document.getElementById('job-location').value,
            description: document.getElementById('job-description').value,
            requirements: document.getElementById('job-requirements').value.split(',').map(s => s.trim()).filter(s => s), // Basic comma split
            niceToHave: document.getElementById('job-nice-to-have').value,
            salaryRange: document.getElementById('job-salary').value,
        };
        try {
            const newJob = await apiRequest('/api/jobs', 'POST', jobData);
            jobsData[newJob.id] = newJob; // Add to local cache
            renderJobList();
            selectJob(newJob.id); // Select the newly created job
        } catch (error) {
             // Error already alerted by apiRequest
        }
    });

    backToJobBtn.addEventListener('click', () => {
        if (selectedJobId) {
            selectJob(selectedJobId); // Re-select the job to refresh applicant list maybe
            showView('job-details-view');
        } else {
            showView('welcome-view');
        }
    });

     addFeedbackForm.addEventListener('submit', async (e) => {
         e.preventDefault();
         const feedbackData = {
             applicantId: feedbackApplicantIdInput.value, // Already set
             stageId: feedbackStageIdInput.value,
             comment: feedbackCommentTextarea.value,
             rating: feedbackRatingInput.value || null,
             feedbackBy: feedbackByInput.value // Get from logged-in user later
         };
          try {
             await apiRequest(`/api/applicants/${feedbackData.applicantId}/feedback`, 'POST', feedbackData);
             feedbackCommentTextarea.value = ''; // Clear form
             feedbackRatingInput.value = '';
             alert("Feedback submitted successfully!");
             // Reload applicant data to show new feedback
             await loadApplicant(feedbackData.applicantId); // Reload the current applicant
             renderCurrentStageDetails(applicantsData[feedbackData.applicantId]); // Re-render stage details
         } catch (error) {
             // Handle error
         }
     });

      stageDecisionSelect.addEventListener('change', (e) => {
           if (e.target.value === 'passed') {
               nextStageSelectorDiv.style.display = 'block';
           } else {
                nextStageSelectorDiv.style.display = 'none';
           }
       });

       changeStageForm.addEventListener('submit', async (e) => {
           e.preventDefault();
           const applicantId = stageChangeApplicantIdInput.value;
           const decision = stageDecisionSelect.value;
           const currentStageId = applicantsData[applicantId]?.currentStageId;

           if (!decision || !applicantId || !currentStageId) {
                alert("Missing information to change stage.");
                return;
           }

           const stageData = {
               feedbackStatus: decision, // 'passed' or 'rejected'
               overallFeedback: overallFeedbackTextarea.value
           };

           if (decision === 'passed') {
               stageData.newStageId = nextStageIdSelect.value;
               stageData.assignedTo = nextStageAssigneeInput.value || null; // Optional assignee
                if (!stageData.newStageId) {
                    alert("Please select the next stage.");
                    return;
                }
           }

            try {
               const updatedApplicant = await apiRequest(`/api/applicants/${applicantId}/stage`, 'PUT', stageData);
               applicantsData[applicantId] = updatedApplicant; // Update local cache
                alert(`Applicant stage updated to ${getStageName(updatedApplicant.currentStageId)}.`);
               // Re-render the details for the current applicant
                renderApplicantDetails(applicantId);
               // Maybe reload the job view to update status in list?
               loadApplicantsForJob(updatedApplicant.jobId);
           } catch (error) {
               // Handle error
           }
       });

      recruiterChatForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const applicantId = aiChatApplicantIdInput.value;
          const jobId = aiChatJobIdInput.value;
          const question = recruiterChatInput.value.trim();

          if (!question || !applicantId || !jobId) return;

           addChatMessage(recruiterChatHistoryDiv, 'user', question);
           recruiterChatInput.value = '';
           recruiterChatInput.disabled = true; // Disable while waiting

           try {
               const response = await apiRequest('/api/ai/assess-candidate', 'POST', {
                   applicantId,
                   jobId,
                   question
               });
               addChatMessage(recruiterChatHistoryDiv, 'model', response.assessment);
           } catch (error) {
                addChatMessage(recruiterChatHistoryDiv, 'model', `Error: ${error.message}`);
           } finally {
               recruiterChatInput.disabled = false; // Re-enable
                recruiterChatInput.focus();
           }
       });

    // --- Data Loading ---
    async function loadJobs() {
        try {
            const jobs = await apiRequest('/api/jobs');
            console.log("Loaded jobs:", jobs);
            jobsData = jobs.reduce((acc, job) => {
                acc[job.id] = job;
                console.log("Acc loaded:", acc);
                return acc;
            }, {});
            renderJobList();
        } catch (error) {
            jobListDiv.innerHTML = '<p>Error loading jobs.</p>';
        }
    }

     async function loadApplicantsForJob(jobId) {
         try {
            const applicants = await apiRequest(`/api/jobs/${jobId}/applicants`);
             applicants.forEach(app => {
                 applicantsData[app.id] = app; // Update local cache
             });
            renderApplicantList(jobId);
        } catch (error) {
            applicantListDiv.innerHTML = '<p>Error loading applicants.</p>';
        }
    }

     async function loadApplicant(applicantId) {
          try {
            const applicant = await apiRequest(`/api/applicants/${applicantId}`);
            applicantsData[applicant.id] = applicant; // Update local cache
            return applicant;
        } catch (error) {
            console.error(`Error loading applicant ${applicantId}:`, error);
             // Maybe show an error in the applicant view?
             return null;
        }
     }


    async function loadInitialData() {
        try {
            console.log("Loading initial data...");
            // Load stages config first as it's needed for rendering
            stagesConfig = await apiRequest('/api/config/stages');
            console.log("Loaded stages config:", stagesConfig);
             await loadJobs();
                console.log("Loaded jobs data.");
             // Don't load all applicants initially, only when a job is selected
             showView('welcome-view'); // Start at welcome screen
         } catch (error) {
             console.error("Failed to load initial config:", error);
             // Show a global error message maybe
         }

    }

    // --- Initialization ---
    loadInitialData();

});