# Simple Messaging Site

This project implements a simple web-based messaging application based on the provided requirements.

## Features

*   User signup and login.
*   A single, shared group chat room.
*   Messages are stored persistently on the server in a JSON file (`data/messages.json`).
*   User accounts are stored in a JSON file (`data/users.json`). **Note:** Passwords are currently stored in plain text for simplicity, which is insecure. For a real application, password hashing (e.g., using `bcrypt`) is essential.
*   Session management using `express-session` to keep users logged in.
*   Messages display the username of the sender.
*   Messages display a timestamp indicating when they were sent.
*   A logout button allows users to end their session.

## Technologies Used

*   **Backend:** Node.js, Express.js
*   **Frontend:** HTML, CSS, JavaScript (using `fetch` for API calls)
*   **Data Storage:** JSON files
*   **Session Management:** `express-session`

## Project Structure

```
messaging_app/
├── data/
│   ├── messages.json   # Stores chat messages
│   └── users.json      # Stores user credentials
├── node_modules/       # Node.js dependencies (created by npm install)
├── public/
│   ├── chat.html       # Chat page UI
│   ├── client.js       # Frontend JavaScript logic
│   ├── login.html      # Login page UI
│   ├── signup.html     # Signup page UI
│   └── style.css       # CSS styles
├── package-lock.json # Dependency lock file
├── package.json      # Project metadata and dependencies
└── server.js         # Node.js/Express server logic
```

## How to Run Locally

1.  **Prerequisites:** Ensure you have Node.js and npm installed on your system.
2.  **Navigate to Project Directory:** Open your terminal or command prompt and change directory to the `messaging_app` folder.
    ```bash
    cd path/to/messaging_app
    ```
3.  **Install Dependencies:** If the `node_modules` directory is not present or you want to ensure all dependencies are installed, run:
    ```bash
    npm install
    ```
4.  **Start the Server:** Run the following command:
    ```bash
    node server.js
    ```
5.  **Access the Application:** Open your web browser and navigate to `http://localhost:3000`. You should be redirected to the login page.

## Implemented Bonus Features

*   Remember logged-in user using sessions (`express-session`).
*   Show a nice timestamp for messages (formatted using `toLocaleString`).
*   Show the username of who sent each message.
*   Add a log out button.
