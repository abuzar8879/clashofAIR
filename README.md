# clashofAIR — Modern Indian Competitive Exam Platform

A high-performance, full-stack mock exam platform designed for **JEE-MAINS, JEE-ADV, NEET, and MHT-CET**. Built for massive scale on Cloudflare's edge network.

## 🌟 Key Features

- **Subject-Wise Navigation**: Questions are automatically grouped by subject (Physics, Chemistry, Maths, Biology) with dedicated navigation tabs.
- **Dynamic Marking**: Subject-specific positive and negative marking support.
- **Anti-Cheat Monitoring**: 
  - Mandatory fullscreen mode to start exams.
  - Real-time visibility tracking (logs violations if user leaves the tab).
  - Browser security aware (requires user gesture to enter exam).
- **Automated Leaderboard**: 
  - **Sequential Ranking**: 1, 2, 3... ranking with submission-time tie-breaking.
  - **Reveal Logic**: Leaderboard is locked during the exam and automatically revealed once time expires.
- **Admin Power**: Bulk question import (CSV), result exports, and comprehensive dashboard.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Hono (Node.js on Cloudflare Workers) |
| Database | Cloudflare D1 (Serverless SQL) |
| Auth | JWT + bcrypt + PBKDF2 |
| Hosting | Cloudflare Pages + Workers |

## 📁 Project Structure

```
project/
├── frontend/          React + Vite application
├── backend/           Hono API on Cloudflare Workers
└── database/          Unified schema.sql and seed.sql
```

## 🚀 Quick Setup

### 1. Prerequisites

```bash
npm install -g wrangler
wrangler login
```

### 2. Configure Database (D1)

Create your D1 database:
```bash
npx wrangler d1 create exam-platform-db
```
Update `backend/wrangler.toml` with the generated `database_id`.

Initialize the schema and seed data:
```bash
# Seed the local development database
npx wrangler d1 execute exam-platform-db --local --file=database/schema.sql
npx wrangler d1 execute exam-platform-db --local --file=database/seed.sql

# Seed the production database
npx wrangler d1 execute exam-platform-db --remote --file=database/schema.sql
npx wrangler d1 execute exam-platform-db --remote --file=database/seed.sql
```

### 3. Backend Setup

```bash
cd backend
npm install
wrangler dev    # Start local development server
```

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8787
npm run dev
```

## 🔑 Default Credentials (Seed Data)

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `Admin@123` |
| **Student** | `rahul_jee` | `Student@123` |

## 📡 API Reference

- **Auth**: `/api/login`, `/api/register`, `/api/me`
- **Events**: `/api/events` (public visible events), `/api/events/:id`
- **Exam**: `/api/register-event`, `/api/submit-exam`, `/api/violations`
- **Results**: `/api/leaderboard/:eventId` (locked until end), `/api/result/:eventId`
- **Admin**: Full suite of management APIs for users, events, and questions.

### API Smoke Check

With backend dev server running (`wrangler dev`), run:

```bash
cd backend
npm run smoke:api
```

## 📊 CSV Import Format

For bulk import, use headers: `question_text, option_a, option_b, option_c, option_d, correct_answer, subject, explanation`

## 📄 License

MIT License — Free for educational and commercial preparation platforms.
