# SocialPoster Frontend

Next.js app for managing your business details and daily AI-generated
LinkedIn marketing posts (image + caption), and publishing them via the
[socialposter-backend](https://github.com/abdulkarimtaji33/socialposter-backend)
API.

## Setup

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the
   backend API URL (default `http://localhost:4200/api`).
2. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```

The app runs on port `3200` by default.

## Pages

- `/` — dashboard: connect LinkedIn, generate today's post, view/publish/delete
  generated posts
- `/business` — save your business details used to generate posts
