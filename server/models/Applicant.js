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

        // --- Application Lifecycle & Ranking (Managed Separately or Here) ---
        this.currentStageId = 'parsing'; // Start with a parsing/ranking stage
        this.stageHistory = [/* ... existing structure ... */];
        this.rankings = { // Store job-specific ranking
            // jobId: { overallScore: 92, skillMatch: 85, experienceRelevance: 95, ... , generatedSummary: "...", isHiddenGem: false }
        };
        this.notes = []; // Array of { by: 'hm@email.com', timestamp: ..., text: '...' }
        this.votes = {}; // { 'hm@email.com': 'yes'/'no'/'maybe' }
        this.anonymized = false; // Flag for bias mitigation view

        // --- Original Files/Links (Store paths or URLs) ---
        this.originalCvPath = initialData.originalCvPath || null;
        this.submittedLinks = initialData.submittedLinks || [];

        this.chatHistory = []; // Keep candidate chat if implemented
    }
}
module.exports = Applicant;