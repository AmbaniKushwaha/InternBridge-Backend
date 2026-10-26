# InternBridge REST API Backend

Production-ready backend for **InternBridge** built with Node.js, Express, MongoDB, and Mongoose.

---

## 🚀 Quick Start

### 1. Requirements
- **Node.js** v18+ (tested on Node v24)
- **MongoDB** local instance (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string.

### 2. Environment Variables
Verify or edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/internbridge
JWT_SECRET=internbridge_jwt_secret_dev_key_super_secure_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 3. Seed the Database (Optional & Recommended)
Populate sample students, businesses, projects, and squads:
```bash
npm run seed
```
> **Default Test Credentials** (Password for all: `password123`):
> - **Student 1**: `rohan.verma@college.edu`
> - **Student 2**: `ananya.sharma@college.edu`
> - **Business**: `contact@techretail.in`
> - **Admin**: `admin@internbridge.in`

### 4. Run the Server
```bash
# Development with hot-reload
npm run dev

# Production
npm start
```

---

## 📡 API Endpoints Overview

### Health
- `GET /api/health` - Server status, timestamp, and environment

### Auth (`/api/auth`)
- `POST /api/auth/register` - Create student or business account
- `POST /api/auth/login` - Authenticate & receive JWT
- `GET /api/auth/me` - Current session user & profile (Bearer token required)

### Projects (`/api/projects`)
- `GET /api/projects` - Filterable project directory (`?category=...&minBudget=...&maxBudget=...&search=...`)
- `GET /api/projects/:id` - Full brief specification with business details
- `POST /api/projects` - Post project brief (Business only)
- `GET /api/projects/my/listed` - Projects posted by logged-in business
- `PATCH /api/projects/:id/status` - Update status (`Open`, `In Progress`, `Completed`)

### Applications (`/api/applications`)
- `POST /api/applications` - Submit individual or team proposal (auto-scores compatibility)
- `GET /api/applications/my` - Student application history
- `GET /api/applications/project/:projectId` - Candidate review board sorted by match score
- `PATCH /api/applications/:id/status` - Move candidate status (`Pending`, `Shortlisted`, `Selected`, `Rejected`)

### Teams (`/api/teams`)
- `GET /api/teams` - Public squad discovery
- `GET /api/teams/:id` - Squad roster and combined skills
- `POST /api/teams` - Form a squad (Student only)
- `GET /api/teams/my/squads` - Teams the current student leads or belongs to
- `POST /api/teams/:id/join-request` - Request to join a squad
- `POST /api/teams/:id/respond-request` - Leader accept/reject member request

### Students (`/api/students`)
- `GET /api/students` - Find teammates directory with skill filter
- `GET /api/students/:id` - Public student portfolio & bio
- `PUT /api/students/profile` - Update skills, availability, and education
- `POST /api/students/portfolio` - Add showcase project
- `DELETE /api/students/portfolio/:itemId` - Delete showcase project

### Notifications (`/api/notifications`)
- `GET /api/notifications` - User alerts with unread counter
- `PATCH /api/notifications/:id/read` - Mark single notification as read
- `PATCH /api/notifications/mark-all-read` - Clear all unread notifications
