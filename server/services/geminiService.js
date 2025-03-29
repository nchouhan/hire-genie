require('dotenv').config();
//Not required if using native fetch which is available in Node.js 18+
// const fetch = require('node-fetch'); // Uncomment if using Node.js < 18
// If using native fetch, ensure your Node.js version is 18 or higher
// const fetch = require('node-fetch'); // Or use native fetch

const API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`; // Adjust model name if needed

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

async function assessCandidate(jobData, applicantData, question) {
     const prompt = `
        You are an expert recruitment AI assistant evaluating a candidate for a specific role.
        Recruiter's Question: "${question}"

        Job Description Details:
        Title: ${jobData.title}
        Description: ${jobData.description}
        Required Qualifications: ${jobData.requirements}
        Nice-to-Have: ${jobData.niceToHave || 'N/A'}

        Candidate Application Details:
        Name: ${applicantData.name}
        Resume/Profile Summary (if available, otherwise use cover letter): ${applicantData.resumeLink} [Note: AI cannot access external links directly. Provide text summary if possible]
        Cover Letter: ${applicantData.coverLetter || 'N/A'}
        Applied For: ${jobData.title} at ${jobData.location}

        Based ONLY on the provided job and candidate details, answer the recruiter's question concisely and objectively. If the information isn't present to answer fully, state that. Do not invent information.
    `;
    // In a real app, you might fetch resume text here if stored locally
    return await callGeminiAPI(prompt);
}

 async function candidateChat(applicantId, userMessage, history = []) {
    const applicant = require('./dataStore').getApplicant(applicantId); // Get latest applicant data if needed
    const job = require('./dataStore').getJob(applicant.jobId);

     // Simple history management (limit length if needed)
    const chatContext = history.map(msg => ({
         role: msg.role,
         parts: [{ text: msg.parts[0].text }] // Ensure correct format
     }));

    const prompt = `
        You are a friendly and helpful recruitment assistant chatting with a candidate named ${applicant.name} who applied for the ${job.title} role.
        Keep responses concise, professional, and encouraging.
        Do NOT reveal internal feedback or specific details about other candidates or interviewers unless explicitly told to.
        Focus on answering candidate questions about the role (based on the description below), the application process stages, or providing general status updates.
        If asked for feedback they haven't received yet, politely state that feedback will be shared at the appropriate time according to the process.

        Job Description Summary:
        Title: ${job.title}
        Description: ${job.description}
        Requirements: ${job.requirements}

        Current Candidate Stage: ${applicant.currentStageId}

        Candidate's Message: "${userMessage}"

        Respond to the candidate:
    `;
     // Pass existing history to maintain conversation context
    return await callGeminiAPI(prompt, chatContext);
}

module.exports = {
    enhanceJobDescription,
    assessCandidate,
    candidateChat
};