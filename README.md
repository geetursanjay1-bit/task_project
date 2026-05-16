# Team Task Manager

Full-stack team task management app (Django REST API + HTML/JS frontend).

## Features

- User authentication (signup/login with JWT)
- Project & team management (Admin/Member roles)
- Task creation, assignment & status tracking
- Dashboard with statistics

## Tech Stack

- **Backend:** Django 6, Django REST Framework, SimpleJWT, PostgreSQL (production)
- **Frontend:** HTML, CSS, Bootstrap, JavaScript
- **Deploy:** [Railway](https://railway.app)

---

## Deploy to Railway (Required)

Repository: [https://github.com/geetursanjay1-bit/task_project](https://github.com/geetursanjay1-bit/task_project)

### Step 1 — Push code to GitHub

```bash
git remote set-url origin https://github.com/geetursanjay1-bit/task_project.git
git add .
git commit -m "Prepare Team Task Manager for Railway deployment"
git push -u origin main
```

### Step 2 — Create Railway project

1. Go to [railway.app](https://railway.app) and sign in.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select **geetursanjay1-bit/task_project**.
4. Railway auto-detects `railway.toml` and builds the app.

### Step 3 — Add PostgreSQL database

1. In your Railway project, click **+ New** → **Database** → **PostgreSQL**.
2. Railway automatically sets `DATABASE_URL` on your web service.

### Step 4 — Set environment variables

Open your **web service** → **Variables** and add:

| Variable | Value |
|----------|--------|
| `SECRET_KEY` | Generate a long random string (e.g. `openssl rand -hex 32`) |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `.railway.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://YOUR-APP-NAME.up.railway.app` |

`DATABASE_URL` is set automatically when you add PostgreSQL.

`RAILWAY_PUBLIC_DOMAIN` is set automatically by Railway.

### Step 5 — Generate public domain

1. Open your web service → **Settings** → **Networking**.
2. Click **Generate Domain**.
3. Your app will be live at `https://your-app.up.railway.app`

### Architecture (single service)

Django serves both:

- **Frontend:** `/`, `/login.html`, `/dashboard.html`, etc.
- **API:** `/api/register/`, `/api/login/`, `/api/projects/`, etc.

The frontend uses relative URLs (`/api/...`), so backend and frontend stay connected on the same domain.

---

## Run locally

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## Environment variables

See [.env.example](.env.example) for all supported variables.
