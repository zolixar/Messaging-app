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

    // --- Password "Hashing"
    function encodePassword(password) {
        return btoa(password); // Base64 encoding
    }

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
        if (timerDisplaySpan) { 
            updateTimer();
        }
    }

    // API Functions
    async function fetchData(url, options = {}) {
        const res = await fetch(url, options);
        const isJSON = res.headers.get("content-type")?.includes("application/json");
        const data = isJSON ? await res.json() : { message: await res.text() };

        if (res.status === 401 && !["/api/login", "/api/signup"].includes(url)) {
            clearInterval(timerInterval);
            window.location.href = "/login.html";
        }

        return { ok: res.ok, status: res.status, data };
    }

    // Load and display messages
    async function loadMessages() {
        if (!messagesArea) return;

        const result = await fetchData("/api/messages");
        if (!result || !result.ok) return;

        messagesArea.innerHTML = "";

        result.data.forEach(msg => {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");

            const metaDiv = document.createElement("div");
            metaDiv.classList.add("meta");

            const usernameSpan = document.createElement("span");
            usernameSpan.classList.add("username");
            usernameSpan.textContent = msg.username;

            const emailSpan = document.createElement("span");
            emailSpan.classList.add("email");
            emailSpan.textContent = ` (${msg.email})`;

            const timestampSpan = document.createElement("span");
            timestampSpan.classList.add("timestamp");
            timestampSpan.textContent = formatTime(msg.timestamp);

            metaDiv.appendChild(usernameSpan);
            metaDiv.appendChild(emailSpan);
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
        e.preventDefault();
        showError("");  // Clear any previous error messages

        const username = loginForm.username.value;
        const password = encodePassword(loginForm.password.value);

        const result = await fetchData("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (result?.ok) {
            showSuccess("Successfully logged in!");
            setTimeout(() => {window.location.href = "/chat.html";}, 1000); 
        } else {
            showError("Invalid username or password.");  
        }
    });
}


    // Signup Form
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            showError("");
            showSuccess("");

            const formData = new FormData(signupForm);
            const password = encodePassword(formData.get("password"));

            const userData = {
                username: formData.get("username"),
                email: formData.get("email"),
                password
            };

            if (formData.get("password").length < 2) {
                showError("Password must be at least 2 characters.");
                return;
            }

            const result = await fetchData("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            if (result?.ok) {
                showSuccess("Signup successful! You can now login.");
                signupForm.reset();
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
                body: JSON.stringify({ text: messageText })
            });
            
            if (result && result.ok) {
                messageInput.value = "";
                loadMessages(); 
                resetTimer(); 
            }
        });
    }

    // Logout Button
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            clearInterval(timerInterval);
            await fetchData("/api/logout", { method: "POST" });
            window.location.href = "/login.html";
        });
    }

    // Initialize chat page
    if (window.location.pathname.endsWith("/chat.html")) {
        loadUserInfo();
        loadMessages();
        startTimer();
        setInterval(loadMessages, 5000);
    }
});