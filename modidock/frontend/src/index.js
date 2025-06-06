// index.js

const express = require('express');
const mongoose = require('mongoose');

// --- Configuration ---
const PORT = 7000;
// Since MongoDB is running in the SAME container, we connect to localhost.
const MONGO_URL = "mongodb://localhost:27017/modidock";

// --- Create Express App ---
const app = express();

// --- Database Connection ---
mongoose.connect(MONGO_URL)
    .then(() => {
        console.log("Successfully connected to MongoDB inside the container!");

        // Start listening for requests only after the DB connection is successful
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("\n--- MONGODB CONNECTION FAILED ---");
        console.error("Could not connect to the database. Exiting...");
        console.error("Error details:", err.message);
        console.error("----------------------------------\n");
        process.exit(1); // Exit the process with an error code
    });

// --- Routes ---
app.get('/', (req, res) => {
    res.send('Hello from your self-contained Node.js + MongoDB container!');
});

app.get('/health', (req, res) => {
    // Check MongoDB connection state
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
        res.status(200).json({ status: 'OK', message: 'Service is up and connected to MongoDB' });
    } else {
        res.status(503).json({ status: 'ERROR', message: 'Service is down, MongoDB connection lost' });
    }
});