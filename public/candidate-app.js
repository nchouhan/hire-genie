document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const pageTitle = document.getElementById('page-title');
    const applyView = document.getElementById('apply-view');
    const portalView = document.getElementById('portal-view');
    const loadingView = document.getElementById('loading-view');
    const errorView = document.getElementById('error-view');
    const errorMessageP = document.getElementById('error-message');
    // Apply View Elements
    const applicationForm = document.getElementById('application-form');
    const applyJobTitleH2 = document.getElementById('apply-job-title');
    const applyJobIdInput = document.getElementById('apply-job-id');
    const applyMessageP = document.getElementById('apply-message');
    // Portal View Elements
    const portalWelcomeH2 = document.getElementById('portal-welcome');
    const portalApplicantNameSpan = document.getElementById('portal-applicant-name');
    const portalJobTitleStrong = document.getElementById('portal-job-title');
    const portalCurrentStageStrong = document.getElementById('portal-current-stage');
    const portalFeedbackListDiv = document.getElementById('portal-feedback-list');
    const candidateChatHistoryDiv = document.getElementById('candidate-chat-history');
    const candidateChatForm = document.getElementById('candidate-chat-form');
    const chatApplicantIdInput = document.getElementById('chat-applicant-id');
    const candidateChatInput = document.getElementById('candidate-chat-input');
    const chatMessageP = document.getElementById('chat-message');

    // --- State ---
    let currentMode = null; // 'apply' or 'portal'
    let jobId = null;
    let applicantId = null;
    let applicantData = null; // Store fetched applicant data for portal
    let jobData = null; // Store fetched job data
    let stagesConfig = []; // Store stages config


    // --- API Helper ---
    async function apiRequest(url, method = 'GET', body = null) {
        // (Same apiRequest function as in app.js - consider moving to a shared utility file)
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
                return await response.text();
            }
        } catch (error) {
            console.error('API Request Error:', error);
            showError(`API Error: ${error.message}`); // Show error on page
            throw error;
        }
    }

    // --- UI Logic ---
     function showView(viewId) {
        document.querySelectorAll('.view').forEach(view => view.style.display = 'none');
        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.style.display = 'block';
        } else {
            showError("Invalid application state.");
        }
    }

    function showError(message) {
        errorMessageP.textContent = message;
        showView('error-view');
    }

     function addChatMessage(container, role, text) {
          // (Same function as in app.js)
          const messageDiv = document.createElement('div');
          messageDiv.classList.add('chat-message', role);
          // Distinguish sender clearly for candidate
          messageDiv.innerHTML = `<strong>${role === 'user' ? 'You' : 'Assistant'}:</strong> ${text}`;
          container.appendChild(messageDiv);
          container.scrollTop = container.scrollHeight;
     }

      function getStageName(stageId) {
          // (Same function as in app.js)
          const stage = stagesConfig.find(s => s.id === stageId);
          return stage ? stage.name : 'Unknown Stage';
      }

    // --- Mode-Specific Logic ---

    async function setupApplyMode(jobIdParam) {
        jobId = jobIdParam;
        applyJobIdInput.value = jobId;
        try {
            // Fetch job details to display the title
            jobData = await apiRequest(`/api/jobs/${jobId}`);
            if (!jobData) {
                 showError(`Job with ID ${jobId} not found or is no longer available.`);
                 return;
            }
            if (jobData.status !== 'open') {
                 showError(`This job (${jobData.title}) is no longer accepting applications.`);
                return;
            }

            pageTitle.textContent = `Apply for ${jobData.title}`;
            applyJobTitleH2.textContent = `Applying for ${jobData.title}`;
            showView('apply-view');
        } catch (error) {
            // Error is already shown by apiRequest helper
            // No need to do anything else here
        }
    }

    async function setupPortalMode(applicantIdParam) {
        applicantId = applicantIdParam;
        chatApplicantIdInput.value = applicantId; // For chat form
        try {
             // Load stages config first
             stagesConfig = await apiRequest('/api/config/stages');
            // Fetch applicant details
            applicantData = await apiRequest(`/api/applicants/${applicantId}`);
            if (!applicantData) {
                 showError(`Applicant portal for ID ${applicantId} not found.`);
                 return;
            }

             // Fetch associated job details for context
             jobData = await apiRequest(`/api/jobs/${applicantData.jobId}`);

             pageTitle.textContent = `Application Portal - ${applicantData.name}`;
             portalWelcomeH2.textContent = `Welcome, ${applicantData.name}!`;
             portalApplicantNameSpan.textContent = applicantData.name; // In case needed elsewhere
             portalJobTitleStrong.textContent = jobData?.title || 'N/A';
             portalCurrentStageStrong.textContent = getStageName(applicantData.currentStageId);


            renderPortalFeedback();
            renderCandidateChatHistory();

            showView('portal-view');
        } catch (error) {
             // Error handled by apiRequest
        }
    }

    function renderPortalFeedback() {
        portalFeedbackListDiv.innerHTML = ''; // Clear
        let feedbackFound = false;
         // Iterate through stage history and display overall feedback if present and passed
         applicantData.stageHistory.forEach(stageEntry => {
            // Only show feedback for stages marked as completed/passed for simplicity
            // Or potentially add a flag 'feedbackVisible' managed by recruiter
             if (stageEntry.status?.includes('completed-passed') && stageEntry.overallFeedback) {
                 const fbItem = document.createElement('div');
                 fbItem.classList.add('feedback-item'); // Reuse style
                 fbItem.innerHTML = `
                      <strong>Feedback for ${getStageName(stageEntry.stageId)}:</strong>
                      <p>${stageEntry.overallFeedback}</p>
                 `;
                 portalFeedbackListDiv.appendChild(fbItem);
                 feedbackFound = true;
             }
         });


        if (!feedbackFound) {
             portalFeedbackListDiv.innerHTML = '<p>No feedback has been shared at this time.</p>';
        }
    }

     function renderCandidateChatHistory() {
          candidateChatHistoryDiv.innerHTML = ''; // Clear previous messages
          if (applicantData && applicantData.chatHistory && applicantData.chatHistory.length > 0) {
              applicantData.chatHistory.forEach(msg => {
                  addChatMessage(candidateChatHistoryDiv, msg.role, msg.parts[0].text);
              });
          } else {
               addChatMessage(candidateChatHistoryDiv, 'model', 'Welcome! Ask me about the role or your application process.');
          }
      }


    // --- Event Handlers ---
    applicationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        applyMessageP.textContent = ''; // Clear previous messages
        applyMessageP.className = 'message'; // Reset class

        const applicationData = {
            name: document.getElementById('applicant-name').value,
            email: document.getElementById('applicant-email').value,
            phone: document.getElementById('applicant-phone').value,
            resumeLink: document.getElementById('applicant-resume-link').value,
            coverLetter: document.getElementById('applicant-cover-letter').value,
            // Source could be added if needed
        };

        const submitButton = applicationForm.querySelector('button[type="submit"]');

        try {
            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;
            const result = await apiRequest(`/api/jobs/${jobId}/apply`, 'POST', applicationData);
            applyMessageP.textContent = result.message || 'Application submitted successfully!';
             applyMessageP.classList.add('success');
            applicationForm.reset(); // Clear form on success
            // Optionally redirect to portal page?
            // window.location.href = `/portal/${result.applicantId}`;
        } catch (error) {
             applyMessageP.textContent = `Submission Failed: ${error.message}`;
             applyMessageP.classList.add('error');
        } finally {
            submitButton.textContent = 'Submit Application';
            submitButton.disabled = false;
        }
    });

      candidateChatForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const message = candidateChatInput.value.trim();
          chatMessageP.textContent = ''; // Clear previous status
           chatMessageP.className = 'message';

          if (!message || !applicantId) return;

           addChatMessage(candidateChatHistoryDiv, 'user', message);
           candidateChatInput.value = '';
           candidateChatInput.disabled = true;

           try {
               const response = await apiRequest('/api/ai/candidate-chat', 'POST', {
                   applicantId,
                   message
               });
               addChatMessage(candidateChatHistoryDiv, 'model', response.reply);
                // Update local applicant data's chat history if needed for consistency
                if(applicantData) {
                     applicantData.chatHistory.push({ role: 'user', parts: [{ text: message }] });
                     applicantData.chatHistory.push({ role: 'model', parts: [{ text: response.reply }] });
                }
           } catch (error) {
               chatMessageP.textContent = `Chat Error: ${error.message}`;
               chatMessageP.classList.add('error');
                // Maybe add error message to chat?
                // addChatMessage(candidateChatHistoryDiv, 'model', `Sorry, I encountered an error: ${error.message}`);
           } finally {
               candidateChatInput.disabled = false;
                candidateChatInput.focus();
           }
       });

    // --- Initialization ---
    function initialize() {
        const path = window.location.pathname;
        const applyMatch = path.match(/^\/apply\/([a-zA-Z0-9_]+)$/);
        const portalMatch = path.match(/^\/portal\/([a-zA-Z0-9_]+)$/);

        if (applyMatch) {
            currentMode = 'apply';
            setupApplyMode(applyMatch[1]); // Pass Job ID
        } else if (portalMatch) {
            currentMode = 'portal';
            setupPortalMode(portalMatch[1]); // Pass Applicant ID
        } else {
            showError('Invalid URL. Use the link provided to apply or access your portal.');
        }
    }

    initialize();

});