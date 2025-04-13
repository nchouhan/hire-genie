// server/models/Applicant.js
class Applicant {
    constructor(jobId, source = 'Direct Link', initialData = {}) { // Accept initial data from parsing
        this.id = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        this.jobId = jobId;
        this.source = source;
        this.appliedAt = new Date().toISOString();

        // --- Parsed Basic Info ---
        this.name = initialData.name || '';
        this.email = initialData.email || '';
        this.phone = initialData.phone || '';
        this.parsedSummary = initialData.parsedSummary || ''; // AI-refined summary

        // --- Structured Parsed Data ---
        this.workExperience = initialData.workExperience || []; // Array of { company, location, type, duration, achievements[], responsibilities[] }
        this.skills = initialData.skills || []; // Array of { name, proficiencyLevel ('Beginner'/'Intermediate'/'Expert'/'Unknown') }
        this.education = initialData.education || []; // Array of { degree, institution, specialization, duration, gpa }
        this.certifications = initialData.certifications || []; // Array of { name, authority, date, relevance }
        this.advancedFields = { // Object for less common fields
            patents: initialData.patents || [], // Array of { title, number, date }
            papers: initialData.papers || [], // Array of { title, journal, doi }
            links: initialData.links || { linkedin: '', github: '', portfolio: '', other: [] },
            sentiment: initialData.sentiment || null // e.g., Sentiment analysis result
        };

        // --- Enrichment & Analysis ---
        this.linkedinValidated = initialData.linkedinValidated || false;
        this.discrepancies = initialData.discrepancies || []; // List of flagged issues
        this.careerTrajectory = initialData.careerTrajectory || null; // AI analysis result

        this.currentStageId = 'parsing'; // Start with a parsing/ranking stage
        this.notes = initialData.notes || []; // Array of { by: 'hm@email.com', timestamp: ..., text: '...' }
        this.votes = initialData.votes || {}; // { 'hm@email.com': 'yes'/'no'/'maybe' }

        // --- Original Files/Links (Store paths or URLs) ---
        this.submittedLinks = initialData.submittedLinks || [];

        this.chatHistory = []; // Keep candidate chat if implemented
        this.rankings = initialData.rankings || {};
        this.anonymized = initialData.anonymized || false;
        this.originalCvPath = initialData.originalCvPath || null;
        

        this.stageHistory = initialData.stageHistory || [{ // Example initial stage if needed
             stageId: 'submitted', // Or the first actual stage from config
             enteredAt: new Date().toISOString(),
             assignedTo: 'System', // Or initial recruiter
             feedback: [], // Feedback array for this stage instance
             overallFeedback: '', // HM's summary for the stage
             status: 'pending_review' // pending, passed, rejected, completed-passed, completed-rejected
        }];
    }
}
module.exports = Applicant;