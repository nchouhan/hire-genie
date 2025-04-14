require('dotenv').config();
//Not required if using native fetch which is available in Node.js 18+
// const fetch = require('node-fetch'); // Uncomment if using Node.js < 18
// If using native fetch, ensure your Node.js version is 18 or higher
// const fetch = require('node-fetch'); // Or use native fetch
const pdf = require('pdf-parse'); // Import pdf-parse
const fs = require('fs-extra'); // Import fs-extra
const dataStore = require('./dataStore'); 
const API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`; // Adjust model name if needed

async function callGeminiAPI(prompt, context = []) {
    if (!API_KEY) {
        console.error("GEMINI_API_KEY is not set.");
        throw new Error("API key missing");
    }

    const payload = {
        contents: [...context, { role: "user", parts: [{ text: prompt }] }],
        // Add safetySettings, generationConfig as needed
        // generationConfig: { temperature: 0.7, topP: 0.9, topK: 40 }
    };

    try {
        console.log("Sending prompt to Gemini:", prompt.substring(0, 100) + "..."); // Log prompt start
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Gemini API Error (${response.status}): ${errorBody}`);
            throw new Error(`Gemini API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Handle potential lack of content or errors in response structure
        if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
            console.error("Unexpected Gemini API response structure:", JSON.stringify(data, null, 2));
            // Check for block reason
            if (data.candidates && data.candidates[0].finishReason === 'SAFETY') {
                return "Response blocked due to safety settings.";
            }
             if (data.promptFeedback && data.promptFeedback.blockReason) {
                 return `Prompt blocked due to: ${data.promptFeedback.blockReason}`;
             }
            return "Error: Could not extract text from Gemini response.";
        }

        return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error; // Re-throw for handling in API routes
    }
}
// --- ADVANCED Resume Parsing (Conceptual) ---
async function parseResumeAdvanced(file, links) {
    let combinedText = "";
    let fileExtractedText = "";
    let extractionErrors = [];
    // 1. Extract text: Use libraries for PDF (pdf-parse), DOCX (mammoth.js), Image OCR (Tesseract.js via wrapper or API)
    // 2. Get content from links (e.g., scrape LinkedIn using puppeteer - BEWARE: fragile & potentially against ToS, API preferred if available)
    // 3. Combine all text sources.
    // combinedText = "Extracted text from resume...\n";
    // --- 1. Extract text from file (if provided) ---
    if (file) {
        console.log("Parsing file:", file.originalname, "MIME type:", file.mimetype);
        try {
            // --- PDF Handling ---
            if (file.mimetype === 'application/pdf') {
                // If using diskStorage: read file from file.path
                // If using memoryStorage: use file.buffer
                const dataBuffer = await fs.readFile(file.path); // Assumes diskStorage from previous step
                const data = await pdf(dataBuffer);
                fileExtractedText = data.text || "";
                console.log(`Extracted ${fileExtractedText.length} characters from PDF.`);
            }
            // --- DOCX Handling (Requires mammoth) ---
            // else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            //     const mammoth = require('mammoth');
            //     const result = await mammoth.extractRawText({ path: file.path }); // Or buffer: file.buffer
            //     fileExtractedText = result.value || "";
            //     console.log(`Extracted ${fileExtractedText.length} characters from DOCX.`);
            // }
            // --- TXT Handling ---
            else if (file.mimetype === 'text/plain') {
                fileExtractedText = await fs.readFile(file.path, 'utf8'); // Or file.buffer.toString('utf8') for memoryStorage
                console.log(`Extracted ${fileExtractedText.length} characters from TXT.`);
            }
            // --- Image OCR (Requires Tesseract.js setup - more complex) ---
            // else if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
            //    console.log("OCR for images not implemented yet.");
            //    extractionErrors.push("OCR for images not implemented.");
            // }
            else {
                console.warn(`Unsupported file type: ${file.mimetype}`);
                extractionErrors.push(`Unsupported file type: ${file.mimetype}`);
            }
        } catch (err) {
            console.error("Error extracting text from file:", err);
            extractionErrors.push(`Error processing file ${file.originalname}: ${err.message}`);
        }
        combinedText += `--- Resume Content ---\n${fileExtractedText}\n--- End Resume Content ---\n\n`;
    } else {
        combinedText += "--- No Resume File Uploaded ---\n\n";
    }


    // --- 2. Get content from links (PLACEHOLDER - See Note Below) ---
    // !! IMPORTANT: Scraping is fragile and often against ToS. Use APIs if possible. !!
    // This section is highly conceptual and needs robust implementation.
    let linkedInData = "";
    if (links.linkedinUrl) {
        console.log("Fetching LinkedIn data (Placeholder)...");
        // Replace with actual scraping (e.g., using Puppeteer) or API call if available
        linkedInData = `[Placeholder: LinkedIn data for ${links.linkedinUrl}]`;
        combinedText += `--- LinkedIn Profile Data ---\n${linkedInData}\n--- End LinkedIn Profile Data ---\n\n`;
    }
    // Add similar placeholders/logic for GitHub, Portfolio...

    // --- 3. Prepare Prompt for Gemini ---
    const prompt = `
        You are an expert HR data extraction AI. Analyze the following combined text from a resume and potentially linked profiles.
        Extract the specified fields accurately. Infer proficiency levels and responsibilities where possible.
        Return ONLY a valid JSON object containing these fields: name, email, phone, parsedSummary, workExperience (array of objects), skills (array of objects with name & proficiencyLevel), education (array of objects), certifications (array), advancedFields (object containing links), linkedinValidated (boolean based on comparison if data available), discrepancies (array of strings if issues found), careerTrajectory (string analysis).
        If critical information like name or email is missing, indicate that clearly in the respective field (e.g., "N/A - Not Found").

        Combined Text:
        ---
        ${combinedText.substring(0, 18000)}
        ---

        Extraction Errors Encountered: ${extractionErrors.join(', ') || 'None'}

        Generate the JSON object:
    `;

    try {
        const rawResponse = await callGeminiAPI(prompt);
        console.log("Raw Gemini Response (parseResumeAdvanced):", rawResponse);

        // --- Robust Cleaning ---
        let workString = rawResponse.trim(); // Start with the raw, trimmed response

        // 1. Markdown Fence Removal (Focus on finding JSON boundaries)
        const firstBrace = workString.indexOf('{');
        const firstBracket = workString.indexOf('[');
        let startIndex = -1;
        let isLikelyArray = false;

        // Determine start and if it's likely an object or array
        if (firstBrace !== -1 && firstBracket !== -1) {
            startIndex = Math.min(firstBrace, firstBracket);
            isLikelyArray = (firstBracket < firstBrace); // Assume array if [ comes before {
        } else if (firstBrace !== -1) {
            startIndex = firstBrace;
            isLikelyArray = false;
        } else if (firstBracket !== -1) {
            startIndex = firstBracket;
            isLikelyArray = true;
        }

        if (startIndex !== -1) {
            workString = workString.substring(startIndex); // Cut off anything before the first { or [
            console.log("Cleaned start fence/prefix.");
        } else {
            console.error("Could not find starting '{' or '[' in Gemini response. Attempting parse anyway.");
            // No starting brace/bracket found, the response might be invalid from the start
        }

        // Find the *last* corresponding closing brace/bracket
        const lastBrace = workString.lastIndexOf('}');
        const lastBracket = workString.lastIndexOf(']');
        let endIndex = -1;

        if (isLikelyArray && lastBracket !== -1) {
            endIndex = lastBracket;
        } else if (!isLikelyArray && lastBrace !== -1) {
            endIndex = lastBrace;
        } else {
            // Fallback if initial guess was wrong or structure is mixed/invalid
            endIndex = Math.max(lastBrace, lastBracket);
        }


        if (endIndex !== -1) {
            // --- START: Isolate the main JSON structure ---
            // Take only the substring from the start index up to and including the found end index
            workString = workString.substring(0, endIndex + 1);
            console.log("Isolated main JSON structure.");
            // --- END: Isolate ---
        } else {
             console.error("Could not find closing '}' or ']' in Gemini response. Parsing might fail.");
             // No closing brace/bracket found, proceed with caution
        }

        // Trim again after potential isolation/fence removal
        workString = workString.trim();
        console.log("After Isolation/Fence Cleaning:", workString.substring(0, 200) + "...");

        // 2. Remove Comments
        workString = workString.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*$)/gm, (match, group1) => {
            return group1 ? '' : match;
        });
        workString = workString.trim();
        console.log("After Comment Cleaning:", workString.substring(0, 200) + "...");

        // 3. Remove Trailing Commas
        workString = workString.replace(/,\s*([}\]])/g, '$1');
        console.log("After Trailing Comma Cleaning:", workString.substring(0, 200) + "...");
        // --- END: Robust Cleaning ---

        // Attempt to parse the final cleaned JSON string
        console.log("Attempting JSON.parse on final string...");
        return JSON.parse(workString); // Use final 'workString'

    } catch (error) {
        console.error("Error in parseResumeAdvanced (Parsing Stage):", error);
        // Include the *final string that failed* in the error
        return {
            error: `AI Parsing failed: ${error.message}`,
            problematicJsonString: workString?.substring(0, 1000)
         };
    }
}


// --- Rank Applicants (Conceptual) ---
async function rankApplicantsForJob(targetJob, applicantsToRank) {
    console.log(`Ranking check for ${applicantsToRank.length} applicants against TARGET job ${targetJob.id}...`);
    const targetJobId = targetJob.id;
    let processingPromises = [];

    // Prepare Job context once
    const jobContext = `
        --- TARGET JOB DETAILS (ID: ${targetJobId}) ---
        Title: ${targetJob.title || 'N/A'}
        Description Summary: ${formatDataForPrompt(targetJob.description, 600)}
        Requirements:
        - ${formatDataForPrompt(targetJob.requirements)}
        Nice-to-Have:
        - ${formatDataForPrompt(targetJob.niceToHave)}
    `;
    // Prepare list of ranking criteria
    const rankingCriteria = [
        "skillMatch (Technical skills, tools, languages relevant to JD requirements)",
        "experienceRelevance (Years/roles matching JD, industry relevance)",
        "achievementImpact (Quantifiable results, alignment with JD goals inferred from experience)",
        "educationCerts (Relevance of degrees and certifications to the role)",
        "innovationPotential (Inferred from unique projects, patents, papers, portfolio creativity, or complex problem-solving described)"
    ];

    for (const applicant of applicantsToRank) {
        // Check if ranking for THIS targetJobId already exists and seems valid
        const existingRanking = applicant?.rankings?.[targetJobId];
        const needsRanking = !existingRanking || !existingRanking.overallScore || existingRanking.generatedSummary?.includes("failed"); // Re-rank if no score or previously failed

        if (!needsRanking) {
            console.log(` > Applicant ${applicant.id}: Ranking already exists for target job ${targetJobId}.`);
            continue; // Skip
        }

        console.log(` > Applicant ${applicant.id}: Needs ranking/re-ranking for target job ${targetJobId}.`);

        const rankPromise = (async () => {
            try {
                // --- Prepare Applicant Context for Prompt ---
                const applicantContext = `
                    --- CANDIDATE PROFILE (ID: ${applicant.id}) ---
                    AI Parsed Summary: ${formatDataForPrompt(applicant.parsedSummary, 300)}
                    Skills Parsed: ${applicant.skills?.map(s => `${s.name}${s.proficiencyLevel ? ` (${s.proficiencyLevel})` : ''}`).join(', ') || 'Not available'}
                    Work Experience Summary:
                    ${applicant.workExperience?.map(exp => `- ${exp.title || 'Role'} at ${exp.company || 'Company'} (${exp.duration || 'N/A'}): ${formatDataForPrompt(exp.description || (exp.achievements||[]).join('. '), 200)}`).join('\n') || 'Not available'}
                    Education Summary:
                    ${applicant.education?.map(edu => `- ${edu.degree || 'Degree'} from ${edu.institution || 'Institution'}`).join('\n') || 'Not available'}
                    Certifications: ${formatDataForPrompt(applicant.certifications)}
                `;

                // --- Construct the Ranking Prompt ---
                const prompt = `
                    You are an expert AI Recruitment Analyst. Evaluate the provided Candidate Profile against the Target Job Details.
                    Provide scores (0-100) for each of the following categories, considering the definition provided:
                    ${rankingCriteria.map(c => `- ${c}`).join('\n')}

                    Also, provide an 'overallScore' (0-100) representing the candidate's overall fit for this specific job, considering all factors.
                    Finally, write a concise 'generatedSummary' (1-3 sentences) highlighting the candidate's key strengths and potential weaknesses *specifically* in relation to this job opening.

                    Base your analysis STRICTLY on the provided text snippets. If information is missing for a category, assign a lower score or mention the gap in the summary.

                    Return ONLY a valid JSON object with these exact keys: "overallScore", "skillMatch", "experienceRelevance", "achievementImpact", "educationCerts", "innovationPotential", "generatedSummary". Example: {"overallScore": 85, "skillMatch": 90, ..., "generatedSummary": "Strong technical fit..."}

                    ${jobContext}

                    ${applicantContext}

                    Generate the JSON object:
                `;

                // --- Call Gemini ---
                const rawResponse = await callGeminiAPI(prompt);
                
                console.log(`Raw Gemini Ranking Response for ${applicant.id}:`, rawResponse.substring(0, 100) + "...");

                // --- Clean and Parse Response ---
                let workString = rawResponse.trim();
                // 1. Markdown Fence Removal
                const firstBrace = workString.indexOf('{');
                // Only expect object for ranking response
                if (firstBrace !== -1 && /^\s*```(json)?/i.test(workString.substring(0, firstBrace))) {
                    workString = workString.substring(firstBrace);
                    console.log(`Cleaned start fence for ${applicant.id}`);
                } else if (/^\s*```(json)?/i.test(workString)) { // If fence but no brace found early
                     const lines = workString.split('\n');
                     if (lines[0].trim().startsWith('```')) {
                         workString = lines.slice(1).join('\n');
                         console.warn(`Attempted to remove fence line for ${applicant.id}`);
                     }
                }
                const lastBrace = workString.lastIndexOf('}');
                if (lastBrace !== -1) {
                    const trailingContent = workString.substring(lastBrace + 1).trim();
                    if (trailingContent === '```') {
                        workString = workString.substring(0, lastBrace + 1);
                        console.log(`Cleaned end fence for ${applicant.id}`);
                    } else if (workString.trim().endsWith('```')) {
                         workString = workString.substring(0, workString.lastIndexOf('```'));
                         console.warn(`Cleaned end fence simply for ${applicant.id}`);
                    }
                } else if (workString.trim().endsWith('```')) {
                     workString = workString.substring(0, workString.lastIndexOf('```'));
                     console.warn(`Cleaned end fence without finding } for ${applicant.id}`);
                }
                workString = workString.trim();
                console.log(`After Fence Cleaning for ${applicant.id}:`, workString.substring(0, 100) + "...");

                // 2. Remove Comments
                workString = workString.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*$)/gm, (m, g1) => g1 ? '' : m);
                workString = workString.trim();

                // 3. Remove Trailing Commas
                workString = workString.replace(/,\s*([}\]])/g, '$1');
                console.log(`Final string before parse for ${applicant.id}:`, workString.substring(0, 100) + "...");


                const rankingResult = JSON.parse(workString);

                // --- Validate Parsed Result ---
                 if (typeof rankingResult.overallScore !== 'number' || typeof rankingResult.skillMatch !== 'number') {
                     throw new Error("AI response did not contain valid numeric scores.");
                 }
                 console.log(`Parsed ranking result for ${applicant.id}:`, JSON.stringify(rankingResult, null, 2));
                 
                // --- Structure the final ranking data ---
                const newRanking = {
                    overallScore: Math.round(rankingResult.overallScore ?? 0),
                    skillMatch: Math.round(rankingResult.skillMatch ?? 0),
                    experienceRelevance: Math.round(rankingResult.experienceRelevance ?? 0),
                    achievementImpact: Math.round(rankingResult.achievementImpact ?? 0),
                    educationCerts: Math.round(rankingResult.educationCerts ?? 0),
                    innovationPotential: Math.round(rankingResult.innovationPotential ?? 0),
                    generatedSummary: (rankingResult.generatedSummary || "AI summary missing.").substring(0, 300), // Limit length
                    isHiddenGem: false, // Keep placeholder or develop separate logic/prompt
                    rankedAt: new Date().toISOString()
                };

                // Save to applicant object
                if (!applicant.rankings) applicant.rankings = {};
                applicant.rankings[targetJobId] = newRanking;
                dataStore.updateApplicant(applicant);
                console.log(` > Applicant ${applicant.id}: Ranking for target job ${targetJobId} calculated and SAVED by AI.`);

            } catch (rankingError) {
                console.error(`Failed to rank applicant ${applicant.id} for target job ${targetJobId}:`, rankingError);
                // Store error state
                 if (!applicant.rankings) applicant.rankings = {};
                 applicant.rankings[targetJobId] = { overallScore: 0, generatedSummary: `Ranking Error: ${rankingError.message.substring(0,100)}...`, rankedAt: new Date().toISOString() };
                 // Save error state? Or just don't update? Decide based on desired behavior.
                 // dataStore.updateApplicant(applicant); // Uncomment to save error state
            }
        })(); // End IIFE

        processingPromises.push(rankPromise);

    } // End for loop

    // Wait for completion
    if (processingPromises.length > 0) {
        await Promise.all(processingPromises);
        console.log("All ranking processes finished.");
        // Re-fetch to ensure consistency after saves
        return dataStore.getApplicantsForJob(targetJobId); // Re-fetch using the original job ID if ranking was for self, otherwise might need adjustment
    } else {
        console.log("No applicants needed ranking.");
        return applicantsToRank; // Return original list if no ranking needed
    }
}
// Helper function to format data for the prompt (to manage length)
function formatDataForPrompt(data, maxLength = 400) {
    let text = '';
    if (Array.isArray(data)) {
        text = data.join('\n- ');
    } else if (typeof data === 'string') {
        text = data;
    }
    // Add more formatting if needed (e.g., for objects)
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + "...";
    }
    return text || 'N/A';
}

