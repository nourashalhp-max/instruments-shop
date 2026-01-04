// public/js/login.js

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const jsErrorAlert = document.getElementById('jsErrorAlert'); // Assuming this is an element to display JS errors
    const serverMessageAlert = document.getElementById('serverMessageAlert'); // Add this for server messages

    // Function to display messages (used for both server and potential client-side messages)
    function displayMessage(element, message, type = 'danger') {
        if (element) {
            element.classList.remove('d-none', 'alert-success', 'alert-danger');
            element.classList.add(`alert-${type}`);
            element.innerHTML = message;
        }
    }

    // --- Handle server messages from URL query parameters ---
    const urlParams = new URLSearchParams(window.location.search);
    const successMessage = urlParams.get('success');
    const errorMessage = urlParams.get('error');

    if (successMessage) {
        displayMessage(serverMessageAlert, decodeURIComponent(successMessage), 'success');
        // Clear the query parameter after displaying to prevent it from reappearing on refresh
        history.replaceState(null, '', window.location.pathname);
    } else if (errorMessage) {
        displayMessage(serverMessageAlert, decodeURIComponent(errorMessage), 'danger');
        // Clear the query parameter after displaying
        history.replaceState(null, '', window.location.pathname);
    }

    // --- REMOVED AJAX FORM SUBMISSION LOGIC ---
    // Since the server now performs a direct redirect, we want the browser
    // to handle the form submission naturally.

    if (loginForm) {
        console.log("LOGIN.JS: Login form found. Letting browser handle submission.");
        // We are intentionally NOT adding an event listener with event.preventDefault() here.
        // The form will submit naturally to its 'action' URL, and the server's redirect
        // will be followed by the browser.

        // You might still want client-side validation *before* submission,
        // but that would be a separate validation logic, not an AJAX submit handler.
        // For now, we're removing all AJAX logic to make the form work via direct POST.

    } else {
        console.warn("LOGIN.JS: Login form element (loginForm) not found.");
    }
});

// Optional: You might want a simple <div id="serverMessageAlert"></div> in your login.ejs
// to display messages passed via query parameters (success or error).
// Example in login.ejs:
/*
<div id="serverMessageAlert" class="alert d-none mt-3" role="alert">
    </div>
*/