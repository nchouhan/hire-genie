// server/models/Job.js
class Job {
    constructor(title, department, location, description, requirements, niceToHave = '', salaryRange = '', createdBy = 'System') {
        this.id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`; // Unique ID
        this.title = title;
        this.department = department;
        this.location = location;
        this.description = description;
        this.requirements = requirements; // Array or string
        this.niceToHave = niceToHave;
        this.salaryRange = salaryRange;
        this.status = 'open'; // open, closed, filled
        this.createdAt = new Date().toISOString();
        this.createdBy = createdBy;
        this.applicants = []; // Array of applicant IDs
        // --- JD Analysis Fields ---
        this.jdKeywords = { // Store extracted keywords and weights for ranking
            requiredSkills: [/* { skill: 'Python', weight: 5 } */],
            experienceYears: { min: 5, weight: 4 },
            culturalFit: [/* { keyword: 'collaboration', weight: 3 } */],
            // ... other categories based on JD analysis
        };
        this.rankingModelWeights = { // Allow HM to adjust category weights
            skillMatch: 0.4,
            experienceRelevance: 0.25,
            achievementImpact: 0.15,
            educationCerts: 0.1,
            innovationPotential: 0.1
       };
    }
}
module.exports = Job;