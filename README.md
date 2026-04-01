# Aloe (Chromebook Friendly Guide)

## What this repo now has
- A buildable React + TypeScript + Vite app.
- A `Messages` page wired into routing.
- Supabase messaging files from the previous step.

## Auto deploy (recommended)
1. Put this repo on GitHub.
2. Connect it once to Vercel.
3. Every new commit to `main` auto deploys.

## Manual deploy (if you want to click each time)
1. Open Vercel project.
2. Go to **Deployments**.
3. Click **Redeploy** on latest commit.

## Vercel settings
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

## Environment variables
Use these names exactly:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Deploy check
- Commit marker: April 1, 2026 (UTC).
