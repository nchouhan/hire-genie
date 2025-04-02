// --- START OF candidate-app.js ---
console.log("candidate-app.js executing...");

// --- Helper Functions ---
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        console.warn("escapeHtml received non-string:", unsafe);
        try { unsafe = String(unsafe); } catch (e) { return ''; }
    }
    return unsafe
         .replace(/&/g, "&") // Use correct entity for ampersand
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "'"); // Use entity for single quote
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
// -------------------------------------------------------------


document.addEventListener('DOMContentLoaded', () => {
    console.log("Candidate DOMContentLoaded");

    // --- DOM Elements ---
    // REMOVED: const pageTitle = document.getElementById('page-title');
    const submitView = document.getElementById('submit-view');
    const portalView = document.getElementById('portal-view');
    const loadingView = document.getElementById('loading-view');
    const errorView = document.getElementById('error-view');
    const errorMessageP = document.getElementById('error-message');
    // Submit View
    const submissionForm = document.getElementById('applicant-submission-form');
    const submitJobTitleH2 = document.getElementById('submit-job-title'); // Keep Check
    console.log("submitJobTitleH2 element:", submitJobTitleH2);
    const submitJobIdInput = document.getElementById('submit-job-id');
    const resumeFileInput = document.getElementById('resume-file-input');
    const uploadDropZone = document.getElementById('upload-drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');
    const analyzeResumeBtn = document.getElementById('analyze-resume-btn');
    const submitMessageP = document.getElementById('submit-message');
    // Parsing View
    const parsingView = document.getElementById('parsing-view');
    const parsingStatusText = document.getElementById('parsing-status-text');
    // Review/Edit View
    const reviewEditView = document.getElementById('review-edit-view');
    const reviewEditForm = document.getElementById('review-edit-form');
    const reviewJobIdInput = document.getElementById('review-job-id');
    const reviewNameInput = document.getElementById('review-name');
    const reviewEmailInput = document.getElementById('review-email');
    const reviewPhoneInput = document.getElementById('review-phone');
    const reviewSummaryTextarea = document.getElementById('review-summary');
    const reviewExperienceListDiv = document.getElementById('review-experience-list');
    const reviewSkillsListDiv = document.getElementById('review-skills-list');
    const reviewEducationListDiv = document.getElementById('review-education-list');
    const confirmSubmitBtn = document.getElementById('confirm-submit-btn');
    const confirmMessageP = document.getElementById('confirm-message');
    // Portal View Elements (Get only if portal logic is active)
    // const portalApplicantNameSpan = document.getElementById('portal-applicant-name');
    // ... etc ...
    // REMOVED: const applicationForm = document.getElementById('application-form'); // Likely unused


    // --- State & Config ---
    let currentMode = 'loading';
    let jobId = null;
    let applicantId = null; // Keep if portal exists
    let stagesConfig = []; // Keep if portal exists
    let parsedApplicantData = null;
    let parsingIntervalId = null;


    // --- API Helper ---
    async function apiRequest(url, method = 'GET', body = null, isFormData = false) {
        const options = { method };
        if (!isFormData) {
             options.headers = { 'Content-Type': 'application/json' };
        }
        if (body) {
             // Ensure body is stringified IF it's an object and NOT FormData
             if (!isFormData && typeof body === 'object' && body !== null) {
                 options.body = JSON.stringify(body);
             } else {
                 options.body = body; // FormData or primitive
             }
        }
        try {
            console.log(`API Request: ${method} ${url}`, options.body instanceof FormData ? '[FormData]' : options.body); // Don't log large form data
            const response = await fetch(url, options);

             // Improved Response Handling
            const contentType = response.headers.get("content-type");
            let responseData;
             if (contentType && contentType.indexOf("application/json") !== -1) {
                 responseData = await response.json();
             } else {
                 const text = await response.text();
                 responseData = text ? { message: text } : { message: `Request failed with status ${response.status}`}; // Wrap non-JSON in object
                 // If expecting JSON but got text, still throw error based on status
                  if (!response.ok) {
                      throw new Error(responseData.message);
                  }
                 // If expecting JSON and got text but status OK, log warning but proceed
                 if (method !== 'GET' && !isFormData) {
                     console.warn(`Expected JSON response but got ${contentType || 'text'}`);
                 }
                  // For GET requests, text might be acceptable sometimes
                 return responseData.message; // Or handle as needed
             }

             if (!response.ok) {
                 throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
             }
             return responseData;

        } catch (error) {
             console.error('API Request Error:', error);
             showError(`API Error: ${error.message}`);
             throw error;
        }
    }

    // --- UI Logic ---
    function showView(viewId) {
        console.log(`Switching view to: ${viewId}`);
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
            view.classList.remove('active');
        });
        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.style.display = 'block';
            viewToShow.classList.add('active');
        } else {
            console.error(`View ID "${viewId}" not found!`);
            showError("Application UI error.");
        }
    }

    function showError(message) {
        if (errorMessageP) errorMessageP.textContent = message;
        showView('error-view'); // Ensure error view is shown
    }

    // --- Drag & Drop Logic ---
    if (uploadDropZone && resumeFileInput) {
        uploadDropZone.addEventListener('click', () => resumeFileInput.click());
        resumeFileInput.addEventListener('change', handleFileSelect);
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadDropZone.addEventListener(eventName, preventDefaults, false); });
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadDropZone.addEventListener(eventName, () => uploadDropZone.classList.add('drag-over'), false); });
        ['dragleave', 'drop'].forEach(eventName => {
            uploadDropZone.addEventListener(eventName, () => uploadDropZone.classList.remove('drag-over'), false); });
        uploadDropZone.addEventListener('drop', handleDrop, false);
    }
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
    function handleDrop(e) {
        const dt = e.dataTransfer;
        if (dt.files && dt.files.length > 0) {
             resumeFileInput.files = dt.files;
             handleFileSelect();
        }
    }
    function handleFileSelect() {
        if (resumeFileInput.files.length > 0) {
            fileNameDisplay.textContent = `Selected: ${escapeHtml(resumeFileInput.files[0].name)}`;
        } else { fileNameDisplay.textContent = ''; }
    }

    
    // --- Parsing Animation ---
    function startParsingAnimation() {
        if (!parsingStatusText) return;
        const messages = [
            "Extracting text...",
            "Analyzing structure...",
            "Identifying key skills...",
            "Processing work history...",
            "Understanding education...",
            "Preparing your profile..."
        ];
        let index = 0;
        parsingStatusText.textContent = messages[index];
        if (parsingIntervalId) clearInterval(parsingIntervalId); // Clear previous
        parsingIntervalId = setInterval(() => {
            index = (index + 1) % messages.length;
            parsingStatusText.textContent = messages[index];
        }, 2000); // Change every 2 seconds
    }

    function stopParsingAnimation() {
        if (parsingIntervalId) {
            clearInterval(parsingIntervalId);
            parsingIntervalId = null;
        }
    }

    // --- Populating/Collecting Review Form ---
    function populateReviewForm(data) {
        if (!reviewEditForm || !data) {
            console.error("Cannot populate review form. Form or data missing.");
            return;
        }
        console.log("Populating review form with:", data);
    
        // --- Populate Basic Information ---
        // Use optional chaining (?.) and nullish coalescing (??) for safety
        if(reviewNameInput) reviewNameInput.value = data.name ?? '';
        if(reviewEmailInput) reviewEmailInput.value = data.email ?? '';
        if(reviewPhoneInput) reviewPhoneInput.value = data.phone ?? '';
        if(reviewSummaryTextarea) reviewSummaryTextarea.value = data.parsedSummary ?? '';
        if(reviewJobIdInput) reviewJobIdInput.value = jobId; // Ensure jobId is set from global scope
    
        // --- Populate Work Experience ---
        if (reviewExperienceListDiv) {
            reviewExperienceListDiv.innerHTML = ''; // Clear previous
            (data.workExperience || []).forEach((exp, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('experience-edit-item');
                itemDiv.dataset.index = index; // Keep index if needed for collecting data
    
                // Use escapeHtml for default values shown to user
                itemDiv.innerHTML = `
                    <div class="form-group review-group">
                        <label for="exp-title-${index}">Title:</label>
                        <input type="text" id="exp-title-${index}" name="exp[${index}][title]" value="${escapeHtml(exp.title || '')}">
                    </div>
                    <div class="form-group review-group">
                        <label for="exp-company-${index}">Company:</label>
                        <input type="text" id="exp-company-${index}" name="exp[${index}][company]" value="${escapeHtml(exp.company || '')}">
                    </div>
                     <div class="form-group review-group">
                        <label for="exp-duration-${index}">Duration:</label>
                        <input type="text" id="exp-duration-${index}" name="exp[${index}][duration]" value="${escapeHtml(exp.duration || '')}" placeholder="e.g., 2020-01 - 2023-12 or 3 years">
                    </div>
                     <div class="form-group review-group">
                         <label for="exp-location-${index}">Location:</label>
                         <input type="text" id="exp-location-${index}" name="exp[${index}][location]" value="${escapeHtml(exp.location || '')}">
                     </div>
                    <div class="form-group review-group">
                        <label for="exp-desc-${index}">Description/Achievements/Responsibilities:</label>
                        <textarea id="exp-desc-${index}" name="exp[${index}][description]" rows="4">${
                            // Combine description, responsibilities, achievements for editing
                            escapeHtml(
                                [exp.description || '', ...(exp.responsibilities || []), ...(exp.achievements || [])]
                                .filter(Boolean).join('\n') // Join non-empty parts with newline
                            )
                        }</textarea>
                    </div>
                `;
                reviewExperienceListDiv.appendChild(itemDiv);
            });
            if (!data.workExperience || data.workExperience.length === 0) {
                 reviewExperienceListDiv.innerHTML = '<p><i>No work experience parsed. You can add manually if needed (feature not implemented).</i></p>';
            }
        }
    
        // --- Populate Skills ---
        if (reviewSkillsListDiv) {
            reviewSkillsListDiv.innerHTML = ''; // Clear previous
            (data.skills || []).forEach((skill, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('skill-edit-item');
                itemDiv.dataset.index = index;
    
                // Define proficiency levels
                const proficiencies = ['Unknown', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
                let optionsHtml = proficiencies.map(p =>
                    `<option value="${p}" ${skill.proficiencyLevel === p ? 'selected' : ''}>${p}</option>`
                ).join('');
    
                itemDiv.innerHTML = `
                    <div class="form-group review-group" style="flex-grow: 1;">
                        <label for="skill-name-${index}">Skill:</label>
                        <input type="text" id="skill-name-${index}" name="skill[${index}][name]" value="${escapeHtml(skill.name || '')}">
                    </div>
                    <div class="form-group review-group" style="flex-shrink: 0;">
                         <label for="skill-prof-${index}">Level:</label>
                        <select id="skill-prof-${index}" name="skill[${index}][proficiencyLevel]">
                            ${optionsHtml}
                        </select>
                    </div>
                    <!-- Add remove button? -->
                     <button type="button" class="btn remove-item-btn" data-remove-index="${index}" data-remove-type="skill" title="Remove Skill">×</button>
                `;
                reviewSkillsListDiv.appendChild(itemDiv);
            });
             if (!data.skills || data.skills.length === 0) {
                 reviewSkillsListDiv.innerHTML = '<p><i>No skills parsed. You can add manually if needed (feature not implemented).</i></p>';
            }
            // TODO: Add functionality for the remove button and potentially an "Add Skill" button
        }
    
        // --- Populate Education ---
        if (reviewEducationListDiv) {
            reviewEducationListDiv.innerHTML = ''; // Clear previous
            (data.education || []).forEach((edu, index) => {
                 const itemDiv = document.createElement('div');
                 itemDiv.classList.add('education-edit-item');
                 itemDiv.dataset.index = index;
                 itemDiv.innerHTML = `
                     <div class="form-group review-group">
                        <label for="edu-degree-${index}">Degree/Qualification:</label>
                        <input type="text" id="edu-degree-${index}" name="edu[${index}][degree]" value="${escapeHtml(edu.degree || '')}">
                    </div>
                     <div class="form-group review-group">
                        <label for="edu-institution-${index}">Institution:</label>
                        <input type="text" id="edu-institution-${index}" name="edu[${index}][institution]" value="${escapeHtml(edu.institution || '')}">
                    </div>
                    <div class="form-group review-group">
                        <label for="edu-duration-${index}">Duration/Graduation Year:</label>
                        <input type="text" id="edu-duration-${index}" name="edu[${index}][duration]" value="${escapeHtml(edu.duration || '')}">
                    </div>
                    <!-- Add Specialization, GPA if parsed -->
                     <button type="button" class="btn remove-item-btn" data-remove-index="${index}" data-remove-type="education" title="Remove Education">×</button>
                 `;
                reviewEducationListDiv.appendChild(itemDiv);
            });
             if (!data.education || data.education.length === 0) {
                 reviewEducationListDiv.innerHTML = '<p><i>No education parsed. You can add manually if needed (feature not implemented).</i></p>';
            }
            // TODO: Add functionality for remove button / "Add Education"
        }
    
        // TODO: Populate Certifications, Links etc. in a similar dynamic way
    
        // Add event listeners for remove buttons AFTER populating
        addRemoveButtonListeners();
    
        console.log("Review form populated.");
    }
    
    // --- Helper function to add listeners to dynamically created remove buttons ---
    function addRemoveButtonListeners() {
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            // Remove existing listener first to prevent duplicates if called multiple times
            button.replaceWith(button.cloneNode(true)); // Simple way to remove listeners
        });
        // Add new listeners
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const buttonClicked = event.currentTarget;
                const typeToRemove = buttonClicked.dataset.removeType;
                // Find the parent container item (e.g., .skill-edit-item) and remove it
                const itemToRemove = buttonClicked.closest(`.${typeToRemove}-edit-item`);
                if (itemToRemove) {
                    console.log(`Removing ${typeToRemove} item:`, itemToRemove);
                    itemToRemove.remove();
                    // Note: This only removes from UI. The collectReviewFormData needs to read only existing items.
                }
            });
        });
    }
    // --- Collecting Data from Review Form ---
