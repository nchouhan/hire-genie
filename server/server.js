require('dotenv').config();
const express = require('express');
const path = require('path');
const dataStore = require('./services/dataStore');
console.log("Imported dataStore keys:", Object.keys(dataStore)); // <--- for debugging only
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3010;

console.log("Starting server...");

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
console.log("Middleware initialized.");
// Serve static files (Frontend)

const publicDirPath = path.join(__dirname, '../public'); // Calculate path
console.log(`Serving static files from: ${publicDirPath}`); // <-- ADD THIS LOG
app.use(express.static(publicDirPath)); // Use the variable


// app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', apiRoutes);
console.log("API routes initialized.");
// Serve Candidate Page (using job ID as part of the path)
app.get('/apply/:jobId', (req, res) => {
    console.log(`>>> HIT /apply/:jobId route. Serving candidate.html for ${req.params.jobId}`); // Specific log
    res.sendFile(path.join(__dirname, '../public', 'candidate.html'));
});
 // Serve Candidate Portal (using applicant ID) - needs a unique, secure way
 app.get('/portal/:applicantId', (req, res) => {
    console.log(`>>> HIT /portal/:applicantId route. Serving candidate.html for ${req.params.applicantId}`); // Specific log
    if (dataStore.getApplicant(req.params.applicantId)) {
         res.sendFile(path.join(__dirname, '../public', 'candidate.html'));
    } else {
         console.log(`>>> /portal/:applicantId - Applicant not found, sending 404 for ${req.params.applicantId}`);
         res.status(404).send('Applicant portal not found.'); // Send simple 404 text
    }
});

// Add a specific root route handler BEFORE the catch-all
app.get('/', (req, res) => {
    console.log(`>>> HIT / route explicitly. Serving index.html.`); // Specific log for root
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// --- Catch-all Route (Serve index.html - MUST BE LAST) ---
app.get('*', (req, res) => {
    console.log(`>>> HIT Catch-All (*) route for path: ${req.path}. Serving index.html.`); // Specific log
    // Ensure this ONLY serves index.html
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});


// Initialize Data Store and Start Server
dataStore.initDataStore().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize data store:", err);
    process.exit(1); // Exit if data can't be loaded/initialized
});

// Graceful shutdown - save data before exiting
process.on('SIGINT', async () => {
    console.log("SIGINT received. Saving data...");
    // await dataStore.saveData(); // node-persist handles this better automatically
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log("SIGTERM received. Saving data...");
    // await dataStore.saveData();
    process.exit(0);
});