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
    // --- Get References to Splash and App Container ---
    let rankingChartInstance = null; // Store chart instance for later use
    const splashScreen = document.getElementById('splash-screen');
    const appContainer = document.getElementById('app-container');
    
    // --- DOM Elements ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const currentStageObjectivesList = document.getElementById('current-stage-objectives-list');
    const structuredFeedbackFormContainer = document.getElementById('structured-feedback-form-container');

    const voteButtonsContainer = document.querySelector('.vote-buttons'); // Container for buttons
    const voteSummaryDisplay = document.getElementById('vote-summary');
    const addNoteForm = document.getElementById('add-note-form');
    const newNoteText = document.getElementById('new-note-text');
    const noteAuthorEmailInput = document.getElementById('note-author-email'); // Placeholder for user email
    const notesListDisplay = document.getElementById('notes-list');

    const showRankingGraphBtn = document.getElementById('show-ranking-graph-btn');
    const rankingGraphView = document.getElementById('ranking-graph-view');
    const rankingGraphTitle = document.getElementById('ranking-graph-title');
    const rankingChartCanvas = document.getElementById('rankingChart');
    const backToRankedListBtn = document.getElementById('back-to-ranked-list-btn');

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
    // const applicantListDiv = document.getElementById('applicant-list');
    const jobDetailsTitle = document.getElementById('job-details-title');
    const jobDetailsId = document.getElementById('job-details-id');
    const pageTitle = document.getElementById('page-title');
    const submitView = document.getElementById('submit-view');
    const portalView = document.getElementById('portal-view');
    const loadingView = document.getElementById('loading-view');
    const errorView = document.getElementById('error-view');
    const errorMessageP = document.getElementById('error-message');
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
    // const feedbackStageIdInput = document.getElementById('feedback-stage-id');
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
    // Submit View
    const submissionForm = document.getElementById('applicant-submission-form');
    const submitJobTitleH2 = document.getElementById('submit-job-title');
    const submitJobIdInput = document.getElementById('submit-job-id');
    const resumeFileInput = document.getElementById('resume-file-input');
    const uploadDropZone = document.getElementById('upload-drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');
    const submitProgressDiv = document.getElementById('submit-progress');
    const progressBar = submitProgressDiv?.querySelector('.progress-bar');
    const progressText = document.getElementById('progress-text');
    const submitMessageP = document.getElementById('submit-message');
    // Portal View
    const portalApplicantNameSpan = document.getElementById('portal-applicant-name');
    const portalJobTitleStrong = document.getElementById('portal-job-title');
    const portalCurrentStageStrong = document.getElementById('portal-current-stage');
    const portalSummaryP = document.getElementById('portal-summary');
    const portalExperienceDiv = document.getElementById('portal-experience-list');
    const portalSkillsDiv = document.getElementById('portal-skills-list');
    const portalEducationDiv = document.getElementById('portal-education-list');
    const portalCertsDiv = document.getElementById('portal-certs-list');
    const portalFeedbackListDiv = document.getElementById('portal-feedback-list');
    // --- Add New DOM Element References ---
    const jobConfigSection = document.getElementById('job-config-section'); // Placeholder
    const rankedListView = document.getElementById('ranked-list-view');
    const rankedListContainer = document.getElementById('ranked-applicant-list-container');
    const rankedListTitle = document.getElementById('ranked-list-title');
    const applicantSearchInput = document.getElementById('applicant-search');
    const applicantSortSelect = document.getElementById('applicant-sort');
    const toggleAnonymizeBtn = document.getElementById('toggle-anonymize-btn');
    const backToJobConfigBtn = document.getElementById('back-to-job-config-btn');
    
    const backToRankedListFromProfileBtn = document.getElementById('back-to-ranked-list-from-profile-btn');
    // Profile View Elements
    const profileDataColumn = document.querySelector('.profile-data-column');
    const profileInsightsColumn = document.querySelector('.profile-insights-column');
    const profileApplicantName = document.getElementById('profile-applicant-name');
    const profileApplicantEmail = document.getElementById('profile-applicant-email');
    const profileApplicantPhone = document.getElementById('profile-applicant-phone');
    const profileApplicantResume = document.getElementById('profile-applicant-resume'); // Link to original
    const profileSummary = document.getElementById('profile-summary');
    const profileExperienceList = document.getElementById('profile-experience-list');
    const profileSkillsList = document.getElementById('profile-skills-list');
    const profileEducationList = document.getElementById('profile-education-list');
    // Profile Insights Elements
    const profileRankingChartPlaceholder = document.getElementById('profile-ranking-chart-placeholder');
    const profileOverallScore = document.getElementById('profile-overall-score');
    const profileAiSummary = document.getElementById('profile-ai-summary');
    const profileScoreDetailsList = document.querySelector('.score-details'); // Assuming one
    const profileSkillScore = document.getElementById('profile-skill-score');
    const profileExpScore = document.getElementById('profile-exp-score');
    const profileHiddenGem = document.getElementById('profile-hidden-gem');
    const generateInterviewQuestionsBtn = document.getElementById('generate-interview-questions-btn');
    const interviewQuestionsList = document.getElementById('interview-questions-list');
    const viewRankedApplicantsBtn = document.getElementById('view-ranked-applicants-btn'); // Button on job details
    const errorMessageContentP = document.getElementById('error-message-content');
    const regenerateSummaryBtn = document.getElementById('regenerate-summary-btn');


    // --- State ---
    let jobsData = {}; // { jobId: jobObject }
    let applicantsData = {}; // { applicantId: applicantObject }
    let stagesConfig = [];
    let selectedJobId = null; // Start with no job selected
    let selectedApplicantId = null;
    let rationaleIntervalId = null; // To store the ID of the text cycling interval
    let dataLoaded = false; // Flag to track if initial data is loaded
    let currentMode = 'loading'; // loading, submit, portal, error
    let jobId = null;
    let applicantId = null;
    let currentRankedApplicants = []; // Cache for ranked list
    let anonymizedView = false; // Track anonymization state
    let recruiterAiChatHistory = {}; // Store chat history for each applicant
    const currentUserEmail = "recruiter@example.com"; // Placeholder - Replace with actual logged-in user

    const currentTheme = localStorage.getItem('theme');
    // Apply theme on initial load
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        // Default to light if no preference or invalid value
        document.body.classList.remove('dark-mode');
        // Ensure localStorage reflects light state if invalid
        if (currentTheme && currentTheme !== 'light') {
             localStorage.setItem('theme', 'light');
        }
    }

    // --- Event Handlers ---
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode'); // Toggle the class on body

            // Save the new preference
            let theme = 'light';
            if (document.body.classList.contains('dark-mode')) {
                theme = 'dark';
            }
            localStorage.setItem('theme', theme);
            console.log(`Theme set to: ${theme}`);
        });
    }

    if (splashScreen && appContainer) {
        // Set timeout for splash screen
        setTimeout(() => {
            console.log("Splash screen timeout reached. Transitioning...");
            splashScreen.classList.add('hidden'); // Start fading out splash
            appContainer.classList.add('visible'); // Start fading in app

            // Load initial app data *after* initiating the app fade-in
            // This prevents data loading calls from blocking the visual transition start
            if (!dataLoaded) { // Only load data once
                 loadInitialData();
            }

            // Optional: Remove splash screen from DOM after fade-out is complete
             setTimeout(() => {
                if(splashScreen.parentNode) { // Check if it still exists
                     splashScreen.parentNode.removeChild(splashScreen);
                     console.log("Splash screen removed from DOM.");
                }
             }, 800); // Match the opacity transition duration in CSS

        }, 5000); // 5000 milliseconds = 5 seconds
    } else {
        console.error("Splash screen or App container not found! Cannot initialize.");
        // Handle error appropriately - maybe show an error message directly in body
        document.body.innerHTML = "<p>Error initializing application structure.</p>";
        return; // Stop further execution
    }



    // --- API Helper ---
    async function apiRequest(url, method = 'GET', body = null, isFormData = false) { // Added isFormData flag earlier
        const options = { method };
        const headers = {}; // Create headers object
    
        if (!isFormData) { // Only set Content-Type if NOT FormData
            headers['Content-Type'] = 'application/json';
        }
         // Assign headers if they are not empty
        if(Object.keys(headers).length > 0) {
            options.headers = headers;
        }
    
    
        if (body) {
            if (isFormData) {
                options.body = body; // Send FormData directly
            } else if (typeof body === 'object') { // Check if it's an object before stringifying
                // --- ENSURE THIS LINE IS CORRECT ---
                options.body = JSON.stringify(body);
                // ----------------------------------
            } else {
                options.body = body; // Send as is if already a string or other primitive
            }
        }
    
        try {
            console.log(`API Request: ${method} ${url}`, options); // Log options being sent
            const response = await fetch(url, options);
            // --- Modify Error Handling to show response text on failure ---
            if (!response.ok) {
                 const errorText = await response.text(); // Get raw error text from server
                 console.error(`API Error Response Text (${response.status}):`, errorText);
                 // Try to parse as JSON for structured error, otherwise use text
                 let errorMessage = `HTTP error! status: ${response.status}. Response: ${errorText.substring(0, 100)}...`;
                 try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || JSON.stringify(errorJson);
                 } catch (e) { /* Ignore parsing error, use text */ }
                 throw new Error(errorMessage);
            }
            // --- End Modify Error Handling ---
    
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return await response.json();
            } else {
                const text = await response.text();
                // If expecting JSON but got text, log a warning
                if (!isFormData && method !== 'GET' && text && (!contentType || contentType.indexOf("application/json") === -1)) {
                     console.warn(`API Warning: Expected JSON response from ${method} ${url} but received content type ${contentType || 'N/A'}`);
                }
                // Try parsing text responses too, might be JSON without correct header
                try { return JSON.parse(text); } catch(e) { return text || {}; }
            }
        } catch (error) {
            console.error('API Request Function Error:', error); // Log error from the function itself
            alert(`API Error: ${error.message}`);
            throw error;
        }
    }
    
    function clearRecruiterChat(applicantId) {
        // Ensure element ref is valid within this scope or re-select if needed
        const chatDiv = document.getElementById('recruiter-chat-history');
        if (chatDiv) chatDiv.innerHTML = '<p>Ask the AI about this candidate...</p>'; // Clear UI with placeholder

        if (recruiterAiChatHistory[applicantId]) { // Access global state variable
            delete recruiterAiChatHistory[applicantId]; // Clear stored history
            console.log(`Cleared chat history state for applicant ${applicantId}`);
        }
    }
    // Also verify the call site in the recruiterChatForm submit listener:
    // Make sure the object passed as the body is correct
    
   // --- Recruiter Chat Form Listener ---
   if (recruiterChatForm) {
    // The recruiterAiChatHistory variable is now accessible from the outer scope
        recruiterChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const applicantId = aiChatApplicantIdInput.value;
            const jobId = aiChatJobIdInput.value;
            const question = recruiterChatInput.value.trim();

            if (!question || !applicantId || !jobId) return;
            // Add USER message to UI immediately
            addChatMessage(recruiterChatHistoryDiv, 'user', question);
            recruiterChatInput.value = '';
            recruiterChatInput.disabled = true;


            // Manage history using the recruiterAiChatHistory from the outer scope
            try {
                // Send ONLY necessary data - backend manages history storage
                const requestBody = { applicantId, jobId, question };
                console.log("Sending assessment request body:", requestBody);
                // Backend saves history and returns ONLY the new assessment
                const response = await apiRequest('/api/ai/assess-candidate', 'POST', requestBody);

                // Add AI response to UI
                if (response && response.assessment) {
                    addChatMessage(recruiterChatHistoryDiv, 'model', response.assessment);
                    // NO need to update local history array anymore
                } else {
                     console.warn("Unexpected response from /api/ai/assess-candidate:", response);
                     addChatMessage(recruiterChatHistoryDiv, 'model', "Received empty/invalid response.");
                }
            } catch (error) {
                addChatMessage(recruiterChatHistoryDiv, 'model', `Error: Could not get assessment.`);
            } finally {
                recruiterChatInput.disabled = false;
                recruiterChatInput.focus();
            }
        });
    } // End if(recruiterChatForm)
    
    // --- Drag & Drop Logic ---
    if (uploadDropZone && resumeFileInput) {
        uploadDropZone.addEventListener('click', () => resumeFileInput.click());
        resumeFileInput.addEventListener('change', handleFileSelect);

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadDropZone.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadDropZone.addEventListener(eventName, () => uploadDropZone.classList.add('drag-over'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            uploadDropZone.addEventListener(eventName, () => uploadDropZone.classList.remove('drag-over'), false);
        });
        uploadDropZone.addEventListener('drop', handleDrop, false);
    }
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            resumeFileInput.files = files; // Assign dropped file to input
            handleFileSelect(); // Process the file
        }
    }
    function handleFileSelect() {
        if (resumeFileInput.files.length > 0) {
            fileNameDisplay.textContent = `Selected: ${resumeFileInput.files[0].name}`;
        } else {
            fileNameDisplay.textContent = '';
        }
    }

    // --- Form Submission ---
    if (submissionForm) {
        submissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitMessageP.textContent = '';
            submitMessageP.className = 'message';
            submitProgressDiv.style.display = 'block';
            progressBar.style.width = '0%';
            progressText.textContent = 'Preparing upload...';
            const submitButton = document.getElementById('submit-application-btn');
            submitButton.disabled = true;

            const formData = new FormData(submissionForm); // Collects all form fields including file

            // --- Simulate upload progress ---
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15 + 5; // Simulate progress increase
                progress = Math.min(progress, 80); // Cap at 80 before API call
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `Uploading... ${Math.round(progress)}%`;
            }, 300);
            // --- End Simulation ---

            try {
                const result = await apiRequest('/api/applicants/submit', 'POST', formData, true); // Pass true for FormData
                clearInterval(interval); // Stop simulation
                progressBar.style.width = '100%';
                progressText.textContent = result.message || 'Processing complete!';
                submitMessageP.textContent = 'Success! Your application is being processed by our AI.';
                submitMessageP.classList.add('success');
                submissionForm.reset(); // Clear form
                fileNameDisplay.textContent = ''; // Clear file name
                 // Optionally redirect or disable form further
            } catch (error) {
                clearInterval(interval); // Stop simulation on error
                submitProgressDiv.style.display = 'none'; // Hide progress
                submitMessageP.textContent = `Submission Failed: ${error.message}`;
                submitMessageP.classList.add('error');
            } finally {
                submitButton.disabled = false; // Re-enable button
            }
        });
    }
