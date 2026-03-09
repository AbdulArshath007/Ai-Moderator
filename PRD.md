# Product Requirements Document (PRD)

**Project Name:** AI-Powered Real-Time Chat Moderation System (GLITCHCON 2.0)  
**Target Platform:** Web (Desktop & Mobile Responsive)  
**Target Audience:** AI Coding Agent (Execution Blueprint)  

## 1. Product Overview
A real-time chat application for learning communities featuring an in-stream AI moderator. The system prevents toxic, off-topic, or spam messages from being published to the community by evaluating them against dynamic generic and topic-specific boundaries in real-time. Blocked messages return a private, educational explanation to the sender.

## 2. Technology Stack
- **Frontend:** HTML5, Tailwind CSS (via CDN/CLI), GSAP (for animations). No Lenis or Anime.js.
- **Backend:** Node.js, Express.js.
- **Real-Time Communication:** Socket.io (WebSockets).
- **Database:** NeonDB (Serverless PostgreSQL) accessible via Neon MCP.
- **AI Engine:** Groq API (Llama 3 8B/70B) or Google Gemini API (configured for JSON mode and low latency).

## 3. Database Schema (NeonDB PostgreSQL)
*AI Agent Instruction: Use the Neon MCP `run_sql` tool to execute the following schema setup.*

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'learner' -- 'learner' or 'admin'
);

-- Learning Groups Table
CREATE TABLE learning_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Moderation Boundaries (Rules) Table
CREATE TABLE boundaries (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'generic' or 'topic'
    group_id INTEGER REFERENCES learning_groups(id) ON DELETE CASCADE NULL, -- NULL if generic
    rule_description TEXT NOT NULL
);

-- Messages Table (Only stores approved messages)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    group_id INTEGER REFERENCES learning_groups(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Core Features & Architecture

### 4.1 Chat Server (Node.js + Socket.io)
**WebSocket Events:**
- `connection`: Authenticate user and join group room.
- `sendMessage` (Client -> Server): Payload `{ userId, groupId, content }`.
  - Action: Server intercepts, fetches boundaries from DB, sends to AI Engine.
- `newMessage` (Server -> Clients): Broadcast approved message to the group room.
- `messageBlocked` (Server -> Client): Send private rejection reason to the original sender. Payload `{ reason }`.

### 4.2 AI Moderation Engine
*AI Agent Instruction: Implement a service module that calls the LLM API using the following system prompt architecture.*

**System Prompt Template:**
```text
You are a strict but educational Chat Moderator AI for a learning community.
Evaluate the user's message against the following boundaries.

GENERIC BOUNDARIES (Must not contain):
[Insert generic boundaries from DB]

TOPIC BOUNDARIES (Must be strictly relevant to):
[Insert topic boundaries for the specific group from DB]

Respond ONLY in strict JSON format:
{
  "status": "pass" | "fail",
  "reason": "If fail, provide a brief, polite 1-sentence explanation of what rule was broken. If pass, leave empty."
}
```

### 4.3 Learner UI (Frontend)
- **Layout:** Standard chat interface (sidebar for groups, main window for chat, input at bottom).
- **Styling:** Tailwind CSS. Use clean, modern aesthetics.
- **Interactions:**
  - Vanilla JS to handle Socket.io events.
  - Standard `overflow-y-auto` for chat scrolling (auto-scroll to bottom on new message).
- **GSAP Animation 1:** Smooth pop-in animation for new chat bubbles.
- **GSAP Animation 2:** Fade-in/slide-up warning modal or inline red text when `messageBlocked` is received.

### 4.4 Admin UI (Frontend)
- **Layout:** Dashboard grid.
- **Features:**
  - List all `learning_groups`.
  - CRUD interfaces to add/edit/delete generic boundaries.
  - CRUD interfaces to add/edit/delete topic boundaries tied to specific groups.
- **API:** REST endpoints (e.g., `POST /api/boundaries`) to update the NeonDB.

## 5. Implementation Sequence for AI Agent

### Phase 1: Database Initialization
- Connect to NeonDB using the configured MCP.
- Execute the schema creation SQL provided in Section 3.
- Insert mock data: 1 Admin user, 2 Learner users, 1 Group ("Full Stack Java"), and the baseline generic boundaries from the hackathon PDF.

### Phase 2: Backend scaffolding & API
- Initialize Node/Express project.
- Setup database connection pool using the `pg` package.
- Create REST API routes for Admin UI to manage boundaries (`GET/POST/DELETE /api/boundaries`).

### Phase 3: Real-Time & AI Integration
- Initialize Socket.io on the Express server.
- Create the AI Service module (Groq/Gemini API integration).
- Implement the `sendMessage` socket listener:
  - Query DB for active rules.
  - Await AI response.
  - Emit `newMessage` OR `messageBlocked` based on JSON status.

### Phase 4: Frontend Build (HTML/Tailwind/GSAP)
- Create `index.html` (Learner UI) and `admin.html` (Admin UI).
- Wire up the Admin UI via Fetch API to the backend routes.
- Wire up the Learner UI via Socket.io client library.
- Implement GSAP animations for chat bubbles and moderation warnings.
