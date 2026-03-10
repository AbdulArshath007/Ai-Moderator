<p align="center">
  <img src="https://img.shields.io/badge/AEGIS-AI%20Chat%20Moderation-ff0ade?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVWN2wtOS01eiIvPjwvc3ZnPg==" alt="AEGIS">
  <br/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.IO">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Groq_AI-FF6600?style=flat-square&logo=lightning&logoColor=white" alt="Groq AI">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
</p>

# 🛡️ AEGIS — AI-Powered Real-Time Chat Moderation System

> **GLITCHCON 2.0 Hackathon Submission**

AEGIS is a real-time chat application for **learning communities** that features an **in-stream AI moderator**. It evaluates every message against dynamic, admin-configurable boundaries before it reaches the chatroom — blocking toxic, off-topic, and spam content instantly while providing private, educational feedback to the sender.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Live Demo](#-live-demo)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [How the AI Moderation Works](#-how-the-ai-moderation-works)
- [Role-Based Access Control](#-role-based-access-control)
- [Real-Time Communication](#-real-time-communication)
- [UI & UX Design](#-ui--ux-design)
- [Mobile Responsiveness & Accessibility](#-mobile-responsiveness--accessibility)
- [API Reference](#-api-reference)
- [Default Credentials](#-default-credentials)
- [Screenshots](#-screenshots)

---

## ✨ Key Features

| Category | Feature |
|---|---|
| **AI Moderation** | Every message is evaluated in real-time by Groq's Llama 3.1 8B model against configurable boundaries before being broadcast |
| **Dual Severity System** | `high` severity (hate speech, harassment) counts toward user flagging/banning; `low` severity (off-topic, spam) gently blocks with a friendly reminder |
| **Progressive Penalties** | 1st–3rd violation → warning; 4th violation → 30-second cooldown; continued violations → account flagging |
| **Real-Time Chat** | WebSocket-powered instant messaging via Socket.IO with persistent message history |
| **Role-Based Access** | Students access the chat interface; Teachers/Admins go to the admin dashboard |
| **Admin Dashboard** | Manage users, groups, boundaries, view violation logs, and flag/unflag users |
| **Dynamic Groups** | Admins can create multiple learning groups; students see them in the sidebar with live switching |
| **Profile System** | Optional profile picture upload to Google Drive, with auto-generated DiceBear robot avatars as fallback |
| **Admin Badges** | Teacher/Admin messages display a glowing `[ADMIN]` badge in the chat |
| **Responsive Design** | Full mobile support with a hamburger-menu sidebar drawer |
| **Accessibility** | ARIA labels, semantic roles, and keyboard-navigable tab interfaces |
| **GSAP Animations** | Cinematic circle-reveal login transition, animated chat bubbles, shake effect on blocked messages |
| **Three.js Background** | Custom dithered wave shader background using WebGL2 |

---

## 🌐 Live Demo

**Deployed on Render:** [https://ai-moderator-30rz.onrender.com](https://ai-moderator-30rz.onrender.com)

> ⚠️ The free tier may take ~30 seconds to wake up on first visit.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  index.html  │  │  admin.html  │  │  Three.js + GSAP    │ │
│  │  (Chat UI)   │  │  (Dashboard) │  │  (Visual Effects)   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────────────────────┘ │
│         │ Socket.IO        │ REST API (fetch)                 │
└─────────┼──────────────────┼─────────────────────────────────┘
          │                  │
┌─────────▼──────────────────▼─────────────────────────────────┐
│                     SERVER (Node.js + Express)               │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  server.js    │  │  auth.js     │  │  admin.js          │ │
│  │  (Socket.IO   │  │  (Login/     │  │  (Groups, Users,   │ │
│  │   + Chat API) │  │   Signup)    │  │   Boundaries)      │ │
│  └──────┬────────┘  └──────────────┘  └────────────────────┘ │
│         │                                                     │
│  ┌──────▼────────────────────────────────────────────────┐   │
│  │              aiService.js (Groq Llama 3.1 8B)          │   │
│  │  • Receives message + boundaries                       │   │
│  │  • Returns { status, reason, severity } as JSON        │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
              ┌────────────▼────────────────┐
              │   NeonDB (PostgreSQL)        │
              │   • users                    │
              │   • learning_groups          │
              │   • messages                 │
              │   • boundaries               │
              │   • violations               │
              └─────────────────────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, Tailwind CSS (CDN), Vanilla JS | UI structure, styling, and logic |
| **Animations** | GSAP 3.12 | Circle-reveal transitions, pop-in effects, shake animations |
| **3D Background** | Three.js (WebGL2) | Custom dithered wave shader for immersive visual experience |
| **Icons** | Phosphor Icons | Consistent, modern iconography |
| **Backend** | Node.js + Express.js 5 | REST API server and static file serving |
| **Real-Time** | Socket.IO 4 | WebSocket-based real-time bidirectional messaging |
| **Database** | NeonDB (Serverless PostgreSQL) | Persistent storage with connection pooling |
| **AI Engine** | Groq API (Llama 3.1 8B Instant) | Sub-second AI moderation with JSON-mode responses |
| **Auth** | bcrypt.js | Secure password hashing (10 salt rounds) |
| **File Upload** | Multer + Google Drive API | Profile picture uploads with cloud storage |
| **Deployment** | Render | Production hosting with auto-deploy from GitHub |

---

## 🗄️ Database Schema

```sql
-- Unified user table supporting both students and teachers/admins
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,         -- bcrypt hashed
    role VARCHAR(20) DEFAULT 'student',     -- 'student' | 'admin' | 'teacher'
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    profile_pic_url TEXT,
    is_flagged BOOLEAN DEFAULT false,       -- Moderation flag
    violation_count INTEGER DEFAULT 0,      -- Progressive penalty counter
    cooldown_until TIMESTAMP,               -- Temporary mute timestamp
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning groups that students can join
CREATE TABLE learning_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin-configurable moderation rules
CREATE TABLE boundaries (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,              -- 'generic' (global) or 'topic' (per-group)
    group_id INTEGER REFERENCES learning_groups(id) ON DELETE CASCADE NULL,
    rule_description TEXT NOT NULL
);

-- Only approved (AI-passed) messages are stored
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES learning_groups(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log of all violations
CREATE TABLE violations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES learning_groups(id) ON DELETE SET NULL,
    message_content TEXT NOT NULL,           -- The blocked message
    reason TEXT NOT NULL,                    -- AI's explanation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ VIOLATIONS : receives
    LEARNING_GROUPS ||--o{ MESSAGES : contains
    LEARNING_GROUPS ||--o{ BOUNDARIES : has
    LEARNING_GROUPS ||--o{ VIOLATIONS : logs
    USERS {
        int id PK
        string username UK
        string password
        string role
        string name
        boolean is_flagged
        int violation_count
    }
    LEARNING_GROUPS {
        int id PK
        string name
        string description
    }
    BOUNDARIES {
        int id PK
        string type
        int group_id FK
        string rule_description
    }
    MESSAGES {
        int id PK
        int user_id FK
        int group_id FK
        string content
        timestamp created_at
    }
    VIOLATIONS {
        int id PK
        int user_id FK
        int group_id FK
        string message_content
        string reason
    }
```

---

## 📁 Project Structure

```
AI CHAT MODERATION/
├── server.js                 # Main Express + Socket.IO server
├── db_init.js                # Database schema initialization & seeding
├── index.html                # Chat application UI (student + teacher chat view)
├── admin.html                # Admin/Teacher dashboard UI
├── package.json              # Dependencies and scripts
├── vercel.json               # Deployment configuration
├── .env                      # Environment variables (not committed)
├── .gitignore                # Git ignore rules
│
└── src/
    ├── aiService.js           # 🧠 AI Moderation Engine (Groq Llama 3.1)
    ├── googleDrive.js         # 📁 Google Drive API integration for profile pics
    └── routes/
        ├── auth.js            # 🔐 Login & Signup routes (bcrypt + Multer)
        └── admin.js           # 👑 Admin API routes (users, groups, boundaries)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ installed
- **NeonDB** (or any PostgreSQL) database provisioned
- **Groq API Key** from [console.groq.com](https://console.groq.com)
- *(Optional)* Google Cloud service account for Drive uploads

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/AbdulArshath007/Ai-Moderator.git
cd Ai-Moderator

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env   # Then fill in your credentials (see below)

# 4. Initialize the database (creates tables + seeds admin user)
node db_init.js

# 5. Start the server
npm start
# Server runs on http://localhost:3000
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
GROQ_API_KEY=gsk_your_groq_api_key_here
PORT=3000
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (NeonDB recommended) |
| `GROQ_API_KEY` | ✅ | API key for Groq's Llama model |
| `PORT` | ❌ | Server port (defaults to 3000) |

---

## 🧠 How the AI Moderation Works

### Flow Diagram

```mermaid
sequenceDiagram
    participant Student
    participant Server
    participant AI as Groq AI (Llama 3.1)
    participant Database

    Student->>Server: sendMessage (via Socket.IO)
    Server->>Database: Fetch boundaries (generic + topic)
    Server->>AI: Evaluate message against boundaries
    AI-->>Server: { status, reason, severity }

    alt status = "pass"
        Server->>Database: Store message
        Server->>Student: Broadcast newMessage to group
    else status = "fail" & severity = "high"
        Server->>Database: Record violation
        Server->>Database: Increment violation_count
        Server-->>Student: messageBlocked (private)
        Note over Server: After 4 violations → 30s cooldown
    else status = "fail" & severity = "low"
        Server-->>Student: messageBlocked (friendly redirect)
        Note over Server: No violation count increase
    end
```

### Severity Levels

| Severity | Example | Action | Counts Toward Flagging? |
|---|---|---|---|
| **High** | Hate speech, harassment, threats, slurs | Message blocked + violation recorded | ✅ Yes |
| **Low** | Off-topic conversation, minor spam | Message blocked + gentle reminder | ❌ No |

### Progressive Penalty System

| Violation Count | Consequence |
|---|---|
| 1–3 | Warning message displayed |
| 4 | 30-second chat cooldown imposed |
| 5+ | Account flagged for admin review |

---

## 👥 Role-Based Access Control

| Role | Access | Redirect |
|---|---|---|
| **Student** | Chat interface (`index.html`) | Login → Chat |
| **Teacher / Admin** | Admin dashboard (`admin.html`) | Login → Dashboard |
| **Teacher viewing chat** | Chat interface (via "Open Chat App" button) | Dashboard → Chat |

Teachers can seamlessly switch between the admin dashboard and the chat interface. Their messages are tagged with a glowing `[ADMIN]` badge.

---

## ⚡ Real-Time Communication

### Socket.IO Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `joinGroup` | Client → Server | `{ userId, groupId }` | Join a chat room |
| `sendMessage` | Client → Server | `{ userId, groupId, content, username, role }` | Send a message for AI evaluation |
| `newMessage` | Server → Room | `{ userId, username, content, profilePicUrl, createdAt, role }` | Broadcast approved message |
| `messageBlocked` | Server → Sender | `{ reason }` | Private rejection with explanation |
| `userFlagged` | Server → Sender | `{ message }` | Account restricted notification |

---

## 🎨 UI & UX Design

### Design System

- **Glassmorphism**: Semi-transparent panels with `backdrop-filter: blur()` for a premium, layered aesthetic
- **Color Palette**: Deep black base with vibrant magenta/pink accents (`#ea3e9a`, `#ff0ade`)
- **Typography**: Inter (Google Fonts) — clean, modern, highly legible
- **Three.js Background**: Custom WebGL2 dithered wave shader that responds to mouse movement

### GSAP Animations

| Animation | Trigger | Effect |
|---|---|---|
| Circle Reveal | Login success | Chat app expands from center with clip-path circle |
| Sidebar Pop-in | App load | Group icons scale up with stagger (back.out easing) |
| Channel Slide-in | App load | Channel items slide in from left |
| Message Shake | Blocked message | Input bar shakes horizontally (yoyo repeat) |
| Warning Modal | Violation | Slides up with scale + auto-dismisses after 6s |
| Canvas Blur | Chat opens | Background shader blurs to reduce distraction |

---

## 📱 Mobile Responsiveness & Accessibility

### Mobile Features

- **Hamburger Menu**: Sidebars collapse into a slide-out drawer on screens < 768px
- **Touch-Friendly**: All buttons and interactive elements are sized for touch targets
- **Responsive Typography**: Headings and cards scale down gracefully
- **Auto-Close Drawer**: Sidebar automatically closes when switching groups on mobile

### Accessibility (WCAG Compliance)

- `aria-label` on all icon-only buttons (Emoji, Attachment, Close, Logout, Menu)
- `role="navigation"` on sidebars, `role="main"` on chat area
- `role="tablist"`, `role="tab"`, `role="tabpanel"` with `aria-selected` on admin dashboard tabs
- Semantic HTML elements and proper heading hierarchy
- Keyboard-navigable interactive elements

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create account (multipart/form-data with optional profile pic) |
| `POST` | `/api/auth/login` | Login with username + password |

### Admin Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/groups` | List all learning groups |
| `POST` | `/api/groups` | Create a new group |
| `DELETE` | `/api/groups/:id` | Delete a group |
| `GET` | `/api/users` | List all users with moderation status |
| `POST` | `/api/users/:id/flag` | Flag a user |
| `POST` | `/api/users/:id/unflag` | Unflag a user |
| `GET` | `/api/boundaries` | List all boundaries |
| `POST` | `/api/boundaries` | Create a boundary |
| `DELETE` | `/api/boundaries/:id` | Delete a boundary |
| `GET` | `/api/violations` | List recent violations |
| `GET` | `/api/stats` | Dashboard statistics |

### Chat

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/chat/messages/:groupId` | Fetch message history (last 50) |

---

## 🔐 Default Credentials

After running `node db_init.js`, the following admin account is seeded:

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin/Teacher |

> Students can register through the "Create Account" page.

---

## 📸 Screenshots

### Landing Page
> Premium glassmorphism login with Three.js animated background

### Chat Interface (Student View)
> Discord-inspired layout with real-time messaging and AI moderation

### Admin Dashboard (Teacher View)
> Comprehensive dashboard with stats, user management, group management, and violation logs

### AI Moderation in Action
> Blocked message with educational warning modal

---

## 🏆 What Makes AEGIS Stand Out

1. **Real-Time AI Moderation** — Messages are evaluated by Llama 3.1 in <500ms before reaching the chat
2. **Dual-Severity System** — Distinguishes between harmful content (flaggable) and off-topic chat (gentle redirect)
3. **Progressive Penalty Escalation** — Fair, graduated consequences instead of instant bans
4. **Production-Grade UI** — Glassmorphism design with WebGL shaders, not a basic HTML form
5. **Full RBAC** — Role-based routing with seamless teacher/student experience switching
6. **Persistent History** — Messages survive page refreshes with database-backed chat history
7. **Mobile-First** — Fully responsive with accessible sidebar drawer
8. **WCAG Accessible** — Proper ARIA labels and semantic HTML throughout

---

## 📄 License

This project was built for the **GLITCHCON 2.0 Hackathon**.

---

<p align="center">
  <b>Built with ❤️ using Node.js, Socket.IO, Groq AI, and a lot of ☕</b>
</p>
