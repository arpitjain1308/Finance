# 💰 FinanceAI — AI-Powered Personal Finance Dashboard

A full-stack web application with React, Node.js, MongoDB, and Python ML service for intelligent personal finance management.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Python 3.9+
- MongoDB Atlas account (free)

---

## 📦 Setup Instructions

### Step 1 — Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install ML service dependencies
cd ../ml-service
pip install -r requirements.txt
```

---

### Step 2 — Configure Environment

Copy the example env file:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in:
```env
MONGO_URI=mongodb+srv://user:pass@cluster0.xxx.mongodb.net/finance_dashboard
JWT_SECRET=make_this_very_long_random_string
JWT_REFRESH_SECRET=another_very_long_random_string
CLIENT_URL=http://localhost:3000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

**Getting MongoDB URI:**
1. Go to https://mongodb.com/atlas → Create free account
2. Create M0 free cluster
3. Database Access → Add User
4. Network Access → Allow from anywhere
5. Connect → Compass → Copy URI

**Getting Gmail App Password:**
1. Google Account → Security → 2-Step Verification (enable)
2. App passwords → Generate password for "Mail"

---

### Step 3 — Run All Services

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 — ML Service:**
```bash
cd ml-service
uvicorn main:app --reload --port 8000
# Running on http://localhost:8000
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm start
# Running on http://localhost:3000
```

---

## 🌐 Access the App

Open **http://localhost:3000** in your browser.

Register a new account and start adding transactions!

---

## ✨ Features

- **Authentication** — Register, login, JWT tokens, password reset via email
- **Transactions** — Add, edit, delete, CSV import, search & filter
- **Dashboard** — Income vs expenses charts, spending breakdown, recent activity
- **Budget** — Set monthly limits per category with progress tracking
- **Goals** — Savings goals with progress tracking
- **Analytics** — AI forecasting, anomaly detection, spending insights
- **Settings** — Profile management, currency selection

---

## 📁 Project Structure

```
finance-dashboard/
├── backend/              # Node.js + Express API
│   ├── config/           # Database connection
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth & error handling
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   └── server.js
├── frontend/             # React app
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── context/      # Auth context
│       ├── pages/        # All pages
│       └── services/     # API service
├── ml-service/           # Python FastAPI ML service
│   ├── routers/          # ML endpoints
│   └── main.py
└── docker-compose.yml
```

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get current user
- `POST /api/auth/forgot-password` — Request reset
- `PUT /api/auth/reset-password/:token` — Reset password

### Transactions
- `GET /api/transactions` — Get all (with filters & pagination)
- `POST /api/transactions` — Add transaction
- `PUT /api/transactions/:id` — Update
- `DELETE /api/transactions/:id` — Delete
- `POST /api/transactions/upload-csv` — Import CSV
- `GET /api/transactions/stats` — Dashboard stats

### Budget
- `GET /api/budgets` — Get budgets
- `POST /api/budgets` — Create/update budget
- `DELETE /api/budgets/:id` — Delete budget

### Goals
- `GET /api/goals` — Get goals
- `POST /api/goals` — Create goal
- `PUT /api/goals/:id` — Update goal
- `DELETE /api/goals/:id` — Delete goal

### ML Service
- `GET /api/ml/forecast` — Expense forecasting
- `GET /api/ml/anomalies` — Anomaly detection
- `GET /api/ml/insights` — AI insights
- `POST /api/ml/categorize` — Categorize descriptions

---

## 🚀 Deployment

### Frontend → Vercel
1. Push to GitHub
2. Connect to Vercel
3. Set env: `REACT_APP_API_URL=https://your-backend.render.com/api`

### Backend → Render
1. New Web Service → Connect GitHub
2. Build: `npm install`, Start: `node server.js`
3. Add all environment variables

### ML Service → Render
1. New Web Service → Python runtime
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn main:app --host 0.0.0.0 --port 8000`
