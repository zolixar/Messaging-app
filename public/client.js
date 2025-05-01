document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const messageForm = document.getElementById("message-form");
    const messagesArea = document.getElementById("messages-area");
    const messageInput = document.getElementById("message-input");
    const logoutButton = document.getElementById("logout-button");
    const welcomeMessageSpan = document.getElementById("welcome-message");
    const errorMessageP = document.getElementById("error-message"); // Common for login/signup
    const successMessageP = document.getElementById("success-message"); // For signup
    const timerDisplaySpan = document.getElementById("timer-display"); // Session timer display

    // --- Session Timer Variables --- (Step 018)
    const SESSION_DURATION_SECONDS = 10 * 60; // 10 minutes
    let remainingSeconds = SESSION_DURATION_SECONDS;
    let sessionIntervalId = null;

    // --- Helper Functions --- 

    const displayError = (message, element = errorMessageP) => {
        if (element) {
            element.textContent = message;
            element.style.display = message ? "block" : "none";
        }
    };

    const displaySuccess = (message, element = successMessageP) => {
        if (element) {
            element.textContent = message;
            element.style.display = message ? "block" : "none";
        }
    };

    // Function to format timestamp
    const formatTimestamp = (isoString) => {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); 
        } catch (e) {
            console.error("Error formatting date:", e);
            return isoString;
        }
    };

    // Function to display a single message
    const displayMessage = (msg) => {
        if (!messagesArea || !msg || !msg.username || !msg.text) return;
        
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");

        const metaDiv = document.createElement("div");
        metaDiv.classList.add("meta");

        const usernameSpan = document.createElement("span");
        usernameSpan.classList.add("username");
        usernameSpan.textContent = msg.username;
        metaDiv.appendChild(usernameSpan);

        const timestampSpan = document.createElement("span");
        timestampSpan.classList.add("timestamp");
        timestampSpan.textContent = formatTimestamp(msg.timestamp);
        metaDiv.appendChild(timestampSpan);

        const textP = document.createElement("p");
        textP.textContent = msg.text;

        messageDiv.appendChild(metaDiv);
        messageDiv.appendChild(textP);

        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    };

    // --- Session Timer Functions --- (Step 018)
    const updateTimerDisplay = () => {
        if (!timerDisplaySpan) return;
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        timerDisplaySpan.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    const stopTimer = () => {
        if (sessionIntervalId) {
            clearInterval(sessionIntervalId);
            sessionIntervalId = null;
        }
    };

    const startTimer = () => {
        stopTimer(); // Clear any existing timer
        remainingSeconds = SESSION_DURATION_SECONDS;
        updateTimerDisplay(); // Update display immediately

        sessionIntervalId = setInterval(() => {
            remainingSeconds--;
            updateTimerDisplay();

            if (remainingSeconds <= 0) {
                stopTimer();
                timerDisplaySpan.textContent = "Expired";
                // Optional: Automatically log out or redirect after a delay
                alert("Your session has expired. Please log in again.");
                window.location.href = "/login.html"; 
            }
        }, 1000); // Run every second
    };

    const resetTimer = () => {
        // console.log("Resetting session timer due to activity."); // For debugging
        startTimer();
    };
    // --- End Session Timer Functions ---

    // Function to fetch and display messages
    const loadMessages = async () => {
        if (!messagesArea) return;
        try {
            const response = await fetch("/api/messages");
            if (response.ok) {
                const messages = await response.json();
                messagesArea.innerHTML = ""; // Clear existing messages
                messages.forEach(displayMessage);
                resetTimer(); // Reset timer on successful fetch (activity)
            } else if (response.status === 401) {
                stopTimer(); // Stop timer if unauthorized
                window.location.href = "/login.html";
            } else {
                console.error("Failed to load messages:", response.statusText);
                displayError("Could not load messages.", messagesArea);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            displayError("An error occurred while loading messages.", messagesArea);
        }
    };

    // Function to fetch user info
    const loadUserInfo = async () => {
        if (!welcomeMessageSpan || !logoutButton) return;
        try {
            const response = await fetch("/api/user");
            if (response.ok) {
                const user = await response.json();
                welcomeMessageSpan.textContent = `Welcome, ${user.username}!`;
                logoutButton.style.display = "inline-block";
                resetTimer(); // Reset timer on successful fetch (activity)
            } else if (response.status === 401) {
                 stopTimer(); // Stop timer if unauthorized
                 window.location.href = "/login.html";
            } else {
                console.error("Failed to load user info:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
        }
    };

    // --- Event Listeners --- 

    // Login Form
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            displayError("");
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                const result = await response.json();
                if (response.ok) {
                    window.location.href = "/chat.html";
                } else {
                    displayError(result.message || "Login failed.");
                }
            } catch (error) {
                console.error("Login error:", error);
                displayError("An error occurred during login.");
            }
        });
    }

    // Signup Form
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            displayError("");
            displaySuccess("");
            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch("/api/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                const result = await response.json();
                if (response.ok) {
                    displaySuccess(result.message || "Signup successful! Please login.");
                    signupForm.reset();
                } else {
                    displayError(result.message || "Signup failed.");
                }
            } catch (error) {
                console.error("Signup error:", error);
                displayError("An error occurred during signup.");
            }
        });
    }

    // Message Form (Chat Page)
    if (messageForm) {
        messageForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const messageText = messageInput.value.trim();
            if (!messageText) return;

            try {
                const response = await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: messageText }),
                });
                
                if (response.ok) {
                    messageInput.value = "";
                    loadMessages(); // Reload messages AND reset timer via loadMessages
                    // resetTimer(); // Explicitly reset timer on send (redundant if loadMessages resets)
                } else if (response.status === 401) {
                    stopTimer(); // Stop timer if unauthorized
                    window.location.href = "/login.html";
                } else {
                    const result = await response.json();
                    console.error("Failed to send message:", result.message);
                }
            } catch (error) {
                console.error("Error sending message:", error);
            }
        });
    }

    // Logout Button (Chat Page)
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            stopTimer(); // Stop timer on logout
            try {
                const response = await fetch("/api/logout", {
                    method: "POST",
                });
                if (response.ok) {
                    window.location.href = "/login.html";
                } else {
                    const result = await response.json();
                    console.error("Logout failed:", result.message);
                    alert("Logout failed. Please try again.");
                }
            } catch (error) {
                console.error("Logout error:", error);
                alert("An error occurred during logout.");
            }
        });
    }

    // --- Initial Page Load Logic --- 

    // If on chat page, load user info, messages, and start timer
    if (window.location.pathname.endsWith("/chat.html")) {
        if (messagesArea) { // Only run if chat elements exist
             loadUserInfo(); // This will call resetTimer on success
             loadMessages(); // This will call resetTimer on success
        }
    }
});

