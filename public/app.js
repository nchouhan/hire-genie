// --- START OF public/app.js ---

// --- Helper Functions (Should be defined globally or at the top) ---
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        console.warn("escapeHtml received non-string:", unsafe);
        try {
            unsafe = String(unsafe);
        } catch (e) {
            return '';
        }
    }
    // Corrected entities
    return unsafe
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "'");
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    console.log("app.js: DOMContentLoaded fired, initializing app.");

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
    // const jobDetailsFullDesc = document.getElementById('job-details-full-desc');
    const backToJobBtn = document.getElementById('back-to-job-btn');
    // Enhance View Elements
    const showEnhanceViewBtn = document.getElementById('show-enhance-view-btn');
    const enhanceJobView = document.getElementById('enhance-job-view');
    const backToJobFromEnhanceBtn = document.getElementById('back-to-job-from-enhance-btn');
    const enhanceJobTitleHeader = document.getElementById('enhance-job-title-header');
    const enhancementFieldsDiv = document.getElementById('enhancement-fields');
    const enhancementRationaleContent = document.getElementById('rationale-content');
    const saveEnhancedJobBtn = document.getElementById('save-enhanced-job-btn');
    const enhanceStatusSpan = document.getElementById('enhance-status');
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

    const jobDetailsDepartment = document.getElementById('job-details-department');
    const jobDetailsLocation = document.getElementById('job-details-location');
    const jobDetailsSalary = document.getElementById('job-details-salary');
    const jobDetailsStatus = document.getElementById('job-details-status');
    const jobDetailsDescription = document.getElementById('job-details-description');
    const jobDetailsRequirementsList = document.getElementById('job-details-requirements-list');
    const jobDetailsNiceToHaveList = document.getElementById('job-details-nice-to-have-list');

    // --- State ---
    let jobsData = {}; // { jobId: jobObject }
    let applicantsData = {}; // { applicantId: applicantObject }
    let stagesConfig = [];
    let selectedJobId = null; // Start with no job selected
    let selectedApplicantId = null;
    let rationaleIntervalId = null; // To store the ID of the text cycling interval

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
             const contentType = response.headers.get("content-type");
             if (contentType && contentType.indexOf("application/json") !== -1) {
                 return await response.json();
             } else {
                 // Handle potentially empty responses (like 204 No Content)
                 const text = await response.text();
                 return text ? JSON.parse(text) : {}; // Attempt parse if text exists, else return empty object
             }
        } catch (error) {
            console.error('API Request Error:', error);
            alert(`API Error: ${error.message}`); // Simple error feedback
            throw error;
        }
    }

    // --- UI Logic ---
    function showView(viewId) {
        console.trace(`Called showView : ${viewId}`);
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.classList.add('active');
            console.log(`Showing view: ${viewId}`);
        } else {
            console.warn(`View ID "${viewId}" not found, showing welcome view.`);
            if (welcomeView) welcomeView.classList.add('active');
        }
    }

    function selectJob(jobId) {
        const job = jobsData[jobId];
        if (!job) {
            console.error(`Job data not found for ID: ${jobId}`);
            showView('welcome-view');
            return;
        }

        console.log("Selecting job:", job);
        selectedJobId = jobId;
        selectedApplicantId = null;
        
        jobDetailsTitle.textContent = job.title || 'N/A'; // Use N/A as fallback
        jobDetailsId.textContent = `ID: ${job.id}`;
        
        // jobDetailsTitle.textContent = job.title;
        // jobDetailsId.textContent = `ID: ${job.id}`;
        // jobDetailsFullDesc.textContent = ''; // Clear previous
        // --- Populate Meta Info ---
        if (jobDetailsDepartment) jobDetailsDepartment.textContent = job.department || 'N/A';
        if (jobDetailsLocation) jobDetailsLocation.textContent = job.location || 'N/A';
        if (jobDetailsSalary) jobDetailsSalary.textContent = job.salaryRange || 'Not specified';
        if (jobDetailsStatus) jobDetailsStatus.textContent = job.status ? capitalizeFirstLetter(job.status) : 'N/A'; // Capitalize status

        // --- Populate Description ---
        if (jobDetailsDescription) jobDetailsDescription.textContent = job.description || 'No description provided.';

        // --- Populate Requirements List ---
        if (jobDetailsRequirementsList) {
            jobDetailsRequirementsList.innerHTML = ''; // Clear previous items
            let requirements = job.requirements;
            if (typeof requirements === 'string') {
                // Try splitting by newline first, then maybe comma if newline fails often
                requirements = requirements.split('\n').map(s => s.trim()).filter(s => s);
            }
            if (Array.isArray(requirements) && requirements.length > 0) {
                requirements.forEach(req => {
                    if(req) { // Ensure req is not empty
                        const li = document.createElement('li');
                        li.textContent = req;
                        jobDetailsRequirementsList.appendChild(li);
                    }
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'N/A';
                li.style.fontStyle = 'italic'; // Indicate not available
                li.style.color = 'var(--text-secondary)';
                li.style.paddingLeft = '0.5rem'; // Reset padding if no bullet needed
                li.style.listStyle = 'none'; // Ensure no default bullet
                jobDetailsRequirementsList.appendChild(li);
            }
        }

        // --- Populate Nice-to-Have List ---
        if (jobDetailsNiceToHaveList) {
            jobDetailsNiceToHaveList.innerHTML = ''; // Clear previous items
            let niceToHave = job.niceToHave;
            if (typeof niceToHave === 'string') {
                niceToHave = niceToHave.split('\n').map(s => s.trim()).filter(s => s);
            }
            if (Array.isArray(niceToHave) && niceToHave.length > 0) {
                niceToHave.forEach(nth => {
                    if(nth){
                        const li = document.createElement('li');
                        li.textContent = nth;
                        jobDetailsNiceToHaveList.appendChild(li);
                    }
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'N/A';
                li.style.fontStyle = 'italic';
                li.style.color = 'var(--text-secondary)';
                li.style.paddingLeft = '0.5rem';
                li.style.listStyle = 'none';
                jobDetailsNiceToHaveList.appendChild(li);
            }
        }
        applicantListDiv.innerHTML = '<p>Loading applicants...</p>';

        // jobDetailsFullDesc.textContent = `Department: ${job.department || 'N/A'}\nLocation: ${job.location || 'N/A'}\nStatus: ${job.status || 'N/A'}\n\nDescription:\n${job.description || ''}\n\nRequirements:\n${Array.isArray(job.requirements) ? job.requirements.join('\n') : (job.requirements || '')}\n\nNice to Have:\n${job.niceToHave || 'N/A'}\n\nSalary: ${job.salaryRange || 'N/A'}`;

        renderJobList();
        loadApplicantsForJob(jobId);
        showView('job-details-view');
    }

    function selectApplicant(applicantId) {
         renderApplicantDetails(applicantId); // This also calls showView
     }

    function getStageName(stageId) {
        const stage = stagesConfig.find(s => s.id === stageId);
        return stage ? stage.name : 'Unknown Stage';
    }

    function addChatMessage(container, role, text) {
        if (!container) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', role);
        messageDiv.innerHTML = `<strong>${role === 'user' ? 'You' : 'AI Assistant'}:</strong> ${escapeHtml(text)}`; // Escape HTML in chat
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    function populateNextStageOptions(currentStageId) {
         nextStageIdSelect.innerHTML = '';
         const currentStageIndex = stagesConfig.findIndex(s => s.id === currentStageId);

         // Ensure stagesConfig is loaded and current stage is found
         if (!stagesConfig || stagesConfig.length === 0 || currentStageIndex === -1) {
             console.warn("Stages config not ready or current stage not found for populating next options.");
             const option = document.createElement('option');
             option.value = "";
             option.textContent = "Stages not loaded";
             option.disabled = true;
             nextStageIdSelect.appendChild(option);
             return;
         }

         if (currentStageIndex < stagesConfig.length - 1) {
             const nextStage = stagesConfig[currentStageIndex + 1];
             const option = document.createElement('option');
             option.value = nextStage.id;
             option.textContent = nextStage.name;
             nextStageIdSelect.appendChild(option);
         } else {
              const option = document.createElement('option');
             option.value = "";
             option.textContent = "Final Stage Reached";
             option.disabled = true;
             nextStageIdSelect.appendChild(option);
         }
     }


    // --- Rendering Functions ---
    function renderJobList() {
        if (!jobListDiv) return; // Safety check
        jobListDiv.innerHTML = ''; // Clear list
        console.log("Rendering job list with data:", jobsData);

        const jobValues = Object.values(jobsData); // Get jobs as an array

        if (jobValues.length === 0) {
            jobListDiv.innerHTML = '<p>No jobs created yet.</p>';
            return;
        }

        jobValues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(job => {
             if (!job || !job.id) { // Skip invalid job entries
                console.warn("Skipping invalid job entry during rendering:", job);
                return;
            }
            const jobItem = document.createElement('div');
            jobItem.classList.add('job-item');
            jobItem.dataset.jobId = job.id;
            // Use escapeHtml for safety, though unlikely needed for these fields
            jobItem.innerHTML = `
                <h4>${escapeHtml(job.title)}</h4>
                <p>${escapeHtml(job.location || 'N/A')} - ${escapeHtml(job.status || 'N/A')}</p>
            `;
            if (job.id === selectedJobId) {
                jobItem.classList.add('selected');
            }
            jobItem.addEventListener('click', () => selectJob(job.id));
            jobListDiv.appendChild(jobItem);
        });
    }

    function renderApplicantList(jobId) {
         if (!applicantListDiv) return;
         applicantListDiv.innerHTML = '<p>Loading applicants...</p>';
         const jobApplicants = Object.values(applicantsData).filter(app => app && app.jobId === jobId); // Add check for valid app

         if (jobApplicants.length === 0) {
             applicantListDiv.innerHTML = '<p>No applicants for this job yet.</p>';
             return;
         }

         applicantListDiv.innerHTML = ''; // Clear loading message
         jobApplicants.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)).forEach(applicant => {
            if (!applicant || !applicant.id) return; // Skip invalid applicants
             const applicantItem = document.createElement('div');
             applicantItem.classList.add('applicant-item');
             applicantItem.dataset.applicantId = applicant.id;
             applicantItem.innerHTML = `
                <span>${escapeHtml(applicant.name)} (${escapeHtml(applicant.email)})</span>
                <span class="stage">${escapeHtml(getStageName(applicant.currentStageId))}</span>
             `;
             applicantItem.addEventListener('click', () => selectApplicant(applicant.id));
             applicantListDiv.appendChild(applicantItem);
         });
     }

    function renderApplicantDetails(applicantId) {
        const applicant = applicantsData[applicantId];
        if (!applicant || !applicant.jobId) {
             console.error("Invalid applicant data for rendering details:", applicantId);
             showView('welcome-view'); // Go back if data is bad
             return;
        }
        const job = jobsData[applicant.jobId];
        if (!job) {
            console.error(`Job data missing (jobId: ${applicant.jobId}) for applicant ${applicantId}`);
            // Decide how to handle - maybe show applicant details without job context?
            // For now, go back to welcome view.
            showView('welcome-view');
            return;
        }
        selectedApplicantId = applicantId;

        // Populate basic info
        applicantNameH2.textContent = applicant.name;
        applicantEmailSpan.textContent = applicant.email;
        applicantPhoneSpan.textContent = applicant.phone;
        applicantResumeLink.href = applicant.resumeLink || '#';
        applicantResumeLink.textContent = applicant.resumeLink ? 'View Resume' : 'N/A';
        applicantResumeLink.target = applicant.resumeLink ? '_blank' : '_self';
        applicantCoverLetterPre.textContent = applicant.coverLetter || 'No cover letter provided.';
        applicantAppliedAtSpan.textContent = new Date(applicant.appliedAt).toLocaleDateString();

        // Set IDs for forms
        feedbackApplicantIdInput.value = applicantId;
        stageChangeApplicantIdInput.value = applicantId;
        aiChatApplicantIdInput.value = applicantId;
        aiChatJobIdInput.value = job.id;

        // Render dynamic sections
        renderLifecycleStages(applicant);
        renderCurrentStageDetails(applicant);
        renderRecruiterChatHistory(applicant.id, job.id);

        showView('applicant-details-view');
    }

    function renderLifecycleStages(applicant) {
         if (!lifecycleStagesDiv) return;
         lifecycleStagesDiv.innerHTML = ''; // Clear previous stages
         if (!stagesConfig || stagesConfig.length === 0) {
              lifecycleStagesDiv.innerHTML = '<p>Stage configuration not loaded.</p>';
              return; // Need stages config to render
         }
         const currentStageIndex = stagesConfig.findIndex(s => s.id === applicant.currentStageId);

         stagesConfig.forEach((stage, index) => {
             const stageStep = document.createElement('div');
             stageStep.classList.add('stage-step');

             const historyEntry = applicant.stageHistory.find(h => h.stageId === stage.id);
             let stageStatus = 'future';

             if (historyEntry) {
                 if (historyEntry.status?.includes('completed-passed')) { stageStatus = 'completed'; }
                 else if (historyEntry.status?.includes('completed-rejected')) { stageStatus = 'rejected'; }
                 else if (stage.id === applicant.currentStageId) { stageStatus = 'current'; }
             } else if (index < currentStageIndex && applicant.status !== 'rejected') { // Simplistic assumption
                 stageStatus = 'completed';
             } else if (stage.id === applicant.currentStageId) {
                 stageStatus = 'current';
             }

             if (stageStatus !== 'future') { stageStep.classList.add(stageStatus); }

             stageStep.innerHTML = `
                 <div class="stage-dot"></div>
                 <div class="stage-name">${escapeHtml(stage.name)}</div>
             `;
             lifecycleStagesDiv.appendChild(stageStep);
         });
     }

    function renderCurrentStageDetails(applicant) {
        // Ensure elements exist
        if (!currentStageNameSpan || !currentStageObjectivesSpan || !currentStageAssignedSpan || !feedbackStageIdInput || !currentStageFeedbackListDiv) {
            console.error("DOM elements for current stage details are missing.");
            return;
        }
        if (!stagesConfig || stagesConfig.length === 0) return; // Need config

        const currentStageConfig = stagesConfig.find(s => s.id === applicant.currentStageId);
        const currentStageHistory = applicant.stageHistory?.find(h => h.stageId === applicant.currentStageId); // Optional chaining

        if (!currentStageConfig) {
             console.warn("Could not find config for current stage:", applicant.currentStageId);
             currentStageNameSpan.textContent = 'Unknown Stage';
             currentStageObjectivesSpan.textContent = 'N/A';
             currentStageAssignedSpan.textContent = 'N/A';
             currentStageFeedbackListDiv.innerHTML = ''; // Clear feedback list
             return;
        }

        currentStageNameSpan.textContent = currentStageConfig.name;
        currentStageObjectivesSpan.textContent = Array.isArray(currentStageConfig.objectives) ? currentStageConfig.objectives.join(', ') : 'N/A';
        currentStageAssignedSpan.textContent = currentStageHistory?.assignedTo || 'N/A';
        feedbackStageIdInput.value = applicant.currentStageId;

        currentStageFeedbackListDiv.innerHTML = ''; // Clear feedback list
        const feedbackForStage = currentStageHistory?.feedback || [];
        if (feedbackForStage.length > 0) {
             feedbackForStage.forEach(fb => {
                 const fbItem = document.createElement('div');
                 fbItem.classList.add('feedback-item');
                 fbItem.innerHTML = `
                     <p>${escapeHtml(fb.comment)}</p>
                     <strong>By:</strong> ${escapeHtml(fb.by)} |
                     <strong>Rating:</strong> ${escapeHtml(fb.rating || 'N/A')} |
                     <strong>On:</strong> ${new Date(fb.submittedAt).toLocaleString()}
                 `;
                 currentStageFeedbackListDiv.appendChild(fbItem);
             });
         } else {
            currentStageFeedbackListDiv.innerHTML = '<p>No feedback yet for this stage.</p>';
         }

        populateNextStageOptions(applicant.currentStageId);
     }

    function renderRecruiterChatHistory(applicantId, jobId) {
           if (!recruiterChatHistoryDiv || !recruiterChatInput || !aiChatApplicantIdInput || !aiChatJobIdInput) return;
           recruiterChatHistoryDiv.innerHTML = '<p>Ask the AI assistant about this candidate...</p>';
           recruiterChatInput.value = '';
           aiChatApplicantIdInput.value = applicantId;
           aiChatJobIdInput.value = jobId;
    }
    function renderEnhancementView(originalJob, suggestions) {
        // Ensure necessary DOM elements are accessible
        const enhancementFieldsDiv = document.getElementById('enhancement-fields');
        const enhanceStatusSpan = document.getElementById('enhance-status');
        const enhancementRationaleContent = document.getElementById('rationale-content');
    
        if (!enhancementFieldsDiv || !enhanceStatusSpan || !enhancementRationaleContent) {
            console.error("Essential DOM elements for renderEnhancementView not found!");
            return;
        }
    
        enhancementFieldsDiv.innerHTML = ''; // Clear loading/previous
        enhanceStatusSpan.textContent = '';
    
        // Display rationale (make sure loading state handled separately in requestEnhancementSuggestions)
        const rationaleContentSpan = document.getElementById('rationale-content');
        // if(rationaleContentSpan) rationaleContentSpan.textContent = suggestions.suggestionsRationale || 'No specific rationale provided.';
        if (rationaleContentSpan) {
            // --- Apply .trim() here ---
            rationaleContentSpan.textContent = (suggestions.suggestionsRationale || 'No specific rationale provided.').trim();
            // --- End change ---
        }
    
        // Define which fields to show for enhancement
        const fieldsToEnhance = [
            { key: 'title', label: 'Job Title', inputType: 'input' },
            { key: 'description', label: 'Description', inputType: 'textarea' },
            { key: 'requirements', label: 'Requirements', inputType: 'textarea' },
            { key: 'niceToHave', label: 'Nice-to-Have', inputType: 'textarea' }
        ];
    
        fieldsToEnhance.forEach(fieldInfo => {
            // --- Get Values ---
            const originalValueRaw = originalJob[fieldInfo.key];
            let originalValueString = '';
            if (Array.isArray(originalValueRaw)) {
                originalValueString = originalValueRaw.join('\n');
            } else {
                originalValueString = originalValueRaw || '';
            }
            const suggestionKey = `suggested${capitalizeFirstLetter(fieldInfo.key)}`;
            const suggestedValue = suggestions[suggestionKey] || originalValueString;
    
            // --- Create Main Section Div ---
            const fieldSectionDiv = document.createElement('div');
            fieldSectionDiv.classList.add('enhancement-field-section');
            fieldSectionDiv.dataset.fieldKey = fieldInfo.key;
            
            // --- Create Field Header ---
            const header = document.createElement('h5');
            header.classList.add('field-section-header');
            header.textContent = fieldInfo.label;
            fieldSectionDiv.appendChild(header);
    
            // --- Create Comparison Wrapper ---
            const comparisonWrapper = document.createElement('div');
            comparisonWrapper.classList.add('comparison-wrapper');
    
            // --- Create Original Column ---
            const originalCol = document.createElement('div');
            originalCol.classList.add('comparison-column', 'original-column');
            originalCol.innerHTML = `<div class="column-label">Original</div>`; // Add label
            const originalContentBox = document.createElement('div');
            originalContentBox.classList.add('content-box', 'original-content');
            originalContentBox.innerHTML = `<pre>${escapeHtml(originalValueString)}</pre>`;
            originalCol.appendChild(originalContentBox);
            comparisonWrapper.appendChild(originalCol);
    
            // --- Create Suggested Column ---
            const suggestedCol = document.createElement('div');
            suggestedCol.classList.add('comparison-column', 'suggested-column');
            suggestedCol.innerHTML = `<div class="column-label">Suggested (Editable)</div>`; // Add label
            const suggestedContentBox = document.createElement('div'); // This box gets the highlight
            suggestedContentBox.classList.add('content-box', 'suggested-content');
            suggestedContentBox.id = `suggested-box-${fieldInfo.key}`; // ID for highlighting parent box
            let inputElement; // Declare here
            if (fieldInfo.inputType === 'textarea') {
                inputElement = document.createElement('textarea');
                inputElement.rows = Math.max(5, (suggestedValue.length / 50)); // Keep row estimate
            } else {
                inputElement = document.createElement('input');
                inputElement.type = 'text';
            }
            inputElement.value = suggestedValue;
            inputElement.id = `suggested-${fieldInfo.key}`; // Keep ID on input itself
            suggestedContentBox.appendChild(inputElement); // Append input into the box
            suggestedCol.appendChild(suggestedContentBox);
            comparisonWrapper.appendChild(suggestedCol);
    
            // --- Create Actions Column ---
            const actionsCol = document.createElement('div');
            actionsCol.classList.add('comparison-column', 'actions-column');
            const acceptBtn = document.createElement('button');
            acceptBtn.id = `accept-btn-${fieldInfo.key}`;
            acceptBtn.classList.add('btn', 'secondary-btn', 'accept-suggestion-btn');
            acceptBtn.type = 'button';
            acceptBtn.innerHTML = `Use Suggestion <span class="material-icons checkmark-icon" style="display: none;">check</span>`;
            const checkmarkIcon = acceptBtn.querySelector('.checkmark-icon');
            actionsCol.appendChild(acceptBtn);
            comparisonWrapper.appendChild(actionsCol);
    
    
            // --- Event Listener for "Use Suggestion" Button ---
            acceptBtn.addEventListener('click', () => {
                console.log(`--- 'Use Suggestion' clicked for ${fieldInfo.key} ---`);
                try {
                    const currentInputElement = document.getElementById(`suggested-${fieldInfo.key}`);
                    const currentSuggestionBox = document.getElementById(`suggested-box-${fieldInfo.key}`); // Get the parent box
                    if (!currentInputElement || !currentSuggestionBox) {
                        console.error(`Error finding elements for ${fieldInfo.key}`); return;
                    }
    
                    const aiSuggestedValue = suggestions[suggestionKey] || originalValueString;
    
                    // 1. Set Value
                    currentInputElement.value = aiSuggestedValue;
    
                    // 2. Dispatch Input Event
                    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                    currentInputElement.dispatchEvent(inputEvent);
    
                    // 3. Update Button State
                    acceptBtn.classList.add('suggestion-applied-btn');
                    if (checkmarkIcon) checkmarkIcon.style.display = 'inline-block';
    
                    // 4. Apply Highlight to the BOX now
                    currentSuggestionBox.classList.add('suggestion-applied-highlight'); // Add to box
                    console.log("Highlight applied to suggestion box.");
                    // NO Timeout needed to remove highlight permanently
    
                } catch (error) { console.error(`Error in click listener for ${fieldInfo.key}:`, error); }
            }); // End acceptBtn listener
    
    
            // --- Event Listener for Input Edit ---
            inputElement.addEventListener('input', (event) => {
                const targetElement = event.target;
                const relatedBtn = document.getElementById(`accept-btn-${fieldInfo.key}`);
                const relatedSuggestionBox = document.getElementById(`suggested-box-${fieldInfo.key}`); // Get the box
    
                // Reset Button State
                if (relatedBtn && relatedBtn.classList.contains('suggestion-applied-btn')) {
                    relatedBtn.classList.remove('suggestion-applied-btn');
                    const iconInBtn = relatedBtn.querySelector('.checkmark-icon');
                    if (iconInBtn) iconInBtn.style.display = 'none';
                }
    
                // Remove Highlight from BOX on edit
                if (relatedSuggestionBox && relatedSuggestionBox.classList.contains('suggestion-applied-highlight')) {
                    relatedSuggestionBox.classList.remove('suggestion-applied-highlight');
                    console.log(`Removed highlight from suggestion box ${relatedSuggestionBox.id}`);
                }
            }); // End inputElement listener
    
    
            // --- Append Wrapper and Section ---
            fieldSectionDiv.appendChild(comparisonWrapper);
            enhancementFieldsDiv.appendChild(fieldSectionDiv);
    
        }); // End of fieldsToEnhance.forEach
    } // End of renderEnhancementView function

    // function renderEnhancementView(originalJob, suggestions) {
    //     // Ensure necessary DOM elements are accessible
    //     if (!enhancementFieldsDiv || !enhanceStatusSpan || !enhancementRationaleContent) {
    //         console.error("Essential DOM elements for renderEnhancementView not found!");
    //         return;
    //     }

    //     enhancementFieldsDiv.innerHTML = ''; // Clear loading/previous
    //     enhanceStatusSpan.textContent = '';

    //     enhancementRationaleContent.textContent = suggestions.suggestionsRationale || 'No specific rationale provided.';

    //     const fieldsToEnhance = [
    //         { key: 'title', label: 'Job Title', inputType: 'input' },
    //         { key: 'description', label: 'Description', inputType: 'textarea' },
    //         { key: 'requirements', label: 'Requirements', inputType: 'textarea' },
    //         { key: 'niceToHave', label: 'Nice-to-Have', inputType: 'textarea' }
    //     ];

    //     fieldsToEnhance.forEach(fieldInfo => {
    //         const originalValueRaw = originalJob[fieldInfo.key];
    //         let originalValueString = '';
    //         if (Array.isArray(originalValueRaw)) {
    //             originalValueString = originalValueRaw.join('\n');
    //         } else {
    //             originalValueString = originalValueRaw || '';
    //         }

    //         const suggestionKey = `suggested${capitalizeFirstLetter(fieldInfo.key)}`;
    //         const suggestedValue = suggestions[suggestionKey] || originalValueString;

    //         const fieldDiv = document.createElement('div');
    //         fieldDiv.classList.add('enhancement-field');
    //         fieldDiv.dataset.fieldKey = fieldInfo.key;

    //         const originalSide = document.createElement('div');
    //         originalSide.classList.add('original-content');
    //         originalSide.innerHTML = `<strong>Original:</strong><pre>${escapeHtml(originalValueString)}</pre>`;

    //         const suggestedSide = document.createElement('div');
    //         suggestedSide.classList.add('suggested-content');
    //         let inputElement;
    //         if (fieldInfo.inputType === 'textarea') {
    //             inputElement = document.createElement('textarea');
    //             inputElement.rows = Math.max(5, (suggestedValue.length / 50));
    //         } else {
    //             inputElement = document.createElement('input');
    //             inputElement.type = 'text';
    //         }
    //         inputElement.value = suggestedValue;
    //         inputElement.id = `suggested-${fieldInfo.key}`;

    //         const strongTag = document.createElement('strong');
    //         strongTag.textContent = 'Suggested (Editable):';
    //         suggestedSide.appendChild(strongTag);
    //         suggestedSide.appendChild(inputElement);

    //         const actionsSide = document.createElement('div');
    //         actionsSide.classList.add('actions');
    //         const acceptBtn = document.createElement('button');
    //         acceptBtn.id = `accept-btn-${fieldInfo.key}`;
    //         acceptBtn.classList.add('btn', 'secondary-btn', 'accept-suggestion-btn');
    //         acceptBtn.type = 'button';
    //         acceptBtn.innerHTML = `Use Suggestion <span class="material-icons checkmark-icon" style="display: none;">check</span>`;
    //         const checkmarkIcon = acceptBtn.querySelector('.checkmark-icon');

    //         acceptBtn.addEventListener('click', () => {
    //             console.log(`--- 'Use Suggestion' clicked for ${fieldInfo.key} ---`);
    //             console.log("Button Element being acted on:", acceptBtn);
    //             console.log("Button current classes BEFORE add:", acceptBtn.classList.toString());
    //             try {
    //                 const currentInputElement = document.getElementById(`suggested-${fieldInfo.key}`);
    //                 if (!currentInputElement) {
    //                     console.error(`ERROR: Could not find input element ID suggested-${fieldInfo.key}`); return;
    //                 }
    //                 console.log("Input Element targeted:", currentInputElement);
    //                 const currentSuggestionKey = `suggested${capitalizeFirstLetter(fieldInfo.key)}`;
    //                 const aiSuggestedValue = suggestions[currentSuggestionKey] || originalValueString;
    //                 console.log("Value to set:", aiSuggestedValue);

    //                 currentInputElement.value = aiSuggestedValue;
    //                 console.log("Input value AFTER setting:", currentInputElement.value);

    //                 const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    //                 currentInputElement.dispatchEvent(inputEvent);
    //                 console.log("Dispatched 'input' event.");

    //                 console.log("Attempting to add 'suggestion-applied-btn' class to button:", acceptBtn);
    //                 acceptBtn.classList.add('suggestion-applied-btn');
    //                 console.log("Button current classes AFTER add:", acceptBtn.classList.toString());

    //                 console.log("Checkmark icon element:", checkmarkIcon);
    //                 if (checkmarkIcon) {
    //                     checkmarkIcon.style.display = 'inline-block';
    //                     console.log("Set checkmark icon display to inline-block.");
    //                 } else { console.error("Could not find checkmark icon!"); }

    //                 // Optional Input Highlight Logic
    //                 const existingTimeoutId = currentInputElement.dataset.highlightTimeoutId;
    //                 if (existingTimeoutId) clearTimeout(parseInt(existingTimeoutId));
    //                 currentInputElement.classList.remove('suggestion-applied-highlight');
    //                 void currentInputElement.offsetWidth;
    //                 currentInputElement.classList.add('suggestion-applied-highlight');
    //                 const timeoutId = setTimeout(() => {
    //                     currentInputElement.classList.remove('suggestion-applied-highlight');
    //                     delete currentInputElement.dataset.highlightTimeoutId;
    //                 }, 1500);
    //                 currentInputElement.dataset.highlightTimeoutId = timeoutId.toString();
    //                 console.log("Highlight logic for input field executed.");

    //             } catch (error) {
    //                 console.error(`Error inside 'Use Suggestion' click listener for ${fieldInfo.key}:`, error);
    //             }
    //         }); // End acceptBtn listener

    //         actionsSide.appendChild(acceptBtn);

    //         inputElement.addEventListener('input', (event) => {
    //             const targetElement = event.target;
    //             const relatedBtnId = `accept-btn-${fieldInfo.key}`;
    //             const relatedBtn = document.getElementById(relatedBtnId);
    //             console.log(`Input event on ${targetElement.id}, looking for button #${relatedBtnId}`);
    //             if (relatedBtn) {
    //                 console.log(`Found button #${relatedBtnId}, current classes: ${relatedBtn.classList.toString()}`);
    //                 if (relatedBtn.classList.contains('suggestion-applied-btn')) {
    //                     console.log(`Removing 'suggestion-applied-btn' from #${relatedBtnId}`);
    //                     relatedBtn.classList.remove('suggestion-applied-btn');
    //                     const iconInBtn = relatedBtn.querySelector('.checkmark-icon');
    //                     if (iconInBtn) {
    //                         iconInBtn.style.display = 'none';
    //                         console.log(`Hid checkmark icon in #${relatedBtnId}`);
    //                     }
    //                 }
    //             } else { console.warn(`Could not find related button #${relatedBtnId}`); }

    //             if (targetElement.classList.contains('suggestion-applied-highlight')) {
    //                 targetElement.classList.remove('suggestion-applied-highlight');
    //                 const existingTimeoutId = targetElement.dataset.highlightTimeoutId;
    //                 if (existingTimeoutId) clearTimeout(parseInt(existingTimeoutId));
    //                 delete targetElement.dataset.highlightTimeoutId;
    //                 console.log(`Removed input highlight from ${targetElement.id}.`);
    //             }
    //         }); // End inputElement listener

    //         fieldDiv.appendChild(originalSide);
    //         fieldDiv.appendChild(suggestedSide);
    //         fieldDiv.appendChild(actionsSide);

    //         enhancementFieldsDiv.appendChild(fieldDiv);
    //     }); // End fieldsToEnhance.forEach
    // } // End renderEnhancementView


    async function requestEnhancementSuggestions(jobId) {
        const job = jobsData[jobId];
        if (!job) return;
    
        // Get references to rationale elements (ensure these are declared outside or passed in)
        const rationaleContainer = document.getElementById('enhancement-rationale');
        const loadingIndicator = rationaleContainer?.querySelector('.loading-indicator');
        const loadingTextSpan = rationaleContainer?.querySelector('.loading-text');
        const rationaleContentWrapper = rationaleContainer?.querySelector('.rationale-content-wrapper');
        const rationaleContentSpan = document.getElementById('rationale-content'); // Original span
    
        if (!rationaleContainer || !loadingIndicator || !loadingTextSpan || !rationaleContentWrapper || !rationaleContentSpan) {
            console.error("Rationale UI elements not found!");
            return; // Exit if elements are missing
        }
    
        enhanceJobTitleHeader.textContent = job.title; // Assuming this is declared outside
        enhancementFieldsDiv.innerHTML = '<p>Requesting AI suggestions...</p>'; // Assuming this is declared outside
        enhanceStatusSpan.textContent = ''; // Assuming this is declared outside
    
        // --- Start Loading State ---
        console.log("Starting AI Rationale loading state...");
        rationaleContainer.classList.add('loading'); // Add loading class to parent
        rationaleContentWrapper.style.display = 'none'; // Hide actual content area
        loadingIndicator.style.display = 'flex'; // Show loading indicator area
    
        // Clear any previous interval
        if (rationaleIntervalId) {
            clearInterval(rationaleIntervalId);
            rationaleIntervalId = null;
        }
    
        // Define the cycling texts
        const loadingTexts = [
            "Analyzing Job Data...",
            "Evaluating Requirements...",
            "Comparing Market Trends...",
            "Generating Insights...",
            "Optimizing Phrasing...",
            "Crafting Suggestions..."
        ];
        let textIndex = 0;
        loadingTextSpan.textContent = loadingTexts[textIndex]; // Set initial text
    
        // Start the interval to cycle text
        rationaleIntervalId = setInterval(() => {
            textIndex = (textIndex + 1) % loadingTexts.length; // Cycle through texts
            loadingTextSpan.textContent = loadingTexts[textIndex];
        }, 1800); // Change text every 1.8 seconds (adjust timing as needed)
        // --- End Start Loading State ---
    
    
        try {
            const suggestions = await apiRequest(`/api/ai/suggest-jd-enhancements/${jobId}`, 'POST');
            if (!suggestions || typeof suggestions !== 'object') {
               throw new Error("Received invalid suggestions format from API.");
            }
            // --- Stop Loading State (Success) ---
            console.log("AI Rationale received, stopping loading state.");
            if (rationaleIntervalId) clearInterval(rationaleIntervalId); rationaleIntervalId = null;
            rationaleContainer.classList.remove('loading');
            loadingIndicator.style.display = 'none';
            rationaleContentWrapper.style.display = 'block'; // Show content area
            rationaleContentSpan.textContent = suggestions.suggestionsRationale || 'No specific rationale provided.'; // Display rationale
            // --- End Stop Loading State ---
    
            renderEnhancementView(job, suggestions); // Pass current job and suggestions
    
        } catch (error) {
            // --- Stop Loading State (Error) ---
             console.error("Error during suggestions fetch, stopping loading state.");
             if (rationaleIntervalId) clearInterval(rationaleIntervalId); rationaleIntervalId = null;
             rationaleContainer.classList.remove('loading');
             loadingIndicator.style.display = 'none';
             rationaleContentWrapper.style.display = 'block'; // Show content area even on error
             rationaleContentSpan.textContent = 'Error loading rationale.'; // Display error message
            // --- End Stop Loading State ---
    
             enhancementFieldsDiv.innerHTML = `<p class="message error">Error getting suggestions: ${error.message}</p>`;
             // Note: rationaleContentSpan inside rationaleContentWrapper handles the rationale display/error
        }
    }

    async function saveEnhancedJob(jobId) {
        enhanceStatusSpan.textContent = 'Saving...';
        enhanceStatusSpan.className = 'message';
        saveEnhancedJobBtn.disabled = true;
    
        const originalJob = jobsData[jobId]; // Get current state from frontend cache
        if (!originalJob) {
            enhanceStatusSpan.textContent = 'Error: Original job data not found in frontend cache.';
            enhanceStatusSpan.classList.add('error');
            saveEnhancedJobBtn.disabled = false;
            return;
        }
        const updatedJobDataFromForm = { ...originalJob }; // Start with original data
    
        // Collect potentially modified values from the enhancement view form fields
        document.querySelectorAll('#enhancement-fields .enhancement-field-section').forEach(fieldDiv => {
             const fieldKey = fieldDiv.dataset.fieldKey;
             const inputElement = fieldDiv.querySelector(`#suggested-${fieldKey}`);
             if (fieldKey && inputElement) {
                try {
                console.log(`Collecting data for field: ${fieldKey}, Input Value:`, inputElement.value); // <-- ADD LOG HERE
                 if ((fieldKey === 'requirements' || fieldKey === 'niceToHave') && typeof originalJob[fieldKey] === 'object' && originalJob[fieldKey] !== null) {
                     // If original was array, try to save as array (split by newline)
                     updatedJobDataFromForm[fieldKey] = inputElement.value.split('\n').map(s => s.trim()).filter(s => s);
                     console.log(` > Processed as Array for ${fieldKey}:`, updatedJobDataFromForm[fieldKey]);
                 } else {
                     // Otherwise save as string
                     updatedJobDataFromForm[fieldKey] = inputElement.value;
                     console.log(` > Processed as String for ${fieldKey}:`, updatedJobDataFromForm[fieldKey]);
                 }
                } catch (assignmentError) {
                    console.error(`Error assigning value for field ${fieldKey}:`, assignmentError);
                }
             } else {
                console.warn(`Could not find input element for field key: ${fieldKey} inside`, fieldDiv); // <-- ADD LOG HERE
            }
        });
        console.log("Final updatedJobDataFromForm object BEFORE sending:", updatedJobDataFromForm);
    
        try {
             console.log("Sending updated Job Data to PUT /api/jobs/", jobId, ":", updatedJobDataFromForm);
    
             // --- Make the PUT request and GET the response ---
             const actuallySavedJob = await apiRequest(`/api/jobs/${jobId}`, 'PUT', updatedJobDataFromForm);
             // --- END ---
    
             if (!actuallySavedJob || !actuallySavedJob.id) {
                 // Handle cases where the backend might not return the full object on update
                 console.warn("PUT request succeeded but didn't return the full updated job object. Using data sent.");
                 // As a fallback, update local cache with the data we SENT
                 jobsData[jobId] = updatedJobDataFromForm;
             } else {
                // --- Update local cache with the CONFIRMED saved data ---
                console.log("Received confirmed saved job data:", actuallySavedJob);
                jobsData[jobId] = actuallySavedJob; // Use the response from the server
                // --- END ---
             }
    
             enhanceStatusSpan.textContent = 'Job updated successfully!';
             enhanceStatusSpan.classList.add('success');
    
             // Automatically go back to job details view after a delay
             setTimeout(() => {
                // Call selectJob which reads from the updated jobsData cache
                selectJob(jobId);
             }, 1500);
    
         } catch (error) {
             enhanceStatusSpan.textContent = `Error saving: ${error.message}`;
             enhanceStatusSpan.classList.add('error');
         } finally {
             saveEnhancedJobBtn.disabled = false;
         }
    }


    // --- Event Handlers ---
    if (createJobBtn) {
        createJobBtn.addEventListener('click', () => {
            console.log("Create New Job button clicked");
            selectedJobId = null;
            selectedApplicantId = null;
            if (createJobForm) createJobForm.reset();
            if (enhancedJdOutputDiv) enhancedJdOutputDiv.style.display = 'none';
            renderJobList(); // Update list selection
            console.log("Attempting to show create view in createJobBtn listener");
            showView('create-job-view');
        });
    }

    if (showEnhanceViewBtn) {
        showEnhanceViewBtn.addEventListener('click', () => {
            if (selectedJobId) {
                requestEnhancementSuggestions(selectedJobId);
                showView('enhance-job-view');
            }
        });
    }

    if (backToJobFromEnhanceBtn) {
        backToJobFromEnhanceBtn.addEventListener('click', () => {
            if (selectedJobId) {
                selectJob(selectedJobId); // Go back and potentially refresh job view
            } else {
                showView('welcome-view');
            }
        });
    }

    if (saveEnhancedJobBtn) {
        saveEnhancedJobBtn.addEventListener('click', () => {
            if (selectedJobId) {
                saveEnhancedJob(selectedJobId);
            }
        });
    }


    if (enhanceJdBtn && enhancedJdContentCode && enhancedJdOutputDiv) {
        enhanceJdBtn.addEventListener('click', async () => {
            const draftData = {
                title: document.getElementById('job-title')?.value, // Optional chaining for safety
                department: document.getElementById('job-department')?.value,
                location: document.getElementById('job-location')?.value,
                description: document.getElementById('job-description')?.value,
                requirements: document.getElementById('job-requirements')?.value,
                niceToHave: document.getElementById('job-nice-to-have')?.value,
                salaryRange: document.getElementById('job-salary')?.value,
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
            } catch (error) { /* Handled by apiRequest */ }
            finally {
                enhanceJdBtn.textContent = 'Enhance with AI';
                enhanceJdBtn.disabled = false;
            }
        });
    }

    if (useEnhancedJdBtn && enhancedJdContentCode) {
        useEnhancedJdBtn.addEventListener('click', () => {
            const enhancedText = enhancedJdContentCode.textContent;
            const descMatch = enhancedText.match(/Description:\s*([\s\S]*?)\s*(?=Requirements:|Required Qualifications:)/i);
            const reqMatch = enhancedText.match(/(?:Requirements:|Required Qualifications:)\s*([\s\S]*?)\s*(?=Nice-to-Have:|Salary:|$)/i);
            const descInput = document.getElementById('job-description');
            const reqInput = document.getElementById('job-requirements');

            if(descInput){
                if (descMatch && descMatch[1]) { descInput.value = descMatch[1].trim(); }
                else { descInput.value = enhancedText; } // Fallback
            }
             if(reqInput){
                if (reqMatch && reqMatch[1]) { reqInput.value = reqMatch[1].trim().replace(/-\s/g, ''); }
             }

            alert("Enhanced content populated. Review and adjust before saving.");
            if (enhancedJdOutputDiv) enhancedJdOutputDiv.style.display = 'none';
        });
    }

    if (createJobForm) {
        createJobForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const jobData = {
                title: document.getElementById('job-title')?.value,
                department: document.getElementById('job-department')?.value,
                location: document.getElementById('job-location')?.value,
                description: document.getElementById('job-description')?.value,
                // Handle requirements as array or string based on how model expects it
                requirements: document.getElementById('job-requirements')?.value.split('\n').map(s => s.trim()).filter(s => s), // Split by newline now?
                niceToHave: document.getElementById('job-nice-to-have')?.value,
                salaryRange: document.getElementById('job-salary')?.value,
            };
            try {
                const newJob = await apiRequest('/api/jobs', 'POST', jobData);
                 if (!newJob || !newJob.id) { throw new Error("Invalid job data returned after creation."); }
                jobsData[newJob.id] = newJob;
                renderJobList();
                selectJob(newJob.id); // Select the new job
            } catch (error) { /* Handled by apiRequest */ }
        });
    }

    if (backToJobBtn) {
        backToJobBtn.addEventListener('click', () => {
            if (selectedJobId) {
                selectJob(selectedJobId);
            } else {
                showView('welcome-view');
            }
        });
    }

    if (addFeedbackForm) {
        addFeedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const feedbackData = {
                applicantId: feedbackApplicantIdInput.value,
                stageId: feedbackStageIdInput.value,
                comment: feedbackCommentTextarea.value,
                rating: feedbackRatingInput.value || null,
                feedbackBy: feedbackByInput.value
            };
            try {
                await apiRequest(`/api/applicants/${feedbackData.applicantId}/feedback`, 'POST', feedbackData);
                feedbackCommentTextarea.value = '';
                feedbackRatingInput.value = '';
                alert("Feedback submitted successfully!");
                const updatedApplicant = await loadApplicant(feedbackData.applicantId);
                if (updatedApplicant) renderCurrentStageDetails(updatedApplicant); // Re-render stage details
            } catch (error) { /* Handled by apiRequest */ }
        });
    }

    if (stageDecisionSelect) {
        stageDecisionSelect.addEventListener('change', (e) => {
            if (nextStageSelectorDiv) {
                 nextStageSelectorDiv.style.display = (e.target.value === 'passed') ? 'block' : 'none';
            }
        });
    }

    if (changeStageForm) {
        changeStageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const applicantId = stageChangeApplicantIdInput.value;
            const decision = stageDecisionSelect.value;
            const currentApplicant = applicantsData[applicantId]; // Get from cache
            const currentStageId = currentApplicant?.currentStageId;

            if (!decision || !applicantId || !currentStageId) {
                alert("Missing information to change stage."); return;
            }

            const stageData = {
                feedbackStatus: decision,
                overallFeedback: overallFeedbackTextarea.value
            };

            if (decision === 'passed') {
                stageData.newStageId = nextStageIdSelect.value;
                stageData.assignedTo = nextStageAssigneeInput.value || null;
                if (!stageData.newStageId) {
                    alert("Please select the next stage."); return;
                }
            }

            try {
                const updatedApplicant = await apiRequest(`/api/applicants/${applicantId}/stage`, 'PUT', stageData);
                 if (!updatedApplicant || !updatedApplicant.id) { throw new Error("Invalid applicant data returned after stage update."); }
                applicantsData[applicantId] = updatedApplicant;
                alert(`Applicant stage updated to ${getStageName(updatedApplicant.currentStageId)}.`);
                renderApplicantDetails(applicantId); // Re-render the whole details view
                loadApplicantsForJob(updatedApplicant.jobId); // Refresh list view if needed
            } catch (error) { /* Handled by apiRequest */ }
        });
    }

    if (recruiterChatForm) {
        recruiterChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const applicantId = aiChatApplicantIdInput.value;
            const jobId = aiChatJobIdInput.value;
            const question = recruiterChatInput.value.trim();

            if (!question || !applicantId || !jobId) return;

            addChatMessage(recruiterChatHistoryDiv, 'user', question);
            recruiterChatInput.value = '';
            recruiterChatInput.disabled = true;

            try {
                const response = await apiRequest('/api/ai/assess-candidate', 'POST', { applicantId, jobId, question });
                addChatMessage(recruiterChatHistoryDiv, 'model', response.assessment);
            } catch (error) {
                addChatMessage(recruiterChatHistoryDiv, 'model', `Error: ${error.message}`);
            } finally {
                recruiterChatInput.disabled = false;
                recruiterChatInput.focus();
            }
        });
    }

    // --- Data Loading Functions ---
    async function loadJobs() {
        try {
            const jobs = await apiRequest('/api/jobs');
            console.log("Loaded jobs from API:", jobs);
            jobsData = jobs.reduce((acc, job) => {
                if (job && job.id) { acc[job.id] = job; }
                else { console.warn("Received invalid job data item:", job); }
                return acc;
            }, {});
            console.log("Processed jobsData map:", jobsData);
            renderJobList(); // ONLY render the list here
            // --- REMOVED VIEW LOGIC FROM HERE ---
            // The view will be set by loadInitialData or user interaction
        } catch (error) {
            console.error("Error in loadJobs:", error);
            if(jobListDiv) jobListDiv.innerHTML = '<p>Error loading jobs.</p>';
            // Don't force welcome view here, let loadInitialData handle initial state
        }
    }

    async function loadApplicantsForJob(jobId) {
         try {
            if(!applicantListDiv) return; // Don't load if div doesn't exist
            applicantListDiv.innerHTML = '<p>Loading applicants...</p>'; // Set loading state
            const applicants = await apiRequest(`/api/jobs/${jobId}/applicants`);
             applicants.forEach(app => {
                 if(app && app.id) applicantsData[app.id] = app;
             });
            renderApplicantList(jobId);
        } catch (error) {
            if(applicantListDiv) applicantListDiv.innerHTML = '<p>Error loading applicants.</p>';
        }
    }

    async function loadApplicant(applicantId) {
          try {
            const applicant = await apiRequest(`/api/applicants/${applicantId}`);
             if (!applicant || !applicant.id) { throw new Error("Invalid applicant data loaded."); }
            applicantsData[applicant.id] = applicant;
            return applicant;
        } catch (error) {
            console.error(`Error loading applicant ${applicantId}:`, error);
            return null;
        }
     }

     async function loadInitialData() {
        try {
            console.log("Loading initial data...");
            console.log("Attempting to show welcome view in loadInitialData");
            showView('welcome-view'); // <--- SET INITIAL VIEW HERE AND DON'T CHANGE IT LATER in loadJobs

            stagesConfig = await apiRequest('/api/config/stages');
            console.log("Loaded stages config:", stagesConfig);

            await loadJobs(); // Load jobs and render the list
            console.log("Initial data load complete. Should be showing Welcome view.");

        } catch (error) {
            console.error("Failed to load initial data:", error);
            if(welcomeView) welcomeView.innerHTML = `<p class="message error">Failed to load initial application data: ${error.message}</p>`;
            showView('welcome-view'); // Ensure welcome view is shown even on error
        }
    }
    // --- Initialization ---
    loadInitialData();

}); // End DOMContentLoaded listener

// --- END OF public/app.js ---