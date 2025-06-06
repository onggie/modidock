const express = require('express');
const cors = 'cors';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// --- Initial Setup ---
const app = express();
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET;

// --- Essential Pre-flight Checks ---
if (!jwtSecret) {
    console.error("FATAL ERROR: JWT_SECRET not found. Please set it in your .env file.");
    process.exit(1);
}

// --- In-Memory "Database" ---
// WARNING: This data is temporary and will be lost on server restart.
// This is for demonstration purposes only.
const users = [];
let userIdCounter = 1;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// --- API Routes ---

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // Check if user already exists in our array
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already taken.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create a new user object and add it to our array
        const newUser = {
            id: userIdCounter++,
            username: username,
            password: hashedPassword
        };
        users.push(newUser);
        
        console.log('User registered:', newUser); // Log for debugging
        console.log('All users:', users);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find the user in our array
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const tokenPayload = { id: user.id, username: user.username };
        const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Example protected route
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: `Welcome ${req.user.username}! This is a protected route.` });
});

// --- SPA Catch-all Route ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Server Startup ---
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
    console.log("Running in 'no database' mode. User data is temporary.");
});
