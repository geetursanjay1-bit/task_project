const BASE_URL = '/api';
const token = localStorage.getItem('access');

if (!token) {
    window.location.href = 'login.html';
}

function createProject() {
    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDescription').value;

    fetch(`${BASE_URL}/projects/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name,
            description
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to create project');
        return response.json();
    })
    .then(data => {
        window.location.href = 'dashboard.html';
    })
    .catch(error => {
        console.log(error);
        alert('Error creating project');
    });
}