function collectReviewFormData() {
    console.log("Collecting data from review form...");
    // Start with the easily accessible basic info
    const confirmedData = {
        name: reviewNameInput.value,
        email: reviewEmailInput.value,
        phone: reviewPhoneInput.value,
        parsedSummary: reviewSummaryTextarea.value,
        // Initialize arrays/objects that were dynamic
        workExperience: [],
        skills: [],
        education: [],
        certifications: parsedApplicantData.certifications || [], // Carry over non-editable arrays
        advancedFields: parsedApplicantData.advancedFields || {}, // Carry over non-editable objects
        // Carry over AI analysis fields if they existed
        linkedinValidated: parsedApplicantData.linkedinValidated,
        discrepancies: parsedApplicantData.discrepancies,
        careerTrajectory: parsedApplicantData.careerTrajectory,
        // Store original source info if needed
        source: parsedApplicantData.source || 'Review/Edit',
        originalCvPath: parsedApplicantData.originalCvPath, // Keep reference to original
        submittedLinks: parsedApplicantData.submittedLinks,
    };

    // Collect Work Experience
    document.querySelectorAll('#review-experience-list .experience-edit-item').forEach(item => {
        const experience = {
            title: item.querySelector(`input[name^="exp["][name$="[title]"]`)?.value || '',
            company: item.querySelector(`input[name^="exp["][name$="[company]"]`)?.value || '',
            duration: item.querySelector(`input[name^="exp["][name$="[duration]"]`)?.value || '',
            // Split description/achievements back out if needed, or keep combined
            description: item.querySelector(`textarea[name^="exp["][name$="[description]"]`)?.value || '',
            // achievements: item.querySelector(`textarea[name$="[description]"]`)?.value.split('\n') || [] // Example split
        };
        if (experience.title || experience.company) { // Only add if some data exists
            confirmedData.workExperience.push(experience);
        }
    });

    // TODO: Implement collection for Skills
    // TODO: Implement collection for Education

    console.log("Collected confirmed data:", confirmedData);
    return confirmedData;
}


    // --- Event Handlers ---

    // 1. Initial Form Submission (Triggers Parsing)
    if (submissionForm) {
        submissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!submitMessageP || !analyzeResumeBtn) return; // Safety check

            submitMessageP.textContent = '';
            submitMessageP.className = 'message';
            analyzeResumeBtn.disabled = true;
            analyzeResumeBtn.innerHTML = `<span class="material-icons loading-icon" style="animation: spin 1s linear infinite; font-size: 1.1em; margin-right: 5px;">sync</span> Analyzing...`;

            const formData = new FormData(submissionForm);
            const file = formData.get('resumeFile');
            const hasLinks = formData.get('linkedinUrl') || formData.get('githubUrl') || formData.get('portfolioUrl');

            if ((!file || file.size === 0) && !hasLinks) {
                 submitMessageP.textContent = 'Please upload a resume file OR provide at least one profile link.';
                 submitMessageP.classList.add('error');
                 analyzeResumeBtn.disabled = false;
                 analyzeResumeBtn.innerHTML = `<span class="material-icons" style="margin-right: 5px;">psychology</span> Analyze Resume & Links`;
                 return;
            }

            showView('parsing-view');
            startParsingAnimation();

            try {
                const result = await apiRequest('/api/applicants/submit', 'POST', formData, true); // Pass true for FormData
                stopParsingAnimation();

                if (result && result.parsedData) {
                    parsedApplicantData = result.parsedData;
                    populateReviewForm(parsedApplicantData);
                    showView('review-edit-view');
                } else {
                    // Use message from API response if available
                    throw new Error(result?.message || "Parsing completed but no data received.");
                }
            } catch (error) {
                stopParsingAnimation();
                showView('submit-view'); // Go back on error
                submitMessageP.textContent = `Analysis Failed: ${error.message}`;
                submitMessageP.classList.add('error');
            } finally {
                 analyzeResumeBtn.disabled = false;
                 analyzeResumeBtn.innerHTML = `<span class="material-icons" style="margin-right: 5px;">psychology</span> Analyze Resume & Links`;
            }
        });
    }

    // 2. Final Confirmation Submission (Submits Edited Data)
    if (reviewEditForm) {
        reviewEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!confirmMessageP || !confirmSubmitBtn) return; // Safety check

            confirmMessageP.textContent = '';
            confirmMessageP.className = 'message';
            confirmSubmitBtn.disabled = true;
            confirmSubmitBtn.innerHTML = `<span class="material-icons loading-icon" style="animation: spin 1s linear infinite; font-size: 1.1em; margin-right: 5px;">sync</span> Submitting...`;

            try {
                 const finalData = collectReviewFormData();
                 const submissionPayload = {
                     jobId: reviewJobIdInput?.value, // Use optional chaining
                     confirmedData: finalData
                 };

                 if (!submissionPayload.jobId) throw new Error("Job ID missing during confirmation.");
                 if (!finalData.name || !finalData.email) throw new Error("Name and Email are required.");

                 const result = await apiRequest('/api/applicants/confirm', 'POST', submissionPayload); // Send JSON

                 showView('submit-view');
                 // Display success message on the SUBMIT view now
                 if(submitMessageP) {
                     submitMessageP.textContent = result.message || 'Application Submitted Successfully!';
                     submitMessageP.classList.add('success');
                 }
                 // Clear forms
                 submissionForm?.reset();
                 reviewEditForm?.reset(); // Use optional chaining
                 if (fileNameDisplay) fileNameDisplay.textContent = '';


            } catch (error) {
                confirmMessageP.textContent = `Submission Failed: ${error.message}`;
                confirmMessageP.classList.add('error');
            } finally {
                 confirmSubmitBtn.disabled = false;
                 confirmSubmitBtn.innerHTML = `<span class="material-icons" style="margin-right: 5px;">check_circle</span> Confirm & Submit Application`;
            }
        });
    }

    // --- Initialization Functions ---
    async function setupApplyMode(jobIdParam) {
        console.log("setupApplyMode: Started for Job ID:", jobIdParam);

        // Re-check elements needed within this function
        const currentSubmitJobTitleH2 = document.getElementById('submit-job-title');
        const currentSubmitJobIdInput = document.getElementById('submit-job-id');

        if (!currentSubmitJobTitleH2 || !currentSubmitJobIdInput) {
            console.error("setupApplyMode: submitJobTitleH2 or submitJobIdInput element NOT FOUND!");
            showError("UI elements missing for application form.");
            return;
        }

        currentSubmitJobIdInput.value = jobIdParam;

        try {
            console.log("setupApplyMode: Fetching job details...");
            const jobData = await apiRequest(`/api/jobs/${jobIdParam}`);
            console.log("setupApplyMode: Job details fetched:", jobData);

            if (!jobData || !jobData.title) {
                 console.error("setupApplyMode: Invalid job data received or title missing.");
                 showError(`Job data for ${jobIdParam} invalid.`);
                 return;
            }
            if (jobData.status !== 'open') {
                 console.error("setupApplyMode: Job status is not open:", jobData.status);
                 showError(`Job (${escapeHtml(jobData.title)}) is closed.`);
                 return;
            }

            console.log("setupApplyMode: Updating UI elements...");
            const jobTitle = jobData.title || 'Job';

            // Update H2
            currentSubmitJobTitleH2.textContent = `Apply for ${escapeHtml(jobTitle)}`;

            // Update Document Title
            document.title = `Apply: ${escapeHtml(jobTitle)}`; // Set document title

            console.log("setupApplyMode: UI updated. Showing submit view.");
            showView('submit-view'); // Ensure correct view is shown
            console.log("setupApplyMode: Finished successfully.");

        } catch (error) {
            console.error("setupApplyMode: Error caught within setupApplyMode:", error);
            showError(`Failed to load job details: ${error.message}`); // Show error if fetch failed
        }
    }

    async function setupPortalMode(applicantIdParam) {
        // Placeholder for portal logic - assumes elements exist
        console.log("setupPortalMode: Started for Applicant ID:", applicantIdParam);
        showView('loading-view');
        try {
            // Fetch necessary data...
            // Render portal...
             console.log("Portal view setup not fully implemented.");
             showView('portal-view'); // Show placeholder portal view
        } catch (error) {
            showError(`Failed to load portal: ${error.message}`);
        }
     }

    async function initialize() {
        console.log("Candidate Initialize: Starting.");
        const path = window.location.pathname;
        const applyMatch = path.match(/^\/apply\/([a-zA-Z0-9_]+)$/);
        const portalMatch = path.match(/^\/portal\/([a-zA-Z0-9_]+)$/);

        try {
            if (applyMatch) {
                console.log("Initialize: Matched /apply/ route.");
                currentMode = 'submit';
                jobId = applyMatch[1];
                console.log("Initialize: Job ID found:", jobId);
                await setupApplyMode(jobId);
                console.log("Initialize: setupApplyMode finished.");

            } else if (portalMatch) {
                console.log("Initialize: Matched /portal/ route.");
                currentMode = 'portal';
                applicantId = portalMatch[1];
                console.log("Initialize: Applicant ID found:", applicantId);
                await setupPortalMode(applicantId);
                console.log("Initialize: setupPortalMode finished.");
            } else {
                console.error("Initialize: URL did not match expected patterns.");
                showError('Invalid URL for application or portal.');
            }
        } catch (error) {
             console.error("Candidate Initialize Error:", error);
             showError(`Initialization failed: ${error.message}`);
        }
    }

    initialize(); // Call initialize

}); // End DOMContentLoaded
// --- END OF candidate-app.js ---