This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase setup

Set these public client variables in `.env.local` for local development and in
the Vercel project settings for each deployed environment:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Use the Supabase project's publishable key (or its legacy anon key value in
this variable). Never put a service-role key in a `NEXT_PUBLIC_` variable.

In the Supabase Dashboard, open **SQL Editor** and run the complete SQL files
from this repository in order:

1. `sql/schema.sql` — profiles, signup trigger, profile row security.
2. `sql/progression.sql` — idempotent per-user game rewards.
3. `sql/progression-platform.sql` — game history, completion RPC, profile
   progression, achievements, streaks, and leaderboard.

The completion RPC depends on both preceding scripts. Re-run all three in
order if setting up a new project; the schema and reward policies are safe to
recreate.

Under **Authentication → URL Configuration**, set the production Site URL and
add the deployed `/auth/callback` URL to the allowed Redirect URLs. Add local
and preview callback URLs there too if those environments use email
confirmation.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