// NEW: Render Notes List
    function renderNotes(notesArray) {
        if (!notesListDisplay) return;
        notesListDisplay.innerHTML = ''; // Clear
        const notes = notesArray || []; // Ensure it's an array

        if (notes.length === 0) {
            notesListDisplay.innerHTML = '<p><i>No notes added yet.</i></p>';
            return;
        }

        notes.forEach(note => {
             const noteDiv = document.createElement('div');
             noteDiv.classList.add('note-item');
             const formattedTimestamp = new Date(note.timestamp).toLocaleString();
             noteDiv.innerHTML = `
                <div class="note-meta">
                    <span class="note-author">${escapeHtml(note.by)}</span>
                    <span class="note-timestamp">${formattedTimestamp}</span>
                </div>
                <p class="note-text">${escapeHtml(note.text)}</p>
             `;
             notesListDisplay.appendChild(noteDiv);
        });
    }

    // NEW: Render Votes and Summary
    function renderVotes(votesObject) {
        if (!voteButtonsContainer || !voteSummaryDisplay) return;
        const votes = votesObject || {};
        const voteCounts = { yes: 0, no: 0, maybe: 0 };
        let myVote = votes[currentUserEmail] || null; // Find current user's vote

        // Update button selected state
        voteButtonsContainer.querySelectorAll('.vote-btn').forEach(button => {
            button.classList.remove('selected-vote'); // Remove from all
            if (button.dataset.vote === myVote && myVote !== null && myVote !== '') {
                 button.classList.add('selected-vote'); // Add to the one matching myVote
            }
             // Disable clear button if no vote selected
             if(button.classList.contains('clear-vote-btn')) {
                  button.disabled = (myVote === null || myVote === '');
             }
        });

        // Calculate summary
        Object.values(votes).forEach(voteValue => {
            if (voteCounts.hasOwnProperty(voteValue)) {
                voteCounts[voteValue]++;
            }
        });

        // Display summary
        let summaryParts = [];
        if (voteCounts.yes > 0) summaryParts.push(`${voteCounts.yes} Yes`);
        if (voteCounts.maybe > 0) summaryParts.push(`${voteCounts.maybe} Maybe`);
        if (voteCounts.no > 0) summaryParts.push(`${voteCounts.no} No`);

        voteSummaryDisplay.textContent = summaryParts.length > 0 ? `Votes: ${summaryParts.join(', ')}` : 'No votes yet.';
    }

    function renderPortalData(applicant, job) {
        // Basic Info
        portalApplicantNameSpan.textContent = applicant.name || 'Applicant';
        portalJobTitleStrong.textContent = job?.title || 'N/A';
        portalCurrentStageStrong.textContent = getStageName(applicant.currentStageId);

        // Summary
        portalSummaryP.textContent = applicant.parsedSummary || 'No summary available.';
        portalSummaryP.classList.toggle('italic-text', !applicant.parsedSummary);


        // Work Experience
        portalExperienceDiv.innerHTML = ''; // Clear loading
        if (applicant.workExperience && applicant.workExperience.length > 0) {
            applicant.workExperience.forEach(exp => {
                 const div = document.createElement('div');
                 div.classList.add('work-experience-item');
                 div.innerHTML = `
                    <strong>${escapeHtml(exp.company)}</strong> ${escapeHtml(exp.title || '')} <em>(${escapeHtml(exp.duration || 'N/A')}, ${escapeHtml(exp.location || 'N/A')})</em>
                    ${exp.achievements ? `<ul>${exp.achievements.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>` : ''}
                 `; // Simplified display
                 portalExperienceDiv.appendChild(div);
            });
        } else { portalExperienceDiv.innerHTML = '<p>No work experience parsed.</p>'; }

        // Skills
        portalSkillsDiv.innerHTML = '';
        if (applicant.skills && applicant.skills.length > 0) {
           applicant.skills.forEach(skill => {
                const span = document.createElement('span');
                span.classList.add('skill-tag');
                span.innerHTML = `${escapeHtml(skill.name)} ${skill.proficiencyLevel ? `<span class="proficiency">(${escapeHtml(skill.proficiencyLevel)})</span>` : ''}`;
                portalSkillsDiv.appendChild(span);
           });
        } else { portalSkillsDiv.innerHTML = '<p>No skills parsed.</p>'; }

       // Education
       portalEducationDiv.innerHTML = '';
       if (applicant.education && applicant.education.length > 0) {
            applicant.education.forEach(edu => {
                const p = document.createElement('p');
                p.innerHTML = `<strong>${escapeHtml(edu.degree || 'Degree N/A')}</strong> - ${escapeHtml(edu.major || 'Institution N/A')} <em>(${escapeHtml(edu.duration || 'N/A')})</em>`;
                portalEducationDiv.appendChild(p);
            });
       } else { portalEducationDiv.innerHTML = '<p>No education parsed.</p>'; }


       // Certifications
       portalCertsDiv.innerHTML = '';
       if (applicant.certifications && applicant.certifications.length > 0) {
             applicant.certifications.forEach(cert => {
                 const p = document.createElement('p');
                 p.innerHTML = `<strong>${escapeHtml(cert.name)}</strong> ${cert.authority ? `- ${escapeHtml(cert.authority)}` : ''} <em>(${cert.date ? escapeHtml(cert.date) : 'N/A'})</em>`;
                 portalCertsDiv.appendChild(p);
             });
       } else { portalCertsDiv.innerHTML = '<p>No certifications parsed.</p>'; }


        // Feedback (Adapt based on how feedback is structured/shared)
        portalFeedbackListDiv.innerHTML = '<p>No feedback has been shared at this time.</p>'; // Default
        // Add logic here later to fetch and display shared feedback if implemented

        showView('portal-view');
   }

    // --- UI Logic ---
    function showView(viewId) {
        console.log(`Switching view to: ${viewId}`);

        // --- START: Destroy Chart Logic ---
        // If navigating AWAY from the graph view, destroy the chart instance
        if (rankingChartInstance && viewId !== 'ranking-graph-view') {
            console.log("Destroying previous chart instance.");
            rankingChartInstance.destroy();
            rankingChartInstance = null;
        }
        // --- END: Destroy Chart Logic ---

        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        // --- Add Clearing Logic ---
        // If we are NOT showing the applicant details view, clear its potentially stale content
        if (viewId !== 'applicant-details-view') {
            clearApplicantProfilePlaceholders(); // Call helper function
        }
        // --- End Clearing Logic ---

        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.classList.add('active');
            console.log(`Showing view: ${viewId}`);
        } else {
            console.warn(`View ID "${viewId}" not found, showing welcome view.`);
            if (welcomeView) welcomeView.classList.add('active'); // Ensure welcomeView exists
        }
    }
    // --- Ranking Graph Logic ---
    function renderRankingGraph(applicants, jobTitle) {
        if (!rankingChartCanvas) {
            console.error("Canvas element #rankingChart not found!");
            return;
        }
        // Update graph title
        if(rankingGraphTitle) rankingGraphTitle.textContent = `Ranking Visualization for: ${escapeHtml(jobTitle || 'Selected Job')}`;

        // Destroy previous chart if it exists
        if (rankingChartInstance) {
            rankingChartInstance.destroy();
            rankingChartInstance = null;
            console.log("Destroyed existing chart before rendering new one.");
        }

        if (!applicants || applicants.length === 0) {
            console.log("No applicant data to render graph.");
            // Optionally display a message on the canvas context
            const ctx = rankingChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, rankingChartCanvas.width, rankingChartCanvas.height); // Clear canvas
            ctx.textAlign = 'center';
            ctx.fillStyle = '#666';
            ctx.fillText("No applicant data available for graph.", rankingChartCanvas.width / 2, 50);
            return;
        }

        // --- Prepare Data for Chart.js (Example: Radar Chart) ---
        // Limit number of applicants shown for readability?
        const applicantsToShow = applicants.slice(0, 15); // Show top 15

        const labels = applicantsToShow.map(app => anonymizedView ? `Candidate ${app.id?.slice(-4)}` : app.name); // Use anonymized name if needed

        // Define the datasets (categories to plot)
        const datasets = [
            {
                label: 'Overall Score',
                data: applicantsToShow.map(app => app.overallScore ?? 0),
                borderColor: 'rgba(66, 133, 244, 0.8)', // Google Blue
                backgroundColor: 'rgba(66, 133, 244, 0.2)',
                pointBackgroundColor: 'rgba(66, 133, 244, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(66, 133, 244, 1)',
                // tension: 0.1 // Optional line tension
            },
            {
                label: 'Skill Match',
                data: applicantsToShow.map(app => app.skillMatch ?? 0),
                borderColor: 'rgba(52, 168, 83, 0.8)', // Google Green
                backgroundColor: 'rgba(52, 168, 83, 0.2)',
                pointBackgroundColor: 'rgba(52, 168, 83, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(52, 168, 83, 1)',
            },
            {
                label: 'Experience',
                data: applicantsToShow.map(app => app.experienceRelevance ?? 0),
                borderColor: 'rgba(251, 188, 5, 0.8)', // Google Yellow
                backgroundColor: 'rgba(251, 188, 5, 0.2)',
                pointBackgroundColor: 'rgba(251, 188, 5, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(251, 188, 5, 1)',
            }
            // Add more datasets for other ranking categories if desired
        ];

        // --- Create Chart ---
        const ctx = rankingChartCanvas.getContext('2d');
        rankingChartInstance = new Chart(ctx, {
            type: 'radar', // Or 'bar', 'bubble', etc.
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Important for sizing within container
                scales: {
                    r: { // Options for the radial axis (the spokes)
                        beginAtZero: true,
                        max: 100, // Assuming scores are percentages
                        angleLines: { display: true, color: 'rgba(0, 0, 0, 0.1)' },
                        grid: { color: 'rgba(0, 0, 0, 0.1)' },
                        pointLabels: { // Labels for each applicant on the axis points
                            font: { size: 10 }
                        },
                        ticks: { // Labels on the scale (0, 20, 40...)
                           backdropColor: 'rgba(255, 255, 255, 0.75)', // Background for ticks
                           stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                // Customize tooltip display
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.r !== null) {
                                    label += context.parsed.r + '%';
                                }
                                return label;
                            }
                        }
                    }
                }
                // Add other chart options as needed
            }
        });
        console.log("Chart rendered.");
    } // End renderRankingGraph


    // --- Event Handlers (Add/Modify) ---

    if (showRankingGraphBtn) {
          showRankingGraphBtn.addEventListener('click', () => {
              if (selectedJobId && currentRankedApplicants.length > 0) {
                  console.log("Showing ranking graph...");
                  renderRankingGraph(currentRankedApplicants, jobsData[selectedJobId]?.title);
                  showView('ranking-graph-view');
              } else {
                  alert("Please select a job and ensure applicants are loaded first.");
              }
          });
      }

     if(backToRankedListBtn) { // Button on Graph View
         backToRankedListBtn.addEventListener('click', () => {
            if (selectedJobId) {
                 showView('ranked-list-view'); // Switch back to list view
            }
         });
    }
    // --- NEW Helper Function to Clear Placeholders ---
    function clearApplicantProfilePlaceholders() {
        console.log("Clearing applicant profile placeholders...");
        if (profileApplicantName) profileApplicantName.textContent = 'Applicant Name'; // Reset headers
        if (profileApplicantEmail) profileApplicantEmail.textContent = 'email';
        if (profileApplicantPhone) profileApplicantPhone.textContent = 'phone';
        if (profileApplicantResume) { profileApplicantResume.href = '#'; profileApplicantResume.style.display = 'none';}
        if (profileSummary) profileSummary.textContent = '';
        if (profileExperienceList) profileExperienceList.innerHTML = '';
        if (profileSkillsList) profileSkillsList.innerHTML = '';
        if (profileEducationList) profileEducationList.innerHTML = '';
        // Right Column
        if (profileRankingChartPlaceholder) profileRankingChartPlaceholder.innerHTML = 'Radar Chart Placeholder'; // Reset placeholder if needed
        if (profileOverallScore) profileOverallScore.textContent = '--';
        if (profileAiSummary) profileAiSummary.textContent = '';
        if (profileSkillScore) profileSkillScore.textContent = '--';
        if (profileExpScore) profileExpScore.textContent = '--';
        // Clear other scores if added to score-details list
        if (profileHiddenGem) profileHiddenGem.style.display = 'none';
        if (interviewQuestionsList) interviewQuestionsList.innerHTML = '';
    }

    function showError(message) {
        console.error("showError called with message:", message); // Log the error message
        if (errorMessageContentP) { // Check if the paragraph element exists
            errorMessageContentP.textContent = message; // Set the specific error message
            showView('error-view'); // Show the error view container
        } else {
            // Fallback if the error view structure is wrong
            console.error("Cannot find #error-message-content element to display error.");
            alert("An error occurred: " + message); // Use simple alert as fallback
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
        // applicantListDiv.innerHTML = '<p>Loading applicants...</p>';

        // jobDetailsFullDesc.textContent = `Department: ${job.department || 'N/A'}\nLocation: ${job.location || 'N/A'}\nStatus: ${job.status || 'N/A'}\n\nDescription:\n${job.description || ''}\n\nRequirements:\n${Array.isArray(job.requirements) ? job.requirements.join('\n') : (job.requirements || '')}\n\nNice to Have:\n${job.niceToHave || 'N/A'}\n\nSalary: ${job.salaryRange || 'N/A'}`;

        renderJobList();
        // loadApplicantsForJob(jobId);
        showView('job-details-view');
    }

    async function selectApplicant(applicantId) {
        if (!selectedJobId) { // Ensure a job context exists
           console.error("Cannot select applicant, no job selected.");
           alert("Internal Error: No job context for selected applicant.");
           return;
        }
        console.log(`Selecting applicant ${applicantId} for job ${selectedJobId}`);
        selectedApplicantId = applicantId;
    
        // Show view immediately and clear placeholders
        showView('applicant-details-view');
        clearApplicantProfilePlaceholders(); // Use the helper to clear/reset the view
        clearRecruiterChat(applicantId);

        // Set key loading texts
        if (profileApplicantName) profileApplicantName.textContent = 'Loading Applicant...';
        if (recruiterChatHistoryDiv) recruiterChatHistoryDiv.innerHTML = '<p><i>Loading chat history...</i></p>'; // Chat loading state
        if (profileSummary) profileSummary.textContent = 'Loading summary...';
        if (profileAiSummary) profileAiSummary.textContent = 'Loading insights...';
    
    
        try {
            // 1. Fetch FULL parsed data for the applicant
            console.log(`Fetching parsed data for applicant ${applicantId}...`);
            // Ensure your backend has the /parsed endpoint implemented
            const fetchProfile = await apiRequest(`/api/applicants/${applicantId}/parsed`);
            
            const fetchChat = apiRequest(`/api/chats/${selectedJobId}/${applicantId}`);
            
            const [applicantData, chatData] = await Promise.all([fetchProfile, fetchChat]);;
            
            console.log("Parsed data received:", JSON.stringify(applicantData, null, 2));
            console.log("Fetching chat history..."), JSON.stringify(fetchChat, null, 2);

            // 2. Find the specific RANKING info for THIS applicant (from cached list is best)
            console.log(`Finding ranking info for applicant ${applicantId} in list:`, currentRankedApplicants);
            let rankingInfo = currentRankedApplicants.find(app => app.id === applicantId);
            console.log("Ranking info found/used:", rankingInfo);

            if (!rankingInfo) {
                 console.warn(`Ranking info for ${applicantId} not found in cached list.`);
                 // Fallback: use an empty/default object
                 rankingInfo = { overallScore: 'N/A', generatedSummary: 'Ranking data missing.', isHiddenGem: false };
            }
            console.log("Ranking info found/used:", JSON.stringify(rankingInfo, null, 2));
    
    
            if (!applicantData) {
                 throw new Error("Failed to load core applicant data.");
            }
    
            // 4. Render the profile using the correct function and data
            renderCandidateProfile(applicantData, rankingInfo);
            renderRecruiterChatHistoryFromData(chatData?.history); // Pass the history array
        } catch (error) {
            console.error(`Error loading/rendering applicant profile ${applicantId}:`, error);
            showError(`Error loading applicant profile: ${error.message}`);
            // Optionally revert view if needed
        }
    }
    // --- NEW: Function to Render Chat History from Data ---
    function renderRecruiterChatHistoryFromData(historyArray) {
        if (!recruiterChatHistoryDiv) return;
        recruiterChatHistoryDiv.innerHTML = ''; // Clear previous
        currentlyDisplayedChatHistory = historyArray || []; // Store locally if needed

        if (currentlyDisplayedChatHistory.length === 0) {
            recruiterChatHistoryDiv.innerHTML = '<p>Ask the AI about this candidate...</p>';
        } else {
            currentlyDisplayedChatHistory.forEach(msg => {
                // Ensure message format is correct before accessing parts
                if (msg && msg.role && msg.parts && msg.parts[0] && typeof msg.parts[0].text === 'string') {
                    addChatMessage(recruiterChatHistoryDiv, msg.role, msg.parts[0].text);
                } else {
                    console.warn("Skipping rendering invalid chat message:", msg);
                }
            });
        }
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

    function renderCandidateProfile(applicant, ranking) {
        console.log("Rendering profile with applicant:", applicant, "and ranking:", ranking);
        console.log(JSON.stringify(applicant, null, 2))
        console.log(JSON.stringify(ranking, null, 2))
        const currentApplicantId = applicant?.id || ranking?.id; // Get ID from either object
        if (!currentApplicantId) {
           console.error("renderCandidateProfile: Cannot determine Applicant ID from data.");
           // Optionally show an error and return
           return;
       }
        // --- Left Column (Parsed Data from 'applicant' object) ---
        if(profileApplicantName) profileApplicantName.textContent = anonymizedView ? `Candidate ${applicant?.id?.slice(-4)}` : (applicant?.name || 'N/A');
        if(profileApplicantEmail) profileApplicantEmail.textContent = anonymizedView ? '---' : (applicant?.email || 'N/A');
        if(profileApplicantPhone) profileApplicantPhone.textContent = anonymizedView ? '---' : (applicant?.phone || 'N/A');
        if(profileApplicantResume) {
            profileApplicantResume.href = applicant?.originalCvPath || '#'; // Use path stored during parsing
            profileApplicantResume.target = applicant?.originalCvPath ? '_blank' : '_self';
            profileApplicantResume.style.display = applicant?.originalCvPath ? 'inline-flex' : 'none';
        }
        if(profileSummary) profileSummary.textContent = applicant?.parsedSummary || 'No summary parsed.';
        if(profileSummary) profileSummary.classList.toggle('italic-text', !applicant?.parsedSummary);

        // Call helper renderers with data from 'applicant' object
        if(profileExperienceList) renderWorkExperience(profileExperienceList, applicant?.workExperience);
        if(profileSkillsList) renderSkills(profileSkillsList, applicant?.skills);
        if(profileEducationList) renderEducation(profileEducationList, applicant?.education);
        // TODO: Render Certs, Links etc.

        // --- Right Column (AI Insights & Ranking from 'ranking' object) ---
        if(profileOverallScore) profileOverallScore.textContent = ranking?.overallScore ?? '--';
        if(profileAiSummary) profileAiSummary.textContent = ranking?.summary || 'No AI summary available.';
        console.log("AI summary text before adding to generated Summary text:", ranking?.generatedSummary);
        console.log("AI summary text before adding to Summary text:", ranking?.summary);
        if(profileSkillScore) profileSkillScore.textContent = ranking?.skillMatch ?? '--';
        if(profileExpScore) profileExpScore.textContent = ranking?.experienceRelevance ?? '--';
        // TODO: Populate other scores if available in ranking object
        if(profileHiddenGem) profileHiddenGem.style.display = ranking?.isHiddenGem ? 'block' : 'none';
        if(interviewQuestionsList) interviewQuestionsList.innerHTML = ''; // Clear previous questions
        
        const summaryText = ranking?.summary || ''; // Default to empty string
        console.log("AI summary text before adding to textContent Summary text:", summaryText);
        const summaryIsPendingOrFailed = !summaryText || summaryText.includes("pending") || summaryText.includes("failed"); // Check for indicator phrases

        if (profileAiSummary) {
            profileAiSummary.textContent = summaryText || 'No AI summary available.'; // Display current summary or placeholder
            profileAiSummary.classList.toggle('italic-text', summaryIsPendingOrFailed); // Italicize if pending/failed
        }
        // --- Populate Hidden Chat Inputs ---
        // currentApplicantId = applicant?.id || ranking?.id; // Get ID again for safety

        if (aiChatApplicantIdInput) aiChatApplicantIdInput.value = currentApplicantId || '';
        if (aiChatJobIdInput) aiChatJobIdInput.value = selectedJobId || ''; // Use selectedJobId
        // --- End Populate ---
        renderCurrentStageDetails(applicant); // Pass the applicant object to render current stage details
        // --- Clear Previous Chat History ---
        if (recruiterChatHistoryDiv) {
            recruiterChatHistoryDiv.innerHTML = '<p>Ask the AI about this candidate...</p>'; // Reset placeholder
        }
        if(recruiterChatInput) recruiterChatInput.value = ''; // Clear input field
        const regenerateBtn = document.getElementById('regenerate-summary-btn'); // Get reference
        if (regenerateBtn) {
            const summaryText = ranking?.summary || '';
            const summaryIsPendingOrFailed = !summaryText || summaryText.toLowerCase().includes("pending") || summaryText.toLowerCase().includes("failed"); // Make checks case-insensitive

            if (summaryIsPendingOrFailed) {
                regenerateBtn.style.display = 'inline-flex'; // Show button
                // --- THESE LINES ARE CRUCIAL ---
                regenerateBtn.dataset.applicantId = currentApplicantId; // Set applicant ID
                regenerateBtn.dataset.jobId = selectedJobId;     // Set job ID (assuming applicant object has jobId)
                // -----------------------------
                if (!regenerateBtn.dataset.applicantId || !regenerateBtn.dataset.jobId) {
                    console.error("Failed to set necessary IDs on regenerate button!", `AppID: ${regenerateBtn.dataset.applicantId}`, `JobID: ${regenerateBtn.dataset.jobId}`);
                    regenerateBtn.style.display = 'none'; // Hide button if IDs are missing
               } else {
                   console.log(`Set data attributes on regenerate button: applicantId=${regenerateBtn.dataset.applicantId}, jobId=${regenerateBtn.dataset.jobId}`);
               }
            } else {
                regenerateBtn.style.display = 'none'; // Hide button
                // Clear attributes when hiding (optional but clean)
                delete regenerateBtn.dataset.applicantId;
                delete regenerateBtn.dataset.jobId;
            }
        } else {
            console.warn("#regenerate-summary-btn not found in DOM during render.");
            // TODO: Render collaboration section (notes, votes)
        }
        // --- Render Collaboration Sections ---
        renderNotes(applicant?.notes); // Pass notes array
        renderVotes(applicant?.votes); // Pass votes object
        // --- End Render ---           
        if (noteAuthorEmailInput) noteAuthorEmailInput.value = currentUserEmail;

        console.log("Profile rendering complete, chat inputs populated.");

        console.log("Profile rendering complete.");
    }
   
    function renderWorkExperience(container, experiences) {
        console.log("Rendering Work Experience. Data:", experiences);
        if (!container) return; // Safety check
        container.innerHTML = ''; // Clear

        if (!experiences || !Array.isArray(experiences) || experiences.length === 0) {
            container.innerHTML = '<p><i>No work experience parsed.</i></p>'; return;
    }
   
    experiences.forEach(exp => {
         if(!exp) { console.warn("Skipping invalid experience item"); return; }
         const div = document.createElement('div');
         div.classList.add('work-experience-item'); // Use timeline styles if desired

         // --- START: Inner HTML Creation ---
         div.innerHTML = `
            <strong>${escapeHtml(exp.title || 'Role N/A')}</strong> at <strong>${escapeHtml(exp.company || 'Company N/A')}</strong>
            <br>
            <em>${escapeHtml(exp.duration || 'Duration N/A')}${exp.location ? `, ${escapeHtml(exp.location)}` : ''}</em>
            ${(exp.description || (exp.responsibilities && exp.responsibilities.length > 0) || (exp.achievements && exp.achievements.length > 0)) ? '<div class="exp-details" style="margin-top: 5px; padding-left: 10px; font-size: 0.95em;">' : ''}
            ${exp.description ? `<p style="margin-bottom: 3px;">${escapeHtml(exp.description)}</p>` : ''}
            ${exp.responsibilities && exp.responsibilities.length > 0 ? `<ul style="margin-top: 3px; padding-left: 15px; list-style: disc;">${exp.responsibilities.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` : ''}
            ${exp.achievements && exp.achievements.length > 0 ? `<strong style="display: block; margin-top: 5px; font-size: 0.9em;">Achievements:</strong><ul style="padding-left: 15px; list-style: disc;">${exp.achievements.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>` : ''}
            ${(exp.description || (exp.responsibilities && exp.responsibilities.length > 0) || (exp.achievements && exp.achievements.length > 0)) ? '</div>' : ''}
         `;
         // --- END: Inner HTML Creation ---

         container.appendChild(div);
         // console.log("Appended experience item to DOM:", div); // Keep if needed
    });
    console.log("Finished rendering Work Experience.");
}

function renderSkills(container, skills) {
    console.log("Rendering Skills. Data:", skills);
    if (!container) return; // Safety check
    container.innerHTML = ''; // Clear

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
        container.innerHTML = '<p><i>No skills parsed.</i></p>'; return;
    }

    // Ensure container has the flex styles if not applied globally
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '0.5rem';


    skills.forEach(skill => {
        if(!skill || !skill.name) { console.warn("Skipping invalid skill item:", skill); return; }
        const span = document.createElement('span');
        span.classList.add('skill-tag'); // Use the CSS class defined earlier

        // --- START: Inner HTML Creation ---
        span.innerHTML = `${escapeHtml(skill.name)} ${skill.proficiencyLevel && skill.proficiencyLevel !== 'Unknown' ? `<span class="proficiency">(${escapeHtml(skill.proficiencyLevel)})</span>` : ''}`;
        // --- END: Inner HTML Creation ---

        container.appendChild(span);
        // console.log("Appended Skills item to DOM:", span); // Keep if needed
    });
    console.log("Finished rendering Skills.");
}

function renderEducation(container, educations) {
    console.log("Rendering Education. Data:", educations);
    if (!container) return; // Safety check
    container.innerHTML = ''; // Clear

    if (!educations || !Array.isArray(educations) || educations.length === 0) {
        container.innerHTML = '<p><i>No education parsed.</i></p>'; return;
    }

    educations.forEach(edu => {
        if(!edu) { console.warn("Skipping invalid education item"); return; }
        const p = document.createElement('p');
        p.style.marginBottom = '0.5rem'; // Add spacing between education items

        // --- START: Inner HTML Creation ---
        p.innerHTML = `
            <strong>${escapeHtml(edu.degree || 'Qualification N/A')}</strong>
            ${edu.institution ? `, ${escapeHtml(edu.institution)}` : ''}
            ${edu.specialization ? ` (${escapeHtml(edu.specialization)})` : ''}
            ${edu.duration || edu.graduationDate ? `<br><em>${escapeHtml(edu.duration || edu.graduationDate)}</em>` : ''}
            ${edu.gpa ? `<br><em style="font-size:0.9em;">GPA: ${escapeHtml(edu.gpa)}</em>` : ''}
        `;
        // --- END: Inner HTML Creation ---

        container.appendChild(p);
        // console.log("Appended Education item to DOM:", p); // Keep if needed
    });
    console.log("Finished rendering Education.");
}

    async function generateAndRenderQuestions(applicantId) {
       if (!applicantId || !interviewQuestionsList) return;
       interviewQuestionsList.innerHTML = '<li>Generating questions...</li>';
       generateInterviewQuestionsBtn.disabled = true;
       try {
           const data = await apiRequest(`/api/applicants/${applicantId}/interview-prep`);
           interviewQuestionsList.innerHTML = ''; // Clear loading
           if (data.questions && data.questions.length > 0) {
               data.questions.forEach(q => {
                    const li = document.createElement('li');
                    li.textContent = q;
                    interviewQuestionsList.appendChild(li);
               });
           } else {
               interviewQuestionsList.innerHTML = '<li>Could not generate questions.</li>';
           }
       } catch (error) {
            interviewQuestionsList.innerHTML = `<li class="message error">Error: ${error.message}</li>`;
       } finally {
           generateInterviewQuestionsBtn.disabled = false;
       }
    }
    // --- NEW: Load Ranked Applicants ---
    async function loadRankedApplicants(jobId, applyFilters = false) {
        if (!jobId || !rankedListContainer) return;
        rankedListContainer.innerHTML = '<p>Loading ranked applicants...</p>'; // Loading state
        rankedListTitle.textContent = `Ranked Applicants for: ${jobsData[jobId]?.title || '...'}`;

        try {
            // Fetch ranked data (backend handles ranking logic)
            let rankedData = await apiRequest(`/api/jobs/${jobId}/applicants/ranked`);

            // Apply frontend sorting/filtering if needed
            // TODO: Implement sorting based on applicantSortSelect.value
            // TODO: Implement filtering based on applicantSearchInput.value

            currentRankedApplicants = rankedData; // Cache the full ranked list
            renderRankedApplicantList(currentRankedApplicants); // Render the possibly filtered/sorted list
            showView('ranked-list-view');

        } catch (error) {
            rankedListContainer.innerHTML = '<p class="message error">Error loading ranked applicants.</p>';
        }
    }
    // --- NEW: Render Ranked Applicant List ---
    function renderRankedApplicantList(applicants) {
        rankedListContainer.innerHTML = ''; // Clear previous

        if (!applicants || applicants.length === 0) {
            rankedListContainer.innerHTML = '<p>No applicants found for this job.</p>';
            return;
        }

        // --- Example: Render as a Table ---
        // --- Example: Render as a Table ---
        const table = document.createElement('table');
        table.style.width = '100%'; // Ensure table takes width
        table.style.borderCollapse = 'collapse'; // Optional table styling
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name ${anonymizedView ? '(Anonymized)' : ''}</th>
                    <th>Overall Score</th>
                    <th>Skill Match</th>
                    <th>Experience</th>
                    <th>Summary</th>
                    <th>Stage</th>
                </tr>
            </thead>
            <tbody></tbody>`;
        const tbody = table.querySelector('tbody');

        applicants.forEach(app => {
            const tr = document.createElement('tr');
            tr.dataset.applicantId = app.id; // For click handling
            tr.style.cursor = 'pointer';

            const overallScore = app.overallScore || 0;
            let scoreClass = 'low';
            if (overallScore >= 85) scoreClass = 'high';
            else if (overallScore >= 70) scoreClass = 'medium';
            // --- Check anonymizedView flag here ---
            const displayName = anonymizedView ? `Candidate ${app.id?.slice(-4) || '????'}` : (app.name || 'N/A');
            const displayEmail = anonymizedView ? '---' : (app.email || 'N/A'); // Decide if you want to show email column
            // --- End Check ---
            tr.innerHTML = `
            <td>${escapeHtml(displayName)} ${app.isHiddenGem ? '<span class="hidden-gem-indicator" title="Potential Hidden Gem!">*</span>': ''}</td>
            <td><span class="score-badge ${scoreClass}">${overallScore}%</span></td>
            <td>${app.skillMatch ?? '--'}%</td>
            <td>${app.experienceRelevance ?? '--'}%</td>
            <td title="${escapeHtml(app.summary || '')}">${escapeHtml(app.summary?.substring(0, 50) || 'N/A')}...</td>
            <td>${escapeHtml(app.currentStage || 'N/A')}</td>
        `;
        // Add email cell if desired: <td>${escapeHtml(displayEmail)}</td>

        tr.addEventListener('click', () => selectApplicant(app.id));
        tbody.appendChild(tr);
    });
        rankedListContainer.appendChild(table);
        // --- End Table Example ---
        // --- Update Anonymize Button Text/Icon AFTER rendering ---
        if (toggleAnonymizeBtn) {
            toggleAnonymizeBtn.innerHTML = anonymizedView
                ? '<span class="material-icons">visibility</span> Show Names'
                : '<span class="material-icons">visibility_off</span> Anonymize';
            // Optionally add/remove a class to the button for different styling
            toggleAnonymizeBtn.classList.toggle('anonymized-active', anonymizedView);
        }
    }

    if (toggleAnonymizeBtn) {
        toggleAnonymizeBtn.addEventListener('click', () => {
           anonymizedView = !anonymizedView; // Toggle the state flag
           console.log("Anonymized view toggled to:", anonymizedView);
    
           // Re-render the list using the *cached* applicant data but applying the new flag state
           renderRankedApplicantList(currentRankedApplicants); // Pass the currently loaded data
    
            // Also update the state of the profile view IF it's currently active for this applicant
            if (selectedApplicantId && document.getElementById('applicant-details-view')?.classList.contains('active')) {
                 console.log("Updating currently viewed profile for anonymization state...");
                 // Re-fetch or just re-render using cached data but applying the flag
                 const applicantData = applicantsData[selectedApplicantId]; // Assuming parsed data is in applicantsData
                 const rankingInfo = currentRankedApplicants.find(app => app.id === selectedApplicantId);
                 if (applicantData && rankingInfo) {
                     renderCandidateProfile(applicantData, rankingInfo); // Re-render profile
                 }
            }
        });
    }

   // --- Event Handlers (Add New Ones) ---
   // Listener for Note Form Submission
    if (addNoteForm) {
        addNoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedApplicantId || !newNoteText || !noteAuthorEmailInput) return;

            const noteData = {
                noteText: newNoteText.value,
                authorEmail: noteAuthorEmailInput.value // Use placeholder or real user
            };

            if (!noteData.noteText.trim()) {
                alert("Note cannot be empty.");
                return;
            }

            const submitButton = addNoteForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Adding...';

            try {
                // Call backend to add note
                const newNote = await apiRequest(`/api/applicants/${selectedApplicantId}/notes`, 'POST', noteData);

                // Optimistic UI Update: Add note to local data and re-render
                if (applicantsData[selectedApplicantId]) {
                    applicantsData[selectedApplicantId].notes = applicantsData[selectedApplicantId].notes || [];
                    applicantsData[selectedApplicantId].notes.unshift(newNote); // Add to beginning
                    renderNotes(applicantsData[selectedApplicantId].notes); // Re-render only notes list
                }
                newNoteText.value = ''; // Clear textarea

            } catch (error) {
                alert(`Failed to add note: ${error.message}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Add Note';
            }
        });
    }

    // Listener for Vote Buttons (using event delegation on the container)
    if (voteButtonsContainer) {
        voteButtonsContainer.addEventListener('click', async (e) => {
            // Check if a button inside the container was clicked
            const button = e.target.closest('.vote-btn');
            if (!button || !selectedApplicantId) return; // Exit if not a button or no applicant selected

            const voteValue = button.dataset.vote; // Get 'yes', 'no', 'maybe', or ''
            const voterEmail = currentUserEmail; // Use placeholder or real user

            // Visually update buttons immediately (optimistic)
            voteButtonsContainer.querySelectorAll('.vote-btn').forEach(btn => btn.classList.remove('selected-vote'));
            if(voteValue !== '' && voteValue !== null){ // Don't highlight the clear button
                button.classList.add('selected-vote');
            }
            // Disable clear button if appropriate
            const clearBtn = voteButtonsContainer.querySelector('.clear-vote-btn');
            if(clearBtn) clearBtn.disabled = (voteValue === '' || voteValue === null);


            console.log(`Submitting vote: ${voterEmail} votes '${voteValue}' for ${selectedApplicantId}`);

            try {
                // Call backend to record vote
                const updatedVotes = await apiRequest(`/api/applicants/${selectedApplicantId}/vote`, 'POST', { voterEmail, voteValue });

                // Update local cache and re-render vote summary
                if (applicantsData[selectedApplicantId]) {
                    applicantsData[selectedApplicantId].votes = updatedVotes;
                }
                renderVotes(updatedVotes); // Re-render summary/buttons based on response

            } catch (error) {
                alert(`Failed to record vote: ${error.message}`);
                // Revert optimistic UI update on error?
                renderVotes(applicantsData[selectedApplicantId]?.votes); // Re-render based on previous state
            }
        });
    }
   if(viewRankedApplicantsBtn) {
       viewRankedApplicantsBtn.addEventListener('click', () => {
           if (selectedJobId) {
               loadRankedApplicants(selectedJobId);
           }
       });
   }
   if(backToJobConfigBtn) {
        backToJobConfigBtn.addEventListener('click', () => {
            if (selectedJobId) {
                selectJob(selectedJobId); // Reselect job to show config view
            }
        });
   }
    if(backToRankedListBtn) {
        backToRankedListBtn.addEventListener('click', () => {
           if (selectedJobId) {
                showView('ranked-list-view'); // Just show the view, data should be cached
           }
        });
   }
   if(backToRankedListFromProfileBtn) {
        backToRankedListFromProfileBtn.addEventListener('click', () => {
           if (selectedJobId) {
                showView('ranked-list-view');
           }
        });
   }
    if(generateInterviewQuestionsBtn) {
        generateInterviewQuestionsBtn.addEventListener('click', () => {
           if (selectedApplicantId) {
                generateAndRenderQuestions(selectedApplicantId);
           }
        });
   }
    // if (toggleAnonymizeBtn) {
    //     toggleAnonymizeBtn.addEventListener('click', () => {
    //        anonymizedView = !anonymizedView; // Toggle state
    //        toggleAnonymizeBtn.innerHTML = anonymizedView ? '<span class="material-icons">visibility</span> Show Names' : '<span class="material-icons">visibility_off</span> Anonymize';
    //        renderRankedApplicantList(currentRankedApplicants); // Re-render list with new state
    //     });
    // }
     
     if (regenerateSummaryBtn) {
        regenerateSummaryBtn.addEventListener('click', async (event) => {
            const button = event.currentTarget;
            const applicantId = button.dataset.applicantId;
            const jobId = button.dataset.jobId;

            if (!applicantId || !jobId) {
                console.error("Missing applicantId or jobId on regenerate button.");
                alert("Cannot regenerate summary: Missing context.");
                return;
            }

            console.log(`Regenerate button clicked for Applicant: ${applicantId}, Job: ${jobId}`);
            // Show loading state on button or summary text
            button.disabled = true;
            button.innerHTML = `<span class="material-icons loading-icon" style="animation: spin 1s linear infinite; font-size: 1em; margin-right: 3px;">sync</span> Regenerating...`;
            if (profileAiSummary) profileAiSummary.textContent = 'Regenerating summary...';

            try {
                const result = await apiRequest('/api/ai/regenerate-summary', 'POST', { applicantId, jobId });

                if (result && result.newSummary) {
                    console.log("Successfully regenerated summary:", result.newSummary);
                    // Update the UI immediately
                    if (profileAiSummary) {
                         profileAiSummary.textContent = result.newSummary;
                         profileAiSummary.classList.remove('italic-text'); // Remove italic if it was set
                    }
                    button.style.display = 'none'; // Hide button after successful regeneration

                    // --- OPTIONAL: Update local caches ---
                    // Update currentRankedApplicants cache
                    const rankedIndex = currentRankedApplicants.findIndex(app => app.id === applicantId);
                    if (rankedIndex !== -1) {
                        currentRankedApplicants[rankedIndex].summary = result.newSummary; // Update summary in list cache
                    }
                    // Update applicantsData cache (if it stores detailed ranking)
                    if (applicantsData[applicantId] && applicantsData[applicantId].rankings && applicantsData[applicantId].rankings[jobId]) {
                         applicantsData[applicantId].rankings[jobId].generatedSummary = result.newSummary;
                    }
                    // --- End Optional Cache Update ---

                } else {
                    throw new Error(result?.message || "Regeneration failed to return a new summary.");
                }

            } catch (error) {
                console.error("Failed to regenerate summary:", error);
                alert(`Error regenerating summary: ${error.message}`);
                if (profileAiSummary) profileAiSummary.textContent = 'Regeneration failed. Please try again.';
            } finally {
                // Reset button state even on failure
                button.disabled = false;
                button.innerHTML = `<span class="material-icons" style="font-size: 1em; margin-right: 3px;">refresh</span> Regenerate Summary`;
                // Keep button visible on failure so user can retry
                if(profileAiSummary.textContent.includes("failed")) {
                     button.style.display = 'inline-flex';
                }
            }
        });
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
        console.log("renderCurrentStageDetails called for applicant:", applicant?.id, "Current Stage ID:", applicant?.currentStageId);
        console.log("Current stagesConfig state:", stagesConfig); 

        if (!currentStageNameSpan || /* ... other checks ... */ !currentStageObjectivesList || !structuredFeedbackFormContainer || !currentStageFeedbackListDiv) {
            console.error("DOM elements for current stage details are missing."); return;
        }
        if (!stagesConfig || stagesConfig.length === 0) { /* ... handle no config ... */ return; }

        if (!stagesConfig || stagesConfig.length === 0) {
            console.error("Stages config is empty or not loaded!");
            // Display error message in UI
            if(currentStageObjectivesList) currentStageObjectivesList.innerHTML = '<li>Error: Stage configuration missing.</li>';
            if(structuredFeedbackFormContainer) structuredFeedbackFormContainer.innerHTML = '<p>Cannot load feedback form: Stage configuration missing.</p>';
            return;
       }

        const currentStageConfig = stagesConfig.find(s => s.id === applicant.currentStageId);
        const currentStageHistory = applicant.stageHistory?.find(h => h.stageId === applicant.currentStageId); // Find specific entry
        console.log("Current stage config:", currentStageConfig);
        if (!currentStageConfig) { /* ... handle missing config ... */ return; }

        currentStageNameSpan.textContent = currentStageConfig.name;
        currentStageAssignedSpan.textContent = currentStageHistory?.assignedTo || 'N/A';
        //feedbackStageIdInput.value = applicant.currentStageId; // Keep for old form? Or remove if old form deleted

        // --- Render Objectives ---
        currentStageObjectivesList.innerHTML = ''; // Clear
        if (currentStageConfig.objectives && currentStageConfig.objectives.length > 0) {
            currentStageConfig.objectives.forEach(obj => {
                const li = document.createElement('li');
                li.textContent = escapeHtml(obj);
                currentStageObjectivesList.appendChild(li);
            });
        } else {
             currentStageObjectivesList.innerHTML = '<li>No specific objectives defined for this stage.</li>';
        }

        // --- Render Submitted Feedback ---
        renderSubmittedStructuredFeedback(currentStageHistory?.feedback); // Call helper

        // --- Dynamically Build Feedback Form ---
        buildStructuredFeedbackForm(applicant.id, applicant.currentStageId, currentStageConfig.objectives); // Call helper

        // --- Populate Next Stage Options ---
        populateNextStageOptions(applicant.currentStageId);
    } // End renderCurrentStageDetails


    // --- NEW: Helper to Render Submitted Feedback ---
    function renderSubmittedStructuredFeedback(feedbackArray) {
        if (!currentStageFeedbackListDiv) return;
        currentStageFeedbackListDiv.innerHTML = ''; // Clear

        const feedback = feedbackArray || [];
        if (feedback.length === 0) {
            currentStageFeedbackListDiv.innerHTML = '<p><i>No feedback submitted yet for this stage.</i></p>';
            return;
        }

        feedback.forEach(fb => {
            const fbItem = document.createElement('div');
            fbItem.classList.add('feedback-item');
            const formattedTimestamp = new Date(fb.submittedAt).toLocaleString();

            let objectiveRatingsHtml = '';
            if (fb.objectiveRatings && fb.objectiveRatings.length > 0) {
                 objectiveRatingsHtml = fb.objectiveRatings.map(or => `
                     <div class="feedback-objective-rating">
                         <strong>${escapeHtml(or.objective)}:</strong>
                         ${or.rating ? `<span class="rating-stars">${'★'.repeat(or.rating)}${'☆'.repeat(5 - or.rating)}</span> (${or.rating}/5)` : '<em>No rating</em>'}
                         ${or.comment ? `<p class="objective-comment">${escapeHtml(or.comment)}</p>` : ''}
                     </div>
                 `).join('');
            }

            fbItem.innerHTML = `
                 <div class="note-meta"> <!-- Reuse note meta style -->
                    <span class="note-author">${escapeHtml(fb.by)}</span>
                    <span class="note-timestamp">${formattedTimestamp}</span>
                 </div>
                 ${fb.overallComment ? `<p class="feedback-overall-comment">${escapeHtml(fb.overallComment)}</p>` : ''}
                 ${objectiveRatingsHtml}
            `;
            currentStageFeedbackListDiv.appendChild(fbItem);
        });
    }


    // --- NEW: Helper to Build Feedback Form ---
    function buildStructuredFeedbackForm(applicantId, stageId, objectives) {
        console.log("Building structured feedback form for:", applicantId, stageId, objectives);
        if (!structuredFeedbackFormContainer) return;
        structuredFeedbackFormContainer.innerHTML = ''; // Clear previous form

        const form = document.createElement('form');
        form.id = 'structured-feedback-form'; // Use this ID for the event listener

        // Add Objective Ratings section
        (objectives || []).forEach((objective, index) => {
            const blockDiv = document.createElement('div');
            blockDiv.classList.add('objective-feedback-block');
            blockDiv.dataset.objective = objective; // Store objective text

            const label = document.createElement('label');
            label.classList.add('objective-label');
            label.htmlFor = `objective-rating-${index}`;
            label.textContent = escapeHtml(objective);
            blockDiv.appendChild(label);

            // Rating Input (Example: Radios 1-5)
            const ratingGroup = document.createElement('div');
            ratingGroup.classList.add('rating-group');
            ratingGroup.innerHTML += `<span>Rate (1-5): </span>`;
            for (let i = 1; i <= 5; i++) {
                 ratingGroup.innerHTML += `
                    <label>
                        <input type="radio" name="objective-rating-${index}" value="${i}"> ${i}
                    </label>
                 `;
            }
            ratingGroup.innerHTML += `<label><input type="radio" name="objective-rating-${index}" value="" checked> N/A</label>`; // Default/No Rating option
            blockDiv.appendChild(ratingGroup);

            // Comment Textarea for Objective
            const commentTextarea = document.createElement('textarea');
            commentTextarea.rows = 2;
            commentTextarea.placeholder = `Comments specific to "${escapeHtml(objective)}"...`;
            commentTextarea.id = `objective-comment-${index}`;
            commentTextarea.dataset.objective = objective; // Link comment to objective
            blockDiv.appendChild(commentTextarea);
            console.log("Created objective textarea:", commentTextarea); // <-- ADD LOG

            form.appendChild(blockDiv);
        });
        // After the loop, when creating the overall comment textarea
        const overallCommentTextarea = form.querySelector('#overall-feedback-comment'); // Get reference AFTER adding via innerHTML
        console.log("Overall comment textarea:", overallCommentTextarea); // <-- ADD LOG

        // Add Overall Comment Textarea
        const overallDiv = document.createElement('div');
        overallDiv.classList.add('form-group'); // Reuse form-group style
        overallDiv.innerHTML = `
            <label for="overall-feedback-comment">Overall Comment for this Stage:</label>
            <textarea id="overall-feedback-comment" rows="3" placeholder="General thoughts on performance in this stage..."></textarea>
        `;
        form.appendChild(overallDiv);

        // Add hidden inputs and submit button
        form.innerHTML += `
            <input type="hidden" id="sfb-applicant-id" value="${escapeHtml(applicantId)}">
            <input type="hidden" id="sfb-stage-id" value="${escapeHtml(stageId)}">
            <input type="hidden" id="sfb-author-email" value="${escapeHtml(currentUserEmail)}"> <!-- Placeholder -->
            <button type="submit" class="btn secondary-btn btn-small" style="float: right;">Submit Feedback</button>
            <div style="clear: both;"></div> <!-- Clear float -->
        `;

        structuredFeedbackFormContainer.appendChild(form);

        // --- Add Submit Listener to the NEW form ---
        form.addEventListener('submit', handleStructuredFeedbackSubmit);

    } // End buildStructuredFeedbackForm


    // --- NEW: Submit Handler for Structured Feedback ---
    async function handleStructuredFeedbackSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        const applicantId = form.querySelector('#sfb-applicant-id').value;
        const stageId = form.querySelector('#sfb-stage-id').value;
        const authorEmail = form.querySelector('#sfb-author-email').value;
        const overallComment = form.querySelector('#overall-feedback-comment').value;

        const objectiveRatings = [];
        form.querySelectorAll('.objective-feedback-block').forEach((block, index) => {
             const objective = block.dataset.objective;
             const selectedRatingInput = block.querySelector(`input[name="objective-rating-${index}"]:checked`);
             const rating = selectedRatingInput ? (selectedRatingInput.value ? parseInt(selectedRatingInput.value, 10) : null) : null; // Get rating value or null
             const comment = block.querySelector(`#objective-comment-${index}`).value;

             // Only include if rating or comment exists
             if (rating !== null || comment.trim() !== '') {
                objectiveRatings.push({ objective, rating, comment });
             }
        });

        const feedbackData = { stageId, authorEmail, overallComment, objectiveRatings };

        try {
            const newFeedback = await apiRequest(`/api/applicants/${applicantId}/feedback`, 'POST', feedbackData);

            // Optimistic UI update
            if (applicantsData[applicantId]) {
                 const stageEntry = applicantsData[applicantId].stageHistory?.find(h => h.stageId === stageId);
                 if (stageEntry) {
                      stageEntry.feedback = stageEntry.feedback || [];
                      stageEntry.feedback.push(newFeedback);
                      renderSubmittedStructuredFeedback(stageEntry.feedback); // Re-render list
                 }
            }
             // Clear the form (more complex for dynamic fields)
            form.querySelectorAll('textarea').forEach(ta => ta.value = '');
            form.querySelectorAll('input[type="radio"]').forEach(rb => rb.checked = (rb.value === '')); // Reset radios to N/A

            alert("Feedback submitted successfully!");

        } catch (error) {
            alert(`Failed to submit feedback: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Feedback';
        }
    } // End handleStructuredFeedbackSubmit

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
                console.log("Updated applicant data after feedback submission:", updatedApplicant);
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
                selectApplicant(applicantId); // Re-render the whole details view
                loadApplicantsForJob(updatedApplicant.jobId); // Refresh list view if needed
            } catch (error) { /* Handled by apiRequest */ }
        });
    }

    // if (recruiterChatForm) {
    //     recruiterChatForm.addEventListener('submit', async (e) => {
    //         e.preventDefault();
    //         const applicantId = aiChatApplicantIdInput.value;
    //         const jobId = aiChatJobIdInput.value;
    //         const question = recruiterChatInput.value.trim();

    //         if (!question || !applicantId || !jobId) return;

    //         addChatMessage(recruiterChatHistoryDiv, 'user', question);
    //         recruiterChatInput.value = '';
    //         recruiterChatInput.disabled = true;

    //         try {
    //             const response = await apiRequest('/api/ai/assess-candidate', 'POST', { applicantId, jobId, question });
    //             addChatMessage(recruiterChatHistoryDiv, 'model', response.assessment);
    //         } catch (error) {
    //             addChatMessage(recruiterChatHistoryDiv, 'model', `Error: ${error.message}`);
    //         } finally {
    //             recruiterChatInput.disabled = false;
    //             recruiterChatInput.focus();
    //         }
    //     });
    // }

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

    // async function loadApplicantsForJob(jobId) {
    //      try {
    //         if(!applicantListDiv) return; // Don't load if div doesn't exist
    //         applicantListDiv.innerHTML = '<p>Loading applicants...</p>'; // Set loading state
    //         const applicants = await apiRequest(`/api/jobs/${jobId}/applicants`);
    //          applicants.forEach(app => {
    //              if(app && app.id) applicantsData[app.id] = app;
    //          });
    //         renderApplicantList(jobId);
    //     } catch (error) {
    //         if(applicantListDiv) applicantListDiv.innerHTML = '<p>Error loading applicants.</p>';
    //     }
    // }

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
        if (dataLoaded) return; // Prevent multiple loads
        try {
            console.log("Loading initial data...");
            console.log("Attempting to show welcome view in loadInitialData");
            //showView('welcome-view'); // <--- SET INITIAL VIEW HERE AND DON'T CHANGE IT LATER in loadJobs

            stagesConfig = await apiRequest('/api/config/stages');
            console.log("Loaded stages config:", stagesConfig);

            await loadJobs(); // Load jobs and render the list
            console.log("Initial data load complete. Should be showing Welcome view.");
            dataLoaded = true; // Mark data as loaded

            const activeView = appContainer.querySelector('.view.active');
            if (!activeView && welcomeView) { // If NO view is active yet, show welcome
                 console.log("No view active after load, showing welcome view.");
                 showView('welcome-view');
             } else if (activeView) {
                 console.log(`View ${activeView.id} is already active.`);
             } else {
                 console.warn("Welcome view element not found, cannot set default view.");
             }

        } catch (error) {
            console.error("Failed to load initial data:", error);
            if(welcomeView) {
                 welcomeView.innerHTML = `<p class="message error">Failed to load initial application data: ${error.message}</p>`;
                 showView('welcome-view'); // Show error within welcome view
             }
        }
    }
    // --- Initialization ---
    // NOTE: loadInitialData() is now called from the setTimeout callback
    // Do not call it directly here anymore.
    // loadInitialData();
// --- Initialization ---
    // async function initialize() {
    //     const path = window.location.pathname;
    //     console.log("Candidate Initialize: Starting. Pathname is:", path); // <-- ADD THIS
    //     const applyMatch = path.match(/^\/apply\/([a-zA-Z0-9_]+)$/);
    //     const portalMatch = path.match(/^\/portal\/([a-zA-Z0-9_]+)$/);

    //     try {
    //         // Load stages config needed for portal display
    //         stagesConfig = await apiRequest('/api/config/stages');

    //         if (applyMatch) {
    //             currentMode = 'submit';
    //             jobId = applyMatch[1];
    //             submitJobIdInput.value = jobId; // Set hidden field
    //             const jobData = await apiRequest(`/api/jobs/${jobId}`);
    //             submitJobTitleH2.textContent = `Apply for ${jobData?.title || 'Job'}`;
    //             pageTitle.textContent = `Apply for ${jobData?.title || 'Job'}`;
    //             showView('submit-view');
    //         } else if (portalMatch) {
    //             currentMode = 'portal';
    //             applicantId = portalMatch[1];
    //             pageTitle.textContent = 'Application Portal';
    //             // Fetch applicant *and* job data needed for display
    //             const applicantData = await apiRequest(`/api/applicants/${applicantId}`); // Fetch full applicant data
    //             const jobData = applicantData ? await apiRequest(`/api/jobs/${applicantData.jobId}`) : null;
    //             if (applicantData && jobData) {
    //                 renderPortalData(applicantData, jobData);
    //             } else {
    //                 showError('Could not load applicant or job details.');
    //             }
    //         } else {
    //             showError('Invalid URL.');
    //         }
    //     } catch (error) {
    //         // Error already shown by apiRequest helper or specific catches
    //         showView('error-view');
    //     }
    // }
    // initialize();
}); // End DOMContentLoaded listener

// --- END OF public/app.js ---