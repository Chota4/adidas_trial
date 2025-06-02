document.addEventListener('DOMContentLoaded', () => {
    // Login/Register form validation
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            let isValid = true;
            
            // Validate email
            const email = form.querySelector('input[type="email"]');
            if (email && !email.value.includes('@')) {
                isValid = false;
                alert('Please enter a valid email address');
            }
            
            // Validate password length
            const password = form.querySelector('input[type="password"]');
            if (password && password.value.length < 6) {
                isValid = false;
                alert('Password must be at least 6 characters');
            }
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    });

    // 2FA code input formatting
    const codeInput = document.getElementById('2fa-code');
    if (codeInput) {
        codeInput.addEventListener('input', (e) => {
            // Remove any non-digit characters
            e.target.value = e.target.value.replace(/\D/g, '');
            
            // Limit to 6 characters
            if (e.target.value.length > 6) {
                e.target.value = e.target.value.slice(0, 6);
            }
        });
    }
});