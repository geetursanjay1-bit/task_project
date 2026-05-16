const BASE_URL = '/api';
const token = localStorage.getItem('access');

if (!token) {
    window.location.href = 'login.html';
}

let allUsers = [];
let allTasks = [];
let allProjects = [];
let currentUserId = null;
let isAdminOnAnyProject = false;

function logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
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

function displayName(user) {
    return user.name || user.username;
}

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

function renderTeamMembers(project) {
    if (!project.team_members || project.team_members.length === 0) {
        return '<p class="text-secondary small mb-0">No members yet.</p>';
    }

    const payload = parseJwt(token);
    currentUserId = payload.user_id;

    return project.team_members.map(m => {
        const label = displayName(m.user);
        const roleBadge = m.role === 'ADMIN'
            ? '<span class="badge bg-primary ms-1">Admin</span>'
            : '<span class="badge bg-secondary ms-1">Member</span>';
        const removeBtn = project.current_user_role === 'ADMIN' && m.user.id !== currentUserId
            ? `<button class="btn btn-outline-danger btn-sm py-0 px-2 ms-auto" onclick="removeTeamMember(${m.id}, '${label.replace(/'/g, "\\'")}')">Remove</button>`
            : '';
        return `
            <div class="d-flex align-items-center gap-2 small mb-1">
                <span>${label}${roleBadge}</span>
                ${removeBtn}
            </div>
        `;
    }).join('');
}

async function loadProjects() {
    try {
        const response = await fetch(`${BASE_URL}/projects/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allProjects = await response.json();
        isAdminOnAnyProject = allProjects.some(p => p.current_user_role === 'ADMIN');

        const navNewTask = document.getElementById('nav-new-task');
        if (navNewTask) {
            navNewTask.style.display = isAdminOnAnyProject ? 'inline-block' : 'none';
        }

        const container = document.getElementById('projects-list');
        container.innerHTML = '';

        if (allProjects.length === 0) {
            container.innerHTML = '<div class="col-12 text-secondary">No projects found. Create one!</div>';
            return;
        }

        let userOptions = '<option value="" disabled selected>Select User</option>';
        allUsers.forEach(u => {
            const label = displayName(u);
            userOptions += `<option value="${u.id}">${label}</option>`;
        });

        allProjects.forEach(p => {
            const isAdmin = p.current_user_role === 'ADMIN';
            const teamManagement = isAdmin ? `
                <div class="mt-3 border-top border-secondary pt-3">
                    <h6 class="small fw-bold">Team Members</h6>
                    <div class="mb-3">${renderTeamMembers(p)}</div>
                    <h6 class="small fw-bold">Add Member</h6>
                    <div class="d-flex gap-2 mt-2 flex-wrap">
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
            ` : `
                <div class="mt-3 border-top border-secondary pt-3">
                    <h6 class="small fw-bold">Team Members</h6>
                    <div class="mb-0">${renderTeamMembers(p)}</div>
                </div>
            `;

            const roleBadge = p.current_user_role === 'ADMIN'
                ? '<span class="badge bg-primary">Your role: Admin</span>'
                : '<span class="badge bg-secondary">Your role: Member</span>';

            container.innerHTML += `
                <div class="col-md-4">
                    <div class="card-box h-100 d-flex flex-column">
                        <h5 class="fw-bold text-gradient">${p.name}</h5>
                        <p class="text-secondary small mb-3 flex-grow-1">${p.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                            <span class="badge bg-secondary">Created by ${displayName(p.created_by)}</span>
                            ${roleBadge}
                        </div>
                        ${teamManagement}
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

async function addTeamMember(projectId) {
    const userId = document.getElementById(`add-member-${projectId}`).value;
    const role = document.getElementById(`role-${projectId}`).value;

    if (!userId) {
        alert('Please select a user');
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
            loadProjects();
        } else {
            const data = await response.json();
            alert('Failed to add member: ' + JSON.stringify(data));
        }
    } catch (e) {
        console.error(e);
    }
}

async function removeTeamMember(memberId, memberName) {
    if (!confirm(`Remove ${memberName} from this project?`)) return;

    try {
        const response = await fetch(`${BASE_URL}/team-members/${memberId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Member removed successfully!');
            loadProjects();
        } else {
            const data = await response.json();
            alert('Failed to remove member: ' + (data.detail || JSON.stringify(data)));
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadTasks() {
    try {
        const response = await fetch(`${BASE_URL}/tasks/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allTasks = await response.json();
        currentUserId = parseJwt(token).user_id;
        updateDashboardStats();
        renderTasks('ALL');
    } catch (e) {
        console.error(e);
    }
}

function updateDashboardStats() {
    const today = new Date().toISOString().split('T')[0];

    const total = allTasks.length;
    const todo = allTasks.filter(t => t.status === 'TODO').length;
    const inprogress = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const done = allTasks.filter(t => t.status === 'DONE').length;
    const overdue = allTasks.filter(t => t.due_date < today && t.status !== 'DONE').length;

    document.getElementById('stat-total-tasks').innerText = total;
    document.getElementById('stat-todo-tasks').innerText = todo;
    document.getElementById('stat-inprogress-tasks').innerText = inprogress;
    document.getElementById('stat-done-tasks').innerText = done;
    document.getElementById('stat-overdue-tasks').innerText = overdue;

    const statsBlock = document.getElementById('dashboard-stats');
    if (statsBlock) statsBlock.style.display = 'block';

    updateTasksPerUser();
}

function updateTasksPerUser() {
    const section = document.getElementById('tasks-per-user-section');
    const container = document.getElementById('tasks-per-user-list');
    if (!section || !container) return;

    const counts = {};
    allTasks.forEach(t => {
        const key = t.assigned_to
            ? (t.assigned_to.name || t.assigned_to.username)
            : 'Unassigned';
        counts[key] = (counts[key] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = entries.map(([name, count]) => `
        <div class="col-md-3 col-6">
            <div class="card-box text-center">
                <h4 class="fw-bold text-gradient mb-1">${count}</h4>
                <p class="text-secondary mb-0 small">${name}</p>
            </div>
        </div>
    `).join('');
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

function canUpdateTask(task) {
    const project = allProjects.find(p => p.id === task.project.id);
    if (!project) return false;
    if (project.current_user_role === 'ADMIN') return true;
    return task.assigned_to && task.assigned_to.id === currentUserId;
}

function renderTasks(filterStatus) {
    const container = document.getElementById('tasks-list');
    container.innerHTML = '';

    const tasksToRender = filterStatus === 'ALL'
        ? allTasks
        : allTasks.filter(t => t.status === filterStatus);

    if (tasksToRender.length === 0) {
        container.innerHTML = '<div class="col-12 text-secondary">No tasks found.</div>';
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    tasksToRender.forEach(t => {
        const isOverdue = t.due_date < today && t.status !== 'DONE';
        const overdueBadge = isOverdue ? '<span class="badge bg-danger ms-2">Overdue</span>' : '';
        const editable = canUpdateTask(t);

        const statusControl = editable
            ? `<select class="form-select form-select-sm w-auto d-inline-block bg-dark text-white border-secondary" onchange="updateTaskStatus(${t.id}, this.value)">
                <option value="TODO" ${t.status === 'TODO' ? 'selected' : ''}>To Do</option>
                <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                <option value="DONE" ${t.status === 'DONE' ? 'selected' : ''}>Done</option>
               </select>`
            : getStatusBadge(t.status);

        container.innerHTML += `
            <div class="col-md-6">
                <div class="card-box ${isOverdue ? 'border-danger' : ''}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="fw-bold mb-0">${t.title}</h5>
                        <div>
                            ${getPriorityBadge(t.priority)}
                            ${!editable ? getStatusBadge(t.status) : ''}
                            ${overdueBadge}
                        </div>
                    </div>
                    <p class="text-secondary small mb-3">${t.description}</p>
                    <div class="d-flex justify-content-between text-secondary small">
                        <span>Project: ${t.project.name}</span>
                        <span>Due: ${t.due_date}</span>
                    </div>
                    <div class="mt-3 text-secondary small">
                        Assigned to: ${t.assigned_to ? displayName(t.assigned_to) : 'Unassigned'}
                    </div>
                    <div class="mt-3 d-flex gap-2 align-items-center">
                        ${statusControl}
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
            loadProjects();
        } else {
            const data = await response.json();
            alert('Error updating task: ' + (data.detail || 'Permission denied'));
        }
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    currentUserId = parseJwt(token).user_id;
    await loadUsers();
    await loadProjects();
    loadTasks();
});
