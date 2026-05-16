const BASE_URL = '/api';
const token = localStorage.getItem('access');

if (!token) {
    window.location.href = 'login.html';
}

function parseJwt(tok) {
    const base64Url = tok.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        window.atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
    );
    return JSON.parse(jsonPayload);
}

async function loadFormData() {
    try {
        const pReq = await fetch(`${BASE_URL}/projects/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const uReq = await fetch(`${BASE_URL}/users/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const projects = await pReq.json();
        const users = await uReq.json();

        const adminProjects = projects.filter(p => p.current_user_role === 'ADMIN');

        if (adminProjects.length === 0) {
            alert('You must be a project admin to create tasks.');
            window.location.href = 'dashboard.html';
            return;
        }

        const pSelect = document.getElementById('project_id');
        pSelect.innerHTML = '<option value="" disabled selected>Select Project</option>';
        adminProjects.forEach(p => {
            pSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });

        const uSelect = document.getElementById('assigned_to');
        uSelect.innerHTML = '<option value="">Unassigned</option>';
        users.forEach(u => {
            const label = u.name || u.username;
            uSelect.innerHTML += `<option value="${u.id}">${label}</option>`;
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

    if (!title || !project_id || !due_date) {
        alert('Please fill in title, project, and due date.');
        return;
    }

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
            project_id: parseInt(project_id),
            assigned_to_id: assigned_to_id ? parseInt(assigned_to_id) : null
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Task creation failed');
        return response.json();
    })
    .then(() => {
        window.location.href = 'dashboard.html';
    })
    .catch(() => {
        alert('Error creating task. Make sure you are an admin of the selected project.');
    });
}
