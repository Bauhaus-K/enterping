# Enterping

Enterping is a Next.js typing game and learning platform focused on Japanese music and subculture content.

## Local development

Install dependencies:

```powershell
npm.cmd install
```

Start the dev server:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000/demo
```

The `/demo` page can render with bundled fallback data even if a local database is not running.

## Prisma

Generate the client:

```powershell
npx.cmd prisma generate
```

Create the first migration locally before production deployment:

```powershell
npx.cmd prisma migrate dev --name init
```

Apply migrations in production:

```powershell
npx.cmd prisma migrate deploy
```

Seed local demo data:

```powershell
npm.cmd run db:seed
```

## Vercel deployment

This project is intended to be deployed to Vercel as a standard Next.js application, not through the included Dockerfile.

### 1. Prepare the database

Use an external PostgreSQL database such as Neon, Supabase, Railway Postgres, or Render Postgres, then copy the production connection string into `DATABASE_URL`.

### 2. Create migrations locally

If `prisma/migrations` does not exist yet, generate the initial migration locally before deploying:

```powershell
npx.cmd prisma migrate dev --name init
```

Commit the generated `prisma/migrations` folder.

### 3. Add Vercel environment variables

Set these in Vercel Project Settings > Environment Variables:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `ADMIN_USERNAMES`
- `ADMIN_EMAILS`
- `CRON_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_API_VERSION`

Only the AI provider variables you actually use are required.

For the current local admin account, set:

```text
ADMIN_USERNAMES=mailron
```

### 4. Import the repository into Vercel

Vercel should auto-detect this project as Next.js.

- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`

### 5. Run production migrations

After the production database is ready, apply migrations with:

```powershell
$env:DATABASE_URL="your-production-database-url"
npx.cmd prisma migrate deploy
```

### 6. Cron job

`vercel.json` configures a daily Vercel Cron job for:

```text
/api/cron/rewards
```

Schedule:

```text
5 15 * * *
```

That runs at `15:05 UTC`, which is `00:05` in Korea Standard Time on the following calendar day.

### 7. Notes

- Vercel Cron invokes the route with `GET`, so the rewards route supports both `GET` and `POST`.
- The included Docker files are useful for local containers or non-Vercel hosting, but Vercel deployment should use the native Next.js workflow.
