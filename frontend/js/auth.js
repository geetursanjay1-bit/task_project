const BASE_URL = '/api';


function signup() {

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch(`${BASE_URL}/register/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            email,
            password
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Signup Successful');
        window.location.href = 'login.html';
    })
    .catch(error => {
        console.log(error);
        alert('Error during signup');
    })
}


function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch(`${BASE_URL}/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            password
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Login failed');
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        window.location.href = 'dashboard.html';
    })
    .catch(error => {
        console.log(error);
        alert('Invalid credentials');
    });
}