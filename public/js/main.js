// public/js/main.js

(function() {
    'use strict'; // This should be at the top of the IIFE

    // --- Client-side form validation (Bootstrap) ---
    var forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    document.addEventListener('DOMContentLoaded', function() {
        console.log("MAIN.JS: Document loaded."); // Added for debugging

        // --- NEW: Global Fetch Interception to add Authorization Header ---
        // This will ensure that ANY fetch request made by the client-side
        // includes the JWT if it exists in localStorage.
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const token = localStorage.getItem('accessToken');
            let [resource, options] = args; // 'resource' is the URL, 'options' are fetch options

            // Only add the header if a token exists AND the request is to our own domain (or an API endpoint)
            // This prevents sending your JWT to external third-party sites unintentionally.
            const url = typeof resource === 'string' ? resource : resource.url;
            const isOurDomain = url.startsWith('/') || url.startsWith(window.location.origin);

            if (token && isOurDomain) {
                options = options || {};
                options.headers = {
                    ...options.headers, // Preserve existing headers
                    'Authorization': `Bearer ${token}` // Add the JWT token
                };
                console.log("MAIN.JS: Attaching Authorization header to fetch request:", url); // Debugging
            } else if (token && !isOurDomain) {
                console.warn("MAIN.JS: Not attaching Authorization header to external fetch request:", url);
            }

            return originalFetch(resource, options);
        };

        // --- Optional: Global XMLHttpRequest (XHR) Interception ---
        // If any part of your application uses old-school XMLHttpRequest
        // This is less common in modern apps, but good for completeness.
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            this._url = url; // Store URL for later
            return originalXhrOpen.apply(this, arguments);
        };

        const originalXhrSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(...args) {
            const token = localStorage.getItem('accessToken');
            const isOurDomain = this._url.startsWith('/') || this._url.startsWith(window.location.origin);

            if (token && isOurDomain) {
                this.setRequestHeader('Authorization', `Bearer ${token}`);
                console.log("MAIN.JS: Attaching Authorization header to XHR request:", this._url); // Debugging
            } else if (token && !isOurDomain) {
                console.warn("MAIN.JS: Not attaching Authorization header to external XHR request:", this._url);
            }
            return originalXhrSend.apply(this, arguments);
        };


        // --- Logout functionality ---
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent default button action
                console.log("MAIN.JS: Logout button clicked. Removing token and redirecting."); // Debugging
                localStorage.removeItem('accessToken'); // Remove JWT from local storage
                // Redirect to the server-side logout route, which will then redirect to login with a message
                window.location.href = '/logout';
            });
        }
    }); // Close DOMContentLoaded listener

})(); // Close the IIFE properly