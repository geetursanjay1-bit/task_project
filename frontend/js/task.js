const BASE_URL = '/api';
const token = localStorage.getItem('access');

if (!token) {
    window.location.href = 'login.html';
}

async function loadFormData() {
    try {
        const pReq = await fetch(`${BASE_URL}/projects/`, { headers: { 'Authorization': `Bearer ${token}` }});
        const uReq = await fetch(`${BASE_URL}/users/`, { headers: { 'Authorization': `Bearer ${token}` }});
        
        const projects = await pReq.json();
        const users = await uReq.json();

        const pSelect = document.getElementById('project_id');
        projects.forEach(p => {
            pSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });

        const uSelect = document.getElementById('assigned_to');
        users.forEach(u => {
            uSelect.innerHTML += `<option value="${u.id}">${u.username}</option>`;
        });
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener('DOMContentLoaded', loadFormData);

function createTask() {
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const project_id = document.getElementById('project_id').value;
    const assigned_to_id = document.getElementById('assigned_to').value;
    const due_date = document.getElementById('due_date').value;
    const priority = document.getElementById('priority').value;

    fetch(`${BASE_URL}/tasks/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            title,
            description,
            due_date,
            status: 'TODO',
            priority,
            project_id: project_id ? parseInt(project_id) : null,
            assigned_to_id: assigned_to_id ? parseInt(assigned_to_id) : null
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Task creation failed');
        return response.json();
    })
    .then(data => {
        window.location.href = 'dashboard.html';
    })
    .catch(error => {
        console.log(error);
        alert('Error creating task. Make sure you are an admin of the selected project.');
    });
}