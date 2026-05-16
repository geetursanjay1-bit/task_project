const BASE_URL = '/api';

function parseApiError(data) {
    if (!data || typeof data !== 'object') return 'Request failed. Please try again.';
    if (typeof data.detail === 'string') return data.detail;

    const fieldErrors = [];
    for (const [field, messages] of Object.entries(data)) {
        if (field === 'detail') continue;
        const text = Array.isArray(messages) ? messages.join(' ') : String(messages);
        fieldErrors.push(text);
    }
    if (fieldErrors.length) return fieldErrors.join('\n');
    return JSON.stringify(data);
}

function signup() {
    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const confirmEl = document.getElementById('confirm_password');

    if (!nameEl || !emailEl || !passwordEl) {
        alert('Signup form failed to load. Please refresh the page (Ctrl+Shift+R).');
        return;
    }

    const name = nameEl.value.trim();
    const email = emailEl.value.trim().toLowerCase();
    const password = passwordEl.value;
    const confirmPassword = confirmEl ? confirmEl.value : password;

    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }

    fetch(`${BASE_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    })
    .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(parseApiError(data));
        return data;
    })
    .then(() => {
        return fetch(`${BASE_URL}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password })
        });
    })
    .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(parseApiError(data) || 'Account created but auto-login failed. Please log in manually.');
        return data;
    })
    .then(data => {
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        window.location.href = 'dashboard.html';
    })
    .catch(err => alert(err.message || 'Error during signup.'));
}

function login() {
    const loginEl = document.getElementById('login');
    const passwordEl = document.getElementById('password');

    if (!loginEl || !passwordEl) {
        alert('Login form failed to load. Please refresh the page (Ctrl+Shift+R).');
        return;
    }

    const loginId = loginEl.value.trim();
    const password = passwordEl.value;

    if (!loginId || !password) {
        alert('Please enter your email/username and password.');
        return;
    }

    fetch(`${BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginId, password })
    })
    .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(parseApiError(data) || 'Invalid email/username or password.');
        return data;
    })
    .then(data => {
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        window.location.href = 'dashboard.html';
    })
    .catch(err => alert(err.message || 'Login failed.'));
}