// --- Generate Interview Questions (Conceptual) ---
async function generateInterviewQuestions(job, applicant) {
    const prompt = `
        You are an expert interviewer AI. Generate 3-5 insightful, tailored interview questions for candidate ${applicant.name || 'ID '+applicant.id.slice(-4)} applying for the ${job.title} role.
        Focus questions on probing deeper into their specific experiences mentioned in their profile, verifying key skills required by the job, assessing cultural fit based on job description keywords, and exploring areas identified as potential gaps.

        Job Requirements Summary: ${job.jdKeywords?.requiredSkills?.map(s=>s.skill).join(', ')} (${job.experienceYears?.min}+ years experience expected). Cultural keywords: ${job.jdKeywords?.culturalFit?.map(k=>k.keyword).join(', ')}.
        Candidate Profile Summary: ${applicant.parsedSummary}. Key Skills listed: ${applicant.skills?.map(s=>s.name).join(', ')}. Recent Role: ${applicant.workExperience?.[0]?.company || 'N/A'}.

        Generate a JSON array of question strings:
    `;
     try {
        const rawResponse = await callGeminiAPI(prompt);
        // Clean potential markdown fences
        let cleanedResponse = rawResponse.trim();
        if (cleanedResponse.startsWith('```json')) cleanedResponse = cleanedResponse.substring(7);
        if (cleanedResponse.endsWith('```')) cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
        cleanedResponse = cleanedResponse.trim();
        // Basic validation: Check if it looks like an array before parsing
        if (!cleanedResponse.startsWith('[') || !cleanedResponse.endsWith(']')) {
            console.warn("AI did not return a valid JSON array for questions, returning raw response.");
            return [cleanedResponse]; // Return raw text as a single question
        }
        return JSON.parse(cleanedResponse);
    } catch (error) {
        console.error("Error generating interview questions:", error);
        return ["Error generating questions. Please review candidate profile manually."];
    }
}
// --- Specific Use Case Functions ---

async function enhanceJobDescription(draftData) {
    const prompt = `
        You are a helpful AI assistant for a recruitment team.
        A recruiter has provided the following draft information for a job description.
        Please enhance this into a comprehensive and appealing job description.
        Ensure it includes:
        - Clear Job Title, Department, Location.
        - Engaging company overview (if provided, otherwise add a placeholder).
        - Detailed Responsibilities section.
        - Clear "Required Qualifications" section.
        - Clear "Nice-to-Have Qualifications" section.
        - Information about compensation/benefits (if provided, otherwise suggest adding it).
        - A call to action on how to apply.

        If any crucial information seems missing (like core responsibilities or essential qualifications), please explicitly ask the recruiter to provide it within your response, perhaps like "[ACTION REQUIRED: Please provide more details on X]".

        Draft Data:
        Title: ${draftData.title || '[Missing Title]'}
        Department: ${draftData.department || '[Missing Department]'}
        Location: ${draftData.location || '[Missing Location]'}
        Core Responsibilities Draft: ${draftData.description || '[Missing Responsibilities]'}
        Required Skills Draft: ${draftData.requirements || '[Missing Required Skills]'}
        Nice-to-Have Draft: ${draftData.niceToHave || ''}
        Salary Draft: ${draftData.salaryRange || ''}

        Generate the enhanced job description below:
    `;
    return await callGeminiAPI(prompt);
}

async function candidateChat(applicantId, userMessage, history = []) {
    // --- Fetch Full Applicant and Job Data ---
    const applicant = dataStore.getApplicant(applicantId);
    if (!applicant) {
        console.error(`Candidate Chat: Applicant ${applicantId} not found.`);
        return "Sorry, I couldn't retrieve your application details right now.";
    }
    const job = dataStore.getJob(applicant.jobId);
    if (!job) {
        console.error(`Candidate Chat: Job ${applicant.jobId} not found for applicant ${applicantId}.`);
        return `Sorry, I couldn't retrieve the details for the job you applied for (ID: ${applicant.jobId}).`;
    }
    const stagesConfig = dataStore.getStagesConfig(); // Get stage names

    // --- Prepare Data Strings for Prompt ---
    // Format complex data like arrays into readable strings
    const jobRequirementsString = Array.isArray(job.requirements) ? job.requirements.join(', ') : (job.requirements || 'Not specified');
    const jobNiceToHaveString = Array.isArray(job.niceToHave) ? job.niceToHave.join(', ') : (job.niceToHave || 'Not specified');
    const candidateSkillsString = applicant.skills?.map(s => `${s.name}${s.proficiencyLevel ? ` (${s.proficiencyLevel})` : ''}`).join(', ') || 'Not parsed';
    // Summarize experience briefly
    const recentExperienceSummary = applicant.workExperience?.slice(0, 2).map(exp => `${exp.title || 'Role'} at ${exp.company || 'Company'}`).join('; ') || 'Not parsed';
    const educationSummary = applicant.education?.map(edu => `${edu.degree || 'Degree'} from ${edu.institution || 'Institution'}`).join('; ') || 'Not parsed';
    const stageNames = stagesConfig.map(s => s.name).join(', ');
    const currentStageName = stagesConfig.find(s => s.id === applicant.currentStageId)?.name || applicant.currentStageId;


    // --- Build Chat Context (Limit History Length) ---
    const MAX_HISTORY_TURNS = 5; // Keep last 5 pairs (10 messages total)
    const recentHistory = history.slice(-MAX_HISTORY_TURNS * 2);
    const chatContext = recentHistory.map(msg => ({
         role: msg.role,
         parts: [{ text: msg.parts[0].text }] // Ensure correct format
     }));

    // --- Construct the Enhanced Prompt ---
    const prompt = `
        You are Talenta AI Agent, a friendly, professional, and helpful recruitment assistant. You are chatting with a candidate.
        Your goal is to answer the candidate's questions accurately based ONLY on the Job Description, Candidate Profile, and Application Process information provided below.

        **IMPORTANT RULES:**
        1.  **Accuracy:** Only use the information explicitly given in the context sections below. Do NOT invent information, speculate, or access external websites/files.
        2.  **Confidentiality:** Do NOT reveal internal feedback, assessment scores, interviewer names, details about other candidates, or exact timelines unless explicitly stated in the context (which it won't be).
        3.  **Scope:** Focus on questions about the specific role applied for, the candidate's own profile details provided here, the general application stages, or their current status. Politely decline requests outside this scope.
        4.  **Timelines:** If asked about timelines, state that the recruitment team manages the schedule and will communicate updates, rather than giving specific dates you cannot guarantee.
        5.  **Feedback:** If asked for specific feedback not yet shared, politely state that feedback is provided according to the process timeline by the hiring team.
        6.  **Tone:** Maintain a professional, encouraging, and helpful tone. Keep responses concise.

        --- JOB DETAILS ---
        Job Title: ${job.title || 'N/A'}
        Location: ${job.location || 'N/A'}
        Department: ${job.department || 'N/A'}
        Full Description: ${job.description || 'N/A'}
        Required Skills/Qualifications: ${jobRequirementsString}
        Nice-to-Have Skills: ${jobNiceToHaveString}
        Salary Range: ${job.salaryRange || 'Not specified'}

        --- CANDIDATE PROFILE SUMMARY ---
        Candidate Name: ${applicant.name || 'N/A'}
        AI Parsed Summary: ${applicant.parsedSummary || 'Not available.'}
        Key Skills Parsed: ${candidateSkillsString}
        Recent Experience Summary: ${recentExperienceSummary}
        Education Summary: ${educationSummary}
        Provided Links: LinkedIn: ${applicant.advancedFields?.links?.linkedin || 'No'}, GitHub: ${applicant.advancedFields?.links?.github || 'No'}, Portfolio: ${applicant.advancedFields?.links?.portfolio || 'No'}

        --- APPLICATION PROCESS ---
        Candidate's Current Stage: ${currentStageName}
        General Application Stages (Typical Order): ${stageNames}

        --- CONVERSATION HISTORY ---
        ${recentHistory.map(msg => `${msg.role === 'user' ? 'Candidate' : 'Assistant'}: ${msg.parts[0].text}`).join('\n')}

        --- INSTRUCTION ---
        Candidate's latest message: "${userMessage}"

        Respond directly to the candidate based *only* on the information and rules provided above:
    `;

    // --- Call Gemini API ---
    try {
        console.log(`Calling Gemini for Candidate Chat (Applicant: ${applicantId}, Job: ${applicant.jobId})`);
        // Pass existing history (chatContext) to maintain conversation flow
        const modelResponse = await callGeminiAPI(prompt, chatContext);

        // --- Optional: Add safety check/filter on response ---
        // E.g., check if response tries to reveal forbidden info

        return modelResponse; // Return Gemini's response

    } catch (error) {
        console.error("Error calling Gemini for candidate chat:", error);
        return "I encountered an issue trying to process your request. Please try again shortly, or contact the recruitment team if the problem persists.";
    }
}

async function assessCandidate(jobData, applicantData, question, history = []) {
    // --- Fetch necessary data (already passed as args, but could enrich here if needed) ---
    const stagesConfig = dataStore.getStagesConfig(); // Get stage names/objectives

    // --- Prepare Data Strings for Prompt ---
    const jobRequirementsString = Array.isArray(jobData.requirements) ? jobData.requirements.join('\n- ') : (jobData.requirements || 'Not specified');
    const jobNiceToHaveString = Array.isArray(jobData.niceToHave) ? jobData.niceToHave.join('\n- ') : (jobData.niceToHave || 'Not specified');
    const candidateSkillsString = applicantData.skills?.map(s => `${s.name}${s.proficiencyLevel ? ` (${s.proficiencyLevel})` : ''}`).join(', ') || 'Not available';
    // Summarize experience more detailed for recruiter
    const experienceSummary = applicantData.workExperience?.map(exp =>
        `- ${exp.title || 'Role'} at ${exp.company || 'Company'} (${exp.duration || 'N/A'}): ${exp.description || ''} ${exp.achievements ? 'Achievements: ' + exp.achievements.join(', ') : ''}`
    ).join('\n') || 'Not available';
    const educationSummary = applicantData.education?.map(edu => `- ${edu.degree || 'Degree'} from ${edu.institution || 'Institution'} (${edu.duration || 'N/A'})`).join('\n') || 'Not available';
    const stageHistorySummary = applicantData.stageHistory?.map(stage => {
        const stageConfig = stagesConfig.find(sc => sc.id === stage.stageId);
        const feedbackSummary = stage.feedback?.slice(0, 2).map(fb => `${fb.by}: "${fb.comment.substring(0, 50)}..."`).join('; ') || 'No feedback yet';
        return `- Stage: ${stageConfig?.name || stage.stageId}, Status: ${stage.status || 'N/A'}, Entered: ${new Date(stage.enteredAt).toLocaleDateString()}, Feedback Summary: ${feedbackSummary}`;
    }).join('\n') || 'No stage history yet.';
    const currentStageName = stagesConfig.find(s => s.id === applicantData.currentStageId)?.name || applicantData.currentStageId;

    // --- Build Chat Context (Recruiter's previous Q&A with AI about THIS candidate) ---
    const MAX_HISTORY_TURNS = 4; // Keep history concise
    const recentHistory = history.slice(-MAX_HISTORY_TURNS * 2);
    const chatContext = recentHistory.map(msg => ({
         role: msg.role, // 'user' is recruiter, 'model' is AI assistant
         parts: [{ text: msg.parts[0].text }]
     }));

    // --- Construct the Enhanced Prompt ---
    const prompt = `
        You are Talenta AI Agent, an expert AI Recruitment Assistant helping a recruiter evaluate a candidate.
        Your goal is to analyze the provided Job Description and Candidate Profile data to answer the Recruiter's specific question accurately and insightfully.

        **IMPORTANT RULES:**
        1.  **Analyze, Don't Judge:** Provide objective analysis based *only* on the data provided below. Highlight matches, potential gaps, strengths, and weaknesses relative to the job requirements.
        2.  **Synthesize Information:** Combine information from different sections (e.g., skills mentioned vs. experience descriptions) to provide a holistic view.
        3.  **Context is Key:** Use the Job Description details as the primary benchmark for evaluating the candidate.
        4.  **Address the Question Directly:** Ensure your response directly answers the recruiter's question. If the data is insufficient, state that clearly.
        5.  **Be Concise but Informative:** Provide useful insights without unnecessary jargon or excessive length. Use bullet points for clarity where appropriate.
        6.  **Confidentiality:** Do not mention other candidates.

        --- JOB DETAILS (ID: ${jobData.id}) ---
        Title: ${jobData.title || 'N/A'}
        Location: ${jobData.location || 'N/A'}
        Department: ${jobData.department || 'N/A'}
        Description Summary: ${jobData.description?.substring(0, 500) || 'N/A'}...
        Requirements:
        - ${jobRequirementsString}
        Nice-to-Have:
        - ${jobNiceToHaveString}
        Salary Range: ${jobData.salaryRange || 'Not specified'}

        --- CANDIDATE PROFILE (ID: ${applicantData.id}) ---
        Name: ${applicantData.name || 'N/A'}
        AI Parsed Summary: ${applicantData.parsedSummary || 'Not available.'}
        Skills Parsed: ${candidateSkillsString}
        Work Experience Summary:
        ${experienceSummary}
        Education Summary:
        ${educationSummary}
        Certifications: ${applicantData.certifications?.join(', ') || 'None listed'}
        Links Provided: LinkedIn: ${applicantData.advancedFields?.links?.linkedin || 'No'}, GitHub: ${applicantData.advancedFields?.links?.github || 'No'}, Portfolio: ${applicantData.advancedFields?.links?.portfolio || 'No'}
        Career Trajectory Analysis (AI): ${applicantData.careerTrajectory || 'Not available.'}
        Discrepancies Flagged (AI): ${applicantData.discrepancies?.join(', ') || 'None'}

        --- APPLICATION & FEEDBACK HISTORY ---
        Current Stage: ${currentStageName}
        History Summary:
        ${stageHistorySummary}

        --- PREVIOUS CHAT ABOUT THIS CANDIDATE ---
        ${recentHistory.map(msg => `${msg.role === 'user' ? 'Recruiter' : 'AI Assistant'}: ${msg.parts[0].text}`).join('\n')}

        --- INSTRUCTION ---
        Recruiter's Question: "${question}"

        Provide your analysis and answer based *only* on the information and rules provided above:
    `;

    // --- Call Gemini API ---
    try {
        console.log(`Calling Gemini for Recruiter Assessment (Applicant: ${applicantData.id}, Job: ${jobData.id})`);
        // Pass history (chatContext)
        const modelResponse = await callGeminiAPI(prompt, chatContext);
        return modelResponse;

    } catch (error) {
        console.error("Error calling Gemini for recruiter assessment:", error);
        return "I encountered an error trying to analyze the candidate based on your question. Please check the details provided or try again.";
    }
}

async function getJobDescriptionSuggestions(jobData) {
    // Construct a prompt asking for structured JSON output
    const prompt = `
        You are an expert recruitment copywriter AI. Analyze the following job description details and provide suggestions for improvement for specific fields.
        Return your suggestions ONLY as a valid JSON object. Do not include any introductory text or markdown formatting before or after the JSON.
        The JSON object should have keys corresponding to the fields you are suggesting changes for (e.g., "suggestedTitle", "suggestedDescription", "suggestedRequirements").
        For each suggested field, provide the improved text.
        Also include a "suggestionsRationale" field explaining briefly why you made the suggestions (e.g., improved clarity, added keywords, stronger call to action).
        If a field is already good or you have no suggestion, you can omit it from the JSON response or provide the original text.

        Current Job Data:
        Title: ${jobData.title || ''}
        Department: ${jobData.department || ''}
        Location: ${jobData.location || ''}
        Description: ${jobData.description || ''}
        Requirements: ${jobData.requirements || ''} // Assuming string or simple array for now
        Nice-to-Have: ${jobData.niceToHave || ''}

        Generate the JSON suggestions object below:
    `;

    try {
        const rawResponse = await callGeminiAPI(prompt); // Use the existing helper

        // Attempt to parse the response as JSON
        console.log("Raw Gemini Suggestion Response:", rawResponse);
        let cleanedResponse = rawResponse.trim(); // Remove leading/trailing whitespace

        // Check for and remove ```json ... ``` markdown fences
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.substring(7); // Remove ```json\n
        }
        if (cleanedResponse.endsWith('```')) {
            cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
        }

        // Trim again just in case there was extra whitespace after removal
        cleanedResponse = cleanedResponse.trim();

        console.log("Cleaned Gemini Suggestion Response:", cleanedResponse); // Log the cleaned version
        // Attempt to parse the cleaned response as JSON
        let suggestions = JSON.parse(cleanedResponse); // This might fail if Gemini didn't return valid JSON
        return suggestions;

    } catch (error) {
        console.error("Error getting or parsing job description suggestions:", error);
         // Return an error structure or throw, depending on how you want to handle it
         return { error: "Failed to get valid suggestions from AI.", details: error.message };
    }
}

module.exports = {
    callGeminiAPI,
    enhanceJobDescription,
    assessCandidate,
    candidateChat,
    getJobDescriptionSuggestions,
    parseResumeAdvanced,
    rankApplicantsForJob,
    generateInterviewQuestions
    // Add more functions as needed
};