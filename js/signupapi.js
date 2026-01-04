
async function handleSignup() {
    console.log("Signup attempt initiated.");
    const errorMessage = document.getElementById("error-message");
    errorMessage.style.display = "none";

    // Get Values
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;
    const dobInput = document.getElementById("dob").value;

    // Validation
    if (!username || !email || !mobile || !password || !dobInput) {
        showError("All fields are required.");
        return;
    }

    if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
    }

    // Age Validation
    const dob = new Date(dobInput);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    if (age < 18) {
        showError("You must be at least 18 years old to sign up.");
        return;
    }

    // API Endpoint
    // const url = "https://glsmoodle.in/vaat/register.php"; 

    // Simulation for now
    setTimeout(() => {
        alert("Sign-up successful! (Offline/Mock)");
        window.location.href = "menu.html";
    }, 500);

    /* 
    try {
        const response = await fetch(url, { ... });
        // ... (commented out real logic)
    } catch (error) { ... } 
    */
}

function showError(msg) {
    const el = document.getElementById("error-message");
    if (el) {
        el.innerText = msg;
        el.style.display = "block";
    } else {
        alert(msg);
    }
}

// Bind
document.getElementById('btn-signup').addEventListener('click', handleSignup);
