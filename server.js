// Modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
// Express app
const app = express();
const PORT = 3000;
// Static files
app.use(express.static(path.join(__dirname, 'public')));
// Parse JSON and form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//Sessions
app.use(session({
    secret: '14f7d7f6c458d1103d8af0d4c8b12b99d9e8a1f867003206c73026c367fcb478e262bef7d923fb27fc415a030c9754d9ec7d94cbfb43499d6f16810e989bdf16',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 10 * 60 * 1000 } // 10 minutes
}));

//Read users from users.json
const readUsers = () => {
    const filePath ='data/users.json';
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return data ? JSON.parse(data) : []; 
};
//Write users to users.json
const writeUsers = (users) => {
    fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2), 'utf8');
    
};
//Read messages from messages.json
const readMessages = () => {
    const filePath = 'data/messages.json';
    const data = fs.readFileSync(filePath, 'utf8');
    return data ? JSON.parse(data) : [];
};
//Write messages to messages.json
const writeMessages = (messages) => {
    fs.writeFileSync('data/messages.json', JSON.stringify(messages, null, 2), 'utf8');
};

//Login Status
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {  // Check if the user is logged in
      next();             // Allow the request to proceed
  } else {
      res.status(401).json({ message: 'Not authenticated' }); // Deny access
  }
};

// Routes
// Signup
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    let users = readUsers();
    // Check if username already exists
    for (const user of users) {
      if (user.username === username) {
          return res.status(400).json({ message: 'Username already exists' });
      }
  }
    // Add new user
    users.push({ username, password });
    writeUsers(users);
    // Response
    res.status(200).json({ message: 'Signup successful' });
});
// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
  }
  const users = readUsers();
  let user = null;
  for (const u of users) {
      if (u.username === username && u.password === password) {
          user = u;
          break; 
      }
  }
  if (!user) {
      // No match found — deny login
      return res.status(401).json({ message: 'Invalid username or password' });
  }
  // Store user in session if match found
  req.session.user = { username: user.username };

  res.status(200).json({ message: 'Login successful', redirect: '/chat.html' });
});

// Get current user
app.get('/api/user', isLoggedIn, (req, res) => {
    res.json({ username: req.session.user.username });
});

// Get messages
app.get('/api/messages', isLoggedIn, (req, res) => {
    const messages = readMessages();
    res.json(messages);
});

// Post a new message
app.post('/api/messages', isLoggedIn, (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ message: 'Message text is required' });
    }
    const messages = readMessages();
    const newMessage = {
        username: req.session.user.username,
        text: message,
        timestamp: new Date().toISOString()
    };
    messages.push(newMessage);
    writeMessages(messages);
    res.status(201).json({ message: 'Message sent successfully' });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.status(200).json({ message: 'Logout successful', redirect: '/login.html' });
    });
});

// Protected route - only accessible if logged in
app.get('/chat.html', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Root route - redirect to login page
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});