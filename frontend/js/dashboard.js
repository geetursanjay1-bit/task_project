const BASE_URL = '/api';
const token = localStorage.getItem('access');

if (!token) {
    window.location.href = 'login.html';
}

function logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    window.location.href = 'login.html';
}

let allUsers = [];

async function loadUsers() {
    try {
        const response = await fetch(`${BASE_URL}/users/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allUsers = await response.json();
    } catch (e) {
        console.error(e);
    }
}

async function loadProjects() {
    try {
        const response = await fetch(`${BASE_URL}/projects/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const projects = await response.json();
        
        const container = document.getElementById('projects-list');
        container.innerHTML = '';
        
        if (projects.length === 0) {
            container.innerHTML = '<div class="col-12 text-secondary">No projects found. Create one!</div>';
            return;
        }

        let userOptions = '<option value="" disabled selected>Select User</option>';
        allUsers.forEach(u => {
            userOptions += `<option value="${u.id}">${u.username} (ID: ${u.id})</option>`;
        });

        projects.forEach(p => {
            const isAdmin = p.created_by.username === parseJwt(token).username || true; // Simplification, backend enforces
            
            container.innerHTML += `
                <div class="col-md-4">
                    <div class="card-box h-100 d-flex flex-column">
                        <h5 class="fw-bold text-gradient">${p.name}</h5>
                        <p class="text-secondary small mb-3 flex-grow-1">${p.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="badge bg-secondary">Created by ${p.created_by.username}</span>
                        </div>
                        <div class="mt-3 border-top border-secondary pt-3">
                            <h6 class="small fw-bold">Team Management</h6>
                            <div class="d-flex gap-2 mt-2">
                                <select id="add-member-${p.id}" class="form-select form-select-sm">
                                    ${userOptions}
                                </select>
                                <select id="role-${p.id}" class="form-select form-select-sm" style="width: 100px;">
                                    <option value="MEMBER">Member</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                                <button class="btn btn-outline-primary btn-sm" onclick="addTeamMember(${p.id})">Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

async function addTeamMember(projectId) {
    const userId = document.getElementById(`add-member-${projectId}`).value;
    const role = document.getElementById(`role-${projectId}`).value;

    if (!userId) {
        alert("Please select a user");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/team-members/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                project_id: projectId,
                user_id: parseInt(userId),
                role: role
            })
        });

        if (response.ok) {
            alert('Member added successfully!');
        } else {
            const data = await response.json();
            alert('Failed to add member: ' + JSON.stringify(data));
        }
    } catch (e) {
        console.error(e);
    }
}



let allTasks = [];

async function loadTasks() {
    try {
        const response = await fetch(`${BASE_URL}/tasks/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allTasks = await response.json();
        updateDashboardStats();
        renderTasks('ALL');
    } catch (e) {
        console.error(e);
    }
}

function updateDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const payload = parseJwt(token);
    const userId = payload.user_id;

    let total = allTasks.length;
    let todo = allTasks.filter(t => t.status === 'TODO').length;
    let inprogress = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
    let done = allTasks.filter(t => t.status === 'DONE').length;
    let overdue = allTasks.filter(t => t.due_date < today && t.status !== 'DONE').length;
    let myTasks = allTasks.filter(t => t.assigned_to && t.assigned_to.id === userId).length;

    document.getElementById('stat-total-tasks').innerText = total;
    document.getElementById('stat-todo-tasks').innerText = todo;
    document.getElementById('stat-inprogress-tasks').innerText = inprogress;
    document.getElementById('stat-done-tasks').innerText = done;
    document.getElementById('stat-overdue-tasks').innerText = overdue;
    document.getElementById('stat-user-tasks').innerText = myTasks;

    const statsBlock = document.getElementById('dashboard-stats');
    if (statsBlock) statsBlock.style.display = 'flex';
}

function filterTasks(status) {
    renderTasks(status);
}

function getStatusBadge(status) {
    if (status === 'TODO') return '<span class="badge bg-warning text-dark">To Do</span>';
    if (status === 'IN_PROGRESS') return '<span class="badge bg-info text-dark">In Progress</span>';
    if (status === 'DONE') return '<span class="badge bg-success">Done</span>';
    return `<span class="badge bg-secondary">${status}</span>`;
}

function getPriorityBadge(priority) {
    if (priority === 'HIGH') return '<span class="badge bg-danger">High</span>';
    if (priority === 'MEDIUM') return '<span class="badge bg-primary">Medium</span>';
    if (priority === 'LOW') return '<span class="badge bg-secondary">Low</span>';
    return '';
}

function renderTasks(filterStatus) {
    const container = document.getElementById('tasks-list');
    container.innerHTML = '';

    const tasksToRender = filterStatus === 'ALL' ? allTasks : allTasks.filter(t => t.status === filterStatus);

    if (tasksToRender.length === 0) {
        container.innerHTML = '<div class="col-12 text-secondary">No tasks found.</div>';
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    tasksToRender.forEach(t => {
        const isOverdue = t.due_date < today && t.status !== 'DONE';
        const overdueBadge = isOverdue ? '<span class="badge bg-danger ms-2">Overdue</span>' : '';

        container.innerHTML += `
            <div class="col-md-6">
                <div class="card-box ${isOverdue ? 'border-danger' : ''}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="fw-bold mb-0">${t.title}</h5>
                        <div>
                            ${getPriorityBadge(t.priority)}
                            ${getStatusBadge(t.status)}
                            ${overdueBadge}
                        </div>
                    </div>
                    <p class="text-secondary small mb-3">${t.description}</p>
                    <div class="d-flex justify-content-between text-secondary small">
                        <span>Project: ${t.project.name}</span>
                        <span>Due: ${t.due_date}</span>
                    </div>
                    <div class="mt-3 text-secondary small">
                        Assigned to: ${t.assigned_to ? t.assigned_to.username : 'Unassigned'}
                    </div>
                    <div class="mt-3 d-flex gap-2">
                        <select class="form-select form-select-sm w-auto d-inline-block bg-dark text-white border-secondary" onchange="updateTaskStatus(${t.id}, this.value)">
                            <option value="TODO" ${t.status === 'TODO' ? 'selected' : ''}>To Do</option>
                            <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                            <option value="DONE" ${t.status === 'DONE' ? 'selected' : ''}>Done</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    });
}

async function updateTaskStatus(id, newStatus) {
    try {
        const response = await fetch(`${BASE_URL}/tasks/${id}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
            loadTasks();
        } else {
            alert('Error updating task');
        }
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    loadProjects();
    loadTasks();
});