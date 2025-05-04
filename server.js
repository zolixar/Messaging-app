const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const usersFilePath = path.join(__dirname, "data", "users.json");
const messagesFilePath = path.join(__dirname, "data", "messages.json");

// Helper function to read JSON data
const readJsonFile = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            // If file doesn't exist, create it with default structure
            if (filePath.includes("users.json")) writeJsonFile(filePath, []);
            if (filePath.includes("messages.json")) writeJsonFile(filePath, []);
        }
        const data = fs.readFileSync(filePath, "utf8");
        // Handle empty file case
        return data ? JSON.parse(data) : (filePath.includes("users.json") ? [] : []);
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        // Return default structure on error
        if (filePath.includes("users.json")) return [];
        if (filePath.includes("messages.json")) return [];
        return null;
    }
};

// Helper function to write JSON data
const writeJsonFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
        console.error(`Error writing file ${filePath}:`, err);
    }
};

// Middleware
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// Session configuration - Updated for 10-minute rolling session
app.use(session({
    secret: "a-very-strong-and-secure-secret-key", // IMPORTANT: Change this in production!
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't save session if never modified
    rolling: true, // Reset the session maxAge on every response (for activity-based timeout)
    cookie: { 
        secure: false, // Set to true if using HTTPS
        httpOnly: true, // Helps prevent XSS attacks
        maxAge: 10 * 60 * 1000 // Session duration: 10 minutes (in milliseconds)
    }
}));

// Middleware to check if user is authenticated for API routes
const isAuthenticatedAPI = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: "Unauthorized: Please log in." });
    }
};

// Middleware to check if user is authenticated for HTML pages
const isAuthenticatedPage = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login.html");
    }
};

// --- Routes --- 

// Root route: Redirect to chat if logged in, otherwise to login
app.get("/", (req, res) => {
    if (req.session.user) {
        res.redirect("/chat.html");
    } else {
        res.redirect("/login.html");
    }
});

// Serve login page
app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Serve signup page
app.get("/signup.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "signup.html"));
});

// Serve chat page only if authenticated
app.get("/chat.html", isAuthenticatedPage, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// --- API Routes --- 

// Signup
app.post("/api/signup", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }
    const users = readJsonFile(usersFilePath);
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(409).json({ message: "Username already exists." });
    }
    // Note: Storing passwords in plain text is insecure. Hashing is recommended.
    const newUser = { username, password }; 
    users.push(newUser);
    writeJsonFile(usersFilePath, users);
    console.log(`User signed up: ${username}`);
    res.status(201).json({ message: "Signup successful! Please login." });
});

// Login
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }
    const users = readJsonFile(usersFilePath);
    const user = users.find(user => user.username === username);
    // IMPORTANT: Comparing plain text passwords. Insecure!
    if (!user || user.password !== password) { 
        return res.status(401).json({ message: "Invalid username or password." });
    }
    req.session.user = { username: user.username }; 
    console.log(`User logged in: ${username}`);
    res.status(200).json({ message: "Login successful!" });
});

// Logout
app.post("/api/logout", isAuthenticatedAPI, (req, res) => {
    const username = req.session.user.username;
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Logout failed. Please try again." });
        }
        console.log(`User logged out: ${username}`);
        res.status(200).json({ message: "Logout successful!" });
    });
});

// Get messages
app.get("/api/messages", isAuthenticatedAPI, (req, res) => {
    const messages = readJsonFile(messagesFilePath);
    res.status(200).json(messages);
});

// Post message
app.post("/api/messages", isAuthenticatedAPI, (req, res) => {
    const { message } = req.body;
    if (!message || message.trim() === "") {
        return res.status(400).json({ message: "Message content cannot be empty." });
    }

    const messages = readJsonFile(messagesFilePath);
    const newMessage = {
        username: req.session.user.username, // Get username from session
        text: message.trim(),
        timestamp: new Date().toISOString() // Add ISO timestamp
    };

    messages.push(newMessage);
    writeJsonFile(messagesFilePath, messages);

    console.log(`Message posted by ${newMessage.username}: ${newMessage.text}`);
    // Return the newly created message, useful for client-side updates
    res.status(201).json(newMessage); 
});

// Get current user info (useful for frontend)
app.get("/api/user", isAuthenticatedAPI, (req, res) => {
    res.json({ username: req.session.user.username }); 
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});