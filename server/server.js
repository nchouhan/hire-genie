require('dotenv').config();
const express = require('express');
const path = require('path');
const dataStore = require('./services/dataStore');
console.log("Imported dataStore keys:", Object.keys(dataStore)); // <--- for debugging only
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

console.log("Starting server...");

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
console.log("Middleware initialized.");
// Serve static files (Frontend)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', apiRoutes);
console.log("API routes initialized.");
// Serve Candidate Page (using job ID as part of the path)
app.get('/apply/:jobId', (req, res) => {
    // You could check if jobId exists here if needed
    res.sendFile(path.join(__dirname, '../public', 'candidate.html'));
});
console.log("Candidate page route initialized.");
 // Serve Candidate Portal (using applicant ID) - needs a unique, secure way
app.get('/portal/:applicantId', (req, res) => {
    // Basic check if applicant exists
    if (dataStore.getApplicant(req.params.applicantId)) {
         res.sendFile(path.join(__dirname, '../public', 'candidate.html')); // Reuse same HTML, JS handles mode
    } else {
         res.status(404).send('Applicant portal not found.');
    }
});


// Catch-all for SPA routing (if using a frontend framework) or just serve index
app.get('*', (req, res) => {
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