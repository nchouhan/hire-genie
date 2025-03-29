// server/models/Applicant.js
class Applicant {
    constructor(jobId, name, email, phone, resumeLink, coverLetter = '', source = 'Direct Link') {
        this.id = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`; // Unique ID
        this.jobId = jobId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.resumeLink = resumeLink; // Assume link for simplicity, could be file upload path
        this.coverLetter = coverLetter;
        this.source = source;
        this.appliedAt = new Date().toISOString();
        this.currentStageId = 'screening1'; // Start at the first stage
        this.stageHistory = [ // Track progress and feedback
            // {
            //   stageId: 'screening1',
            //   enteredAt: new Date().toISOString(),
            //   assignedTo: 'recruiter@example.com', // User email or ID
            //   feedback: [ { by: 'user@example.com', comment: 'Looks promising', rating: 4, submittedAt: ... } ],
            //   overallFeedback: '',
            //   status: 'pending' // pending, passed, rejected
            // }
        ];
        this.chatHistory = []; // For candidate chat interface { role: 'user'/'model', parts: [{text: '...'}] }
    }
}
module.exports = Applicant;