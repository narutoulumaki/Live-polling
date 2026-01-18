# Live Polling System

A real-time polling system with resilient state recovery, built for teachers and students.

## 🚀 Live Demo

- **Frontend**: [Deployed URL]
- **Backend**: [Deployed URL]

## Features

### Teacher (Admin)
- ✅ Create polls with multiple options and configurable timer
- ✅ View real-time voting results as students submit
- ✅ End polls manually or let them auto-expire
- ✅ View poll history from database
- ✅ See connected student count

### Student (User)
- ✅ Enter unique name per session/tab
- ✅ Receive questions instantly via WebSocket
- ✅ Timer synchronized with server (late joiners see correct remaining time)
- ✅ Submit vote within time limit
- ✅ View live results after voting

### Resilience Features
- ✅ **State Recovery**: Page refresh restores exact UI state from backend
- ✅ **Race Condition Prevention**: Database constraint prevents double voting
- ✅ **Server as Source of Truth**: Timer and vote counts managed server-side

## Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────┐
│    Frontend     │◀──────────────────▶│   Backend    │
│  (Next.js/React)│     Socket.io      │  (Express)   │
└─────────────────┘                    └──────────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  PostgreSQL  │
                                       │  (Prisma)    │
                                       └──────────────┘
```

### Code Architecture

**Backend (Controller-Service Pattern)**:
```
src/
├── controllers/     # HTTP request handlers
│   └── PollController.ts
├── services/        # Business logic
│   ├── PollService.ts
│   └── StudentService.ts
├── sockets/         # Socket.io handlers
│   └── PollSocketHandler.ts
└── routes/          # Express routes
```

**Frontend (Custom Hooks)**:
```
src/
├── hooks/
│   ├── useSocket.ts      # Socket connection & state
│   ├── usePollTimer.ts   # Timer synchronization
│   └── useSession.ts     # Session management
├── app/
│   ├── teacher/page.tsx  # Teacher dashboard
│   └── student/page.tsx  # Student view
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Real-time**: Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel (frontend) + Railway (backend)

## Setup Instructions

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- npm or yarn

### 1. Clone & Install

```bash
git clone <repo-url>
cd live-polling

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 2. Start PostgreSQL

```bash
# From project root
docker compose up -d
```

### 3. Configure Environment

**Backend (.env)**:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/livepolling?schema=public"
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Setup Database

```bash
cd backend
npx prisma db push
npx prisma generate
```

### 5. Run Application

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

### 6. Open Application

- Teacher: http://localhost:3000/teacher
- Student: http://localhost:3000/student

## How It Works

### Scheduling
1. Teacher creates poll with question, options, and duration
2. Server stores poll in DB with `endTime` calculated from `now + duration`
3. Socket broadcasts `poll:new` to all connected clients
4. Server-side timer auto-ends poll when time expires

### Persistence on Restart
1. When client connects/reconnects, it requests current state via `poll:getState`
2. Server queries DB for active poll and returns it
3. Client calculates remaining time from `endTime - now` (not from original duration)
4. UI resumes exactly where it left off

### Rate Limiting & Concurrency
1. Database unique constraint on `(pollId, studentId)` prevents double voting
2. Server validates vote before saving (poll active, option valid, not already voted)
3. Socket events provide optimistic updates while DB ensures consistency

## Feature Mapping

### Backend
| Feature | Implementation |
|---------|----------------|
| Poll Creation | `PollService.createPoll()` |
| State Persistence | PostgreSQL via Prisma |
| Timer Management | Server-calculated `endTime` |
| Race Condition Prevention | DB unique constraint + service validation |
| Real-time Updates | Socket.io broadcast events |

### Frontend
| Feature | Implementation |
|---------|----------------|
| Role Selection | Landing page (`/`) |
| Teacher Dashboard | `/teacher` with create form, live results |
| Student View | `/student` with name entry, voting UI |
| Timer Display | `usePollTimer` hook synced to server `endTime` |
| Connection State | `useSocket` hook with auto-reconnection |
| Session Management | `useSession` hook with sessionStorage |

## API Endpoints

### REST API
- `POST /api/polls` - Create poll
- `GET /api/polls/active` - Get active poll
- `GET /api/polls/history` - Get poll history
- `POST /api/polls/vote` - Submit vote
- `POST /api/polls/:id/end` - End poll

### Socket Events

**Client → Server**:
- `teacher:join` - Teacher connects
- `student:join` - Student connects with name
- `poll:create` - Create new poll
- `poll:vote` - Submit vote
- `poll:end` - End poll manually
- `poll:getState` - Request current state
- `poll:getHistory` - Request history

**Server → Client**:
- `poll:state` - Current poll state
- `poll:new` - New poll created
- `poll:results` - Updated results
- `poll:ended` - Poll ended
- `vote:confirmed` - Vote recorded
- `students:count` - Connected student count
- `error` - Error message

## Assumptions & Trade-offs

### Assumptions
- Single teacher per session (no teacher authentication)
- Student names don't need to be globally unique
- Session storage is sufficient for student identity per tab

### Trade-offs
- Used session storage instead of persistent auth for simplicity
- No chat feature implemented (marked as bonus)
- Teacher can't remove individual students (simplified)

### Future Improvements
- Add authentication for teachers
- Implement chat feature
- Add support for multiple concurrent polls
- Add analytics dashboard
- Implement student removal feature

## License

MIT
