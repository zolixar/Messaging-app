document.addEventListener("DOMContentLoaded", () => {//Ensures DOM is Ready
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const messageForm = document.getElementById("message-form");
    const messagesArea = document.getElementById("messages-area");
    const messageInput = document.getElementById("message-input");
    const logoutButton = document.getElementById("logout-button");
    const welcomeMessageSpan = document.getElementById("welcome-message");
    const errorMessageP = document.getElementById("error-message");
    const successMessageP = document.getElementById("success-message");
    const timerDisplaySpan = document.getElementById("timer-display");

    // Session timer variables
    const SESSION_TIMEOUT = 10*60; // 10 minutes in seconds
    let timeRemaining = SESSION_TIMEOUT;
    let timerInterval = null;

    // Helper Functions
    function showError(message) {
        if (errorMessageP) {
            errorMessageP.textContent = message;
            errorMessageP.style.display = message ? "block" : "none";
        }
    }

    function showSuccess(message) {
        if (successMessageP) {
            successMessageP.textContent = message;
            successMessageP.style.display = message ? "block" : "none";
        }
    }

    function formatTime(timestamp) {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    // Session Timer Functions
    function updateTimer() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplaySpan.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        
        if (timeRemaining == 0) {
            clearInterval(timerInterval);
            alert("Your session has expired. Please log in again.");
            window.location.href = "/login.html";
        }
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timeRemaining = SESSION_TIMEOUT;
        updateTimer();
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimer();
        }, 1000);
    }

    function resetTimer() {
        timeRemaining = SESSION_TIMEOUT;
        updateTimer();
    }

    // API Functions
    async function fetchData(url, options = {}) {
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (response.status === 401) {
                if (url !== "/api/login") { // Don't redirect if it's a login attempt
                    clearInterval(timerInterval);
                    window.location.href = "/login.html";
                }
            }
            
            return { ok: response.ok, status: response.status, data };
        } catch (error) {
            console.error(`Error with ${url}:`, error);
            return { ok: false, error };
        }
    }

    // Load and display messages
    async function loadMessages() {
        if (!messagesArea) return;
        
        const result = await fetchData("/api/messages");
        if (!result || !result.ok) return;
        
        // Clear existing messages
        messagesArea.innerHTML = "";
        
        // Display each message
        result.data.forEach(msg => {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
            
            const metaDiv = document.createElement("div");
            metaDiv.classList.add("meta");
            
            const usernameSpan = document.createElement("span");
            usernameSpan.classList.add("username");
            usernameSpan.textContent = msg.username;
            
            const timestampSpan = document.createElement("span");
            timestampSpan.classList.add("timestamp");
            timestampSpan.textContent = formatTime(msg.timestamp);
            
            metaDiv.appendChild(usernameSpan);
            metaDiv.appendChild(timestampSpan);
            
            const textP = document.createElement("p");
            textP.textContent = msg.text;
            
            messageDiv.appendChild(metaDiv);
            messageDiv.appendChild(textP);
            messagesArea.appendChild(messageDiv);
        });
        
        // Scroll to bottom
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // Load user info
    async function loadUserInfo() {
        if (!welcomeMessageSpan || !logoutButton) return;
        
        const result = await fetchData("/api/user");
        if (!result || !result.ok) return;
        
        welcomeMessageSpan.textContent = `Welcome, ${result.data.username}!`;
        logoutButton.style.display = "inline-block";
    }

    // Event Listeners
    // Login Form
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Prevent form submission
            showError(""); // Clear previous errors
            
            const formData = new FormData(loginForm);
            const userData = {
                username: formData.get("username"),
                password: formData.get("password")
            };
            
            const result = await fetchData("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });
            
            if (result && result.ok) {
                window.location.href = "/chat.html";
            } else {
                // Display error message and don't redirect
                showError(result?.data?.message || "Login failed");
            }
        });
    }

    // Signup Form
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Prevent form submission
            showError("");
            showSuccess("");
            
            const formData = new FormData(signupForm);
            const userData = {
                username: formData.get("username"),
                password: formData.get("password")
            };
            
            const result = await fetchData("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });
            
            if (result && result.ok) {
                showSuccess("Signup successful! Please login.");
                signupForm.reset();
            } else {
                showError(result?.data?.message || "Signup failed");
            }
        });
    }

    // Message Form
    if (messageForm) {
        messageForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const messageText = messageInput.value.trim();
            if (!messageText) return;
            
            const result = await fetchData("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: messageText })
            });
            
            if (result && result.ok) {
                messageInput.value = "";
                loadMessages();
            }
        });
    }

    // Logout Button
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            clearInterval(timerInterval);
            
            const result = await fetchData("/api/logout", { method: "POST" });
            if (result && result.ok) {
                window.location.href = "/login.html";
            }
        });
    }

    // Initialize chat page
    if (window.location.pathname.endsWith("/chat.html")) {
        loadUserInfo();
        loadMessages();
        startTimer();
        // Set up auto-refresh for messages
        setInterval(loadMessages, 3000); // Refresh messages every 10 seconds
    }
});