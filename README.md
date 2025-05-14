# Chat Application

A simple web-based messaging application with user authentication and real-time chat functionality.

## Features

* User registration and login
* Shared group chat room
* Persistent message storage
* User session management
* Message timestamps and sender identification
* Session timeout with visual countdown
* Logout functionality
* Email notifications at message milestones

## Technologies

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js, Express.js
* **Storage:** JSON files
* **Authentication:** Session-based with express-session
* **Notifications:** Nodemailer

## Project Structure

```
project/
├── data/
│   ├── messages.json   # Stores chat messages
│   └── users.json      # Stores user accounts
├── public/
│   ├── chat.html       # Chat interface
│   ├── login.html      # Login page
│   ├── signup.html     # Registration page
│   ├── client.js       # Frontend logic
│   └── style.css       # Styling
├── package.json        # Dependencies
└── server.js           # Express server
```

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Server:**
   ```bash
   node server.js
   ```

3. **Access the Application:**
   Open your web browser and navigate to `http://localhost:3001`
