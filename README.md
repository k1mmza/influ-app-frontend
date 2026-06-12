# influApp — Frontend

Next.js 15 (App Router) — runs on **port 3000**

## Getting Started

```bash
npm install
npm run dev       # dev server → http://localhost:3000
npm run build     # production build
npm run lint      # ESLint via next lint
```

Requires the backend to be running on port 3001 simultaneously.

## Environment Variables

Create a `.env.local` file in this directory:

```env
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

> For production, point `NEXT_PUBLIC_API_URL` at your deployed backend URL.