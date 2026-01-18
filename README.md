# Live Polling System

Real-time polling app for classroom interactions. Teachers create polls, students answer them live.

## Demo

- **Frontend**: https://live-polling-xi.vercel.app
- **Backend**: https://live-polling-production-8fa8.up.railway.app

## Tech Stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, Socket.io, Prisma
- Database: PostgreSQL

## Features

**Teacher**
- Create polls with custom options and time limit
- See live voting results
- View poll history
- Kick students if needed

**Student**
- Join with a name
- Answer polls within time limit
- Timer syncs with server (late joiners get correct remaining time)
- See results after voting

**Resilience**
- Page refresh doesn't lose state
- Can't vote twice (DB constraint)
- Server controls the timer

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── sockets/
│   │   └── index.ts
│   └── prisma/
│       └── schema.prisma
├── frontend/
│   └── src/
│       ├── app/
│       └── hooks/
└── README.md
```

## Running Locally

### Backend

```bash
cd backend
npm install
cp .env.example .env
# add your DATABASE_URL to .env
npx prisma db push
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://...
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Author

Built for Intervue.io SDE Intern Assignment
