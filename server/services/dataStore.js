// Using node-persist for simplicity
const storage = require('node-persist');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data'); // Store in server/data

let data = {
    jobs: {}, // { jobId: JobObject }
    applicants: {}, // { applicantId: ApplicantObject }
    recruiterChats: {},
    
    stagesConfig: [
        { id: 'screening1', name: 'Screening Round 1', objectives: ['Basic fit check', 'Communication skills'] },
        { id: 'screening2', name: 'Screening Round 2', objectives: ['Technical screening', 'Problem-solving ability'] },
        { id: 'interview1', name: 'Interview Round 1', objectives: ['Deep technical dive', 'Team fit assessment'] },
        { id: 'submitted', name: 'Candidate Submitted ', objectives: ['Initial Submission', 'NA'] },
        // ... add other stages: interview2, interview3, offering, joining
    ]
};

async function initDataStore() {
    await storage.init({
        dir: dataFilePath,
        stringify: JSON.stringify,
        parse: JSON.parse,
        encoding: 'utf8',
        logging: false, // Enable for debugging
        ttl: false, // Persistent data
        expiredInterval: 2 * 60 * 1000, // Ttl interval
        // For strict FS sync:
        forgiveParseErrors: false
    });

    // Load existing data or initialize if file doesn't exist
    const loadedJobs = await storage.getItem('jobs');
    const loadedApplicants = await storage.getItem('applicants');
    // -- Loaded Jobs ---
    if (loadedJobs) {
        data.jobs = loadedJobs;
        console.log('Loaded jobs from filesystem.');
    } else {
        await storage.setItem('jobs', data.jobs); // Initialize file
        console.log('Initialized jobs data file.');
    }
    // --- Load Applicants ---
    if (loadedApplicants) {
        data.applicants = loadedApplicants;
        console.log('Loaded applicants from filesystem.');
    } else {
        await storage.setItem('applicants', data.applicants); // Initialize file
        console.log('Initialized applicants data file.');
    }

    // --- Load Chat History ---
    const loadedChats = await storage.getItem('recruiterChats');
    data.recruiterChats = loadedChats || {};
    if (!loadedChats) await storage.setItem('recruiterChats', data.recruiterChats);
    console.log(`Loaded/Initialized ${Object.keys(data.recruiterChats).length} chat histories.`);
}

async function saveData() {
    try {
        await storage.setItem('jobs', data.jobs);
        await storage.setItem('applicants', data.applicants);
        await storage.setItem('recruiterChats', data.recruiterChats);
        console.log('Data saved to filesystem.');
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

// --- Accessor Functions ---
function getJobs() { return data.jobs; }
function getJob(id) { return data.jobs[id]; }
function addJob(job) { data.jobs[job.id] = job; saveData(); } // Save after modification
function updateJob(job) { data.jobs[job.id] = job; saveData(); }

function getApplicants() { return data.applicants; }
function getApplicant(id) { return data.applicants[id]; }
function addApplicant(applicant) { data.applicants[applicant.id] = applicant; saveData(); }
function updateApplicant(applicant) { data.applicants[applicant.id] = applicant; saveData(); }
function getApplicantsForJob(jobId) {
    return Object.values(data.applicants).filter(app => app.jobId === jobId);
}
// --- NEW: Chat History Accessor Functions ---
function getChatHistoryKey(jobId, applicantId) {
    return `${jobId}_${applicantId}`; // Consistent key format
}

function getRecruiterChatHistory(jobId, applicantId) {
    const key = getChatHistoryKey(jobId, applicantId);
    return data.recruiterChats[key] || []; // Return empty array if not found
}

function updateRecruiterChatHistory(jobId, applicantId, historyArray) {
    const key = getChatHistoryKey(jobId, applicantId);
    // Optional: Limit history length BEFORE saving
    const MAX_STORED_HISTORY = 50;
     if (historyArray.length > MAX_STORED_HISTORY) {
         data.recruiterChats[key] = historyArray.slice(-MAX_STORED_HISTORY);
     } else {
         data.recruiterChats[key] = historyArray;
     }
    saveData(); // Save after modification
}
function getStagesConfig() { return data.stagesConfig; }


module.exports = {
    initDataStore,
    getJobs,
    getJob,
    addJob,
    updateJob,
    getApplicants,
    getApplicant,
    addApplicant,
    updateApplicant,
    getApplicantsForJob,
    getStagesConfig,
    getRecruiterChatHistory,
    updateRecruiterChatHistory
};