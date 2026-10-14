# ✅ Task Manager

A full-stack Task Manager application built to help users organize tasks, manage priorities, track deadlines, and stay productive with a clean and responsive interface.

## 🚀 Live Demo

- **Frontend:** https://task-manager-kappa-eight-21.vercel.app/
- **Backend API:** https://task-manager-api-9vhl.onrender.com
- **API Documentation:** https://task-manager-api-9vhl.onrender.com/docs

> Note: The backend URL and frontend deployment should be verified to ensure they are currently accessible.

## ✨ Features

- Create, update, and manage tasks
- Mark tasks as completed
- Organize tasks by priority and category
- Set due dates and times
- Manage subtasks
- Support recurring tasks
- User registration and login
- Store task data in PostgreSQL
- Responsive frontend interface

## 🛠️ Tech Stack

### Frontend
- React
- JavaScript
- Vite
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT authentication

### Database
- PostgreSQL

### Deployment
- Vercel — Frontend
- Render — Backend and PostgreSQL database

## 📁 Project Structure

```text
Task-Manager/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── index.html
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── routes_auth.py
│   ├── routes_tasks.py
│   └── requirements.txt
│
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following:

- Python 3.10 or later
- Node.js and npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/jaber10000/Task-Manager.git
cd Task-Manager
```

### 2. Configure the backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory:

```env
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_secure_secret_key
```

Replace the example values with your own configuration. Never commit secrets or database credentials to GitHub.

### 3. Run the backend

```bash
uvicorn main:app --reload
```

The API will be available at:

`http://127.0.0.1:8000`

API documentation:

`http://127.0.0.1:8000/docs`

### 4. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` directory:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Make sure the frontend uses `VITE_API_URL` when making API requests.

### 5. Run the frontend

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually:

`http://localhost:5173`

## 🌐 Deployment

### Frontend — Vercel

1. Import the GitHub repository into Vercel.
2. Set the project root directory to `frontend`.
3. Configure the production environment variable `VITE_API_URL` with your deployed backend URL.
4. Deploy the project.

### Backend — Render

1. Create a Python Web Service connected to the GitHub repository.
2. Set the root directory to `backend`.
3. Set the build command:

```bash
pip install -r requirements.txt
```

4. Set the start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

5. Configure `DATABASE_URL` and `SECRET_KEY` in Render's environment variables.
6. Deploy the service and verify the API using `/docs`.

### PostgreSQL — Render

Create a PostgreSQL database and configure the backend with its connection string. Use a compatible connection URL and database driver.

## 🔐 Security Notes

- Keep `.env` files out of Git.
- Never expose database passwords or JWT secrets.
- Use HTTPS for production API requests.
- Configure appropriate CORS origins for the deployed frontend.
- Use a strong, unique production secret key.

## 📌 Future Improvements

- Task search and filtering
- Dashboard analytics
- Notifications and reminders
- Calendar integration
- Improved accessibility and user experience

## 👨‍💻 Author

**Jaber**

GitHub: [@jaber10000](https://github.com/jaber10000)

---

If you find this project useful, consider giving the repository a ⭐ on GitHub!
