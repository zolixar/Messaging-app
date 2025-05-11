// Modules
const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const nodemailer = require("nodemailer");
// Express app
const app = express();
const PORT = 3001;
//Files-
app.use(express.static(path.join(__dirname, "public")));
// Parse JSON and form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//Sessions
app.use(session({
    secret: "14f7d7f6c458d1103d8af0d4c8b12b99d9e8a1f867003206c73026c367fcb478e262bef7d923fb27fc415a030c9754d9ec7d94cbfb43499d6f16810e989bdf16",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 10 * 60 * 1000 } // 10 minutes
}));

//Password Hashing
function decodePassword(encodedString) {
    return Buffer.from(encodedString, "base64").toString("utf-8");
}
//Email Sending
const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
        user: "admin email", 
        pass: "1234567890" // App password
    }
});

async function sendChatNotificationEmail(userEmail, messageCount) {
    const mailOptions = {
        from: "230504560@st.atlas.edu.tr",
        to: userEmail,
        subject: "Chat Room Update!",
        text: `Hello! The chat room now has ${messageCount} messages. Thanks for your contributions!`,
        html: `<p>Hello!</p><p>The chat room now has <strong>${messageCount}</strong> messages. Thanks for your contributions!</p>`
    };
    let info = await transporter.sendMail(mailOptions);
}

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
    const data = fs.readFileSync('data/messages.json', 'utf8');
    if(data) return JSON.parse(data);
    else return [];
};
//Write messages to messages.json
const writeMessages = (messages) => {
    fs.writeFileSync("data/messages.json", JSON.stringify(messages, null, 2), "utf8");
};

//Login Status
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {  
      next();             
  } else {
      res.status(401).json({ message: "Not authenticated" }); 
  }
};

// Routes
// Signup
app.post("/api/signup", (req, res) => {
    const { username, email, password: hashedPassword } = req.body; 
    if (!username || !hashedPassword || !email) {
        return res.status(400).json({ message: "Username, email, and password are required" });
    }
    const plainPassword = decodePassword(hashedPassword);
    let users = readUsers(); 
    for (const user of users) {
      if (user.username === username) {
          return res.status(400).json({ message: "Username already exists" });
      }
      if (user.email === email) {
        return res.status(400).json({ message: "Email already registered" });
    }
  }
    users.push({ username, email, password: plainPassword }); 
    writeUsers(users);
    res.status(200).json({ message: "Signup successful" });
});

// Login
app.post("/api/login", (req, res) => {
    const { username, password: hashedPassword } = req.body; 
    if (!username || !hashedPassword) {
        return res.status(400).json({ message: "Username and password are required" });
    }
    const users = readUsers();
    let user = null;
    const plainPasswordAttempt = decodePassword(hashedPassword);

    for (const u of users) {
        if (u.username === username && u.password === plainPasswordAttempt) { 
            user = u;
            break; 
        }
    }
    if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
    }
    req.session.user = { username: user.username, email: user.email }; 
    res.status(200).json({ message: "Login successful", redirect: "/chat.html" });
});

// Get current user
app.get("/api/user", isLoggedIn, (req, res) => {
    res.json({ username: req.session.user.username, email: req.session.user.email });
});

// Get messages
app.get("/api/messages", isLoggedIn, (req, res) => {
    const messages = readMessages();
    res.json(messages);
});

// Post a new message
app.post("/api/messages", isLoggedIn, (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ message: "Message text is required" });
    }

    let messages = readMessages();

    const newMessage = {
        username: req.session.user.username,
        email: req.session.user.email, 
        text: text,
        timestamp: new Date().toISOString()
    };

    messages.push(newMessage);
    writeMessages(messages);

    // Email notification logic
    if (messages.length > 0 && messages.length % 5 === 0) {
        const allUsers = readUsers();
        const senderEmail = req.session.user.email;

        const otherUsers = [];
        for (const user of allUsers) {
            if (user.email !== senderEmail) {
                otherUsers.push(user);
            }
        }

        if (otherUsers.length > 0) {
            otherUsers.forEach(user => {
                sendChatNotificationEmail(user.email, messages.length).catch(console.error);
            });
        }
    }
    res.status(201).json({ message: "Message saved" });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {});
    res.redirect('/login.html');
});

//Protected route - only accessible if logged in
app.get("/chat.html", isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "chat.html"));
});

//Root route
app.get("/", (req, res) => {
    if (req.session.user) {
        res.redirect("/chat.html");
    } else {
        res.redirect("/login.html");
    }
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});