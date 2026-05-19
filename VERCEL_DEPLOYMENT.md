# Enterping Vercel Deployment

This project deploys best as:

```text
Vercel Next.js app + managed PostgreSQL database
```

Recommended database providers:

- Neon
- Supabase
- Railway PostgreSQL
- Render PostgreSQL

## 1. Create a Production PostgreSQL Database

Create a PostgreSQL database and copy the pooled or direct connection string.

Use SSL if the provider requires it:

```text
postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

## 2. Add Vercel Environment Variables

In Vercel:

```text
Project Settings > Environment Variables
```

Add:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
AUTH_SECRET=<long-random-secret>
ADMIN_USERNAMES=mailron
ADMIN_EMAILS=
CRON_SECRET=<long-random-secret>
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_API_VERSION=2024-10-21
```

Only one AI provider is needed. If OpenAI is not used yet, `OPENAI_API_KEY` can stay empty.

Generate a secret locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## 3. Apply Prisma Migrations to Production DB

Run this from the project folder after replacing the URL:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
npx.cmd prisma migrate deploy
```

Optional production seed:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
npm.cmd run db:seed
```

## 4. Import into Vercel

Connect the GitHub repository to Vercel.

Use:

```text
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run build
Output Directory: default
```

## 5. Verify After Deploy

Open these pages:

```text
/
/typing
/play?contentId=jpop-lemon
/quiz
/notices
/login
/signup
```

Login with the account created through signup. The username `mailron` will be treated as admin when `ADMIN_USERNAMES=mailron` is set.

## 6. Vercel Cron

`vercel.json` already enables the reward cron:

```text
/api/cron/rewards
```

Schedule:

```text
5 15 * * *
```

This is `00:05` KST.
