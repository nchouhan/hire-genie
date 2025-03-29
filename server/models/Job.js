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
    }
}
module.exports = Job;