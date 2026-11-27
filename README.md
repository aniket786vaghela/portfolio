# Portfolio + Studio (Vite · React · Tailwind · Supabase)

An Apple-style portfolio with zero-gravity spheres, a Stickman / Rolling Ball companion, the
Mind Predictor game, and a 3-panel **Studio** editor. With Supabase connected, you sign in with
email + password from any device (iPad or laptop), edit, and press **Save & Publish** to update
the live site for everyone.

## How it stores data

| Mode | When | Content | Media & faces | Studio login |
|---|---|---|---|---|
| **Cloud** | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set | `portfolio_data` row `id = 'main'` (`content` jsonb) | Uploaded to the public `portfolio-media` bucket; the JSON keeps the public URL | Supabase Auth (`signInWithPassword`) |
| **Preview** | Either variable is missing (Claude artifact, fresh clone) | `localStorage` | Small images inlined as data URLs | Local passcode `admin123` (browser-only, not real security) |

In cloud mode, Studio edits stay in your tab until you press **Save & Publish**. The top bar shows
*Unpublished changes* or *Published*, and the browser warns you before closing a tab with unpublished edits.

## Project layout

```
index.html               Vite entry page
src/main.jsx             mounts <App />
src/App.jsx              main app: data loading, auth gate, publish, toasts
src/supabase.js          Supabase client + fetch / publish / sign-in / upload helpers
src/Studio.jsx           3-panel editor (Save & Publish, Sign out, uploads)
src/Portfolio.jsx …      public site, spheres, companion, Mind Predictor
src/data.js              default content + migrations
supabase/setup.sql       table, RLS, admin list, storage bucket + policies
scripts/build-artifact.sh  single-file preview build (no Supabase)
.env.example             the two variables you need
```

## 1. Set up Supabase (about 10 minutes)

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. **SQL Editor → New query**: paste all of `supabase/setup.sql` and press **Run**.
   It creates the `portfolio_data` table, Row Level Security (public read, admin-only write),
   the public `portfolio-media` bucket, and its storage policies.
   - If the bucket insert is refused on your plan, create it in **Storage → New bucket**
     named `portfolio-media`, tick **Public bucket**, then run the file again.
3. **Authentication → Users → Add user → Create new user**: your email and a strong password,
   with **Auto Confirm User** ticked.
4. Back in **SQL Editor**, allow that login to edit (use your real email):
   ```sql
   insert into public.portfolio_admins (email) values ('you@example.com') on conflict do nothing;
   ```
5. Recommended: **Authentication → Sign In / Providers → Email**, turn off **Allow new users to sign up**.
   Writes are already limited to emails in `portfolio_admins`, so this just keeps strangers from creating accounts.
6. **Project Settings → API** (or **API Keys**): copy the **Project URL** and the **anon** (or
   **publishable**) key. Never use the `service_role` / secret key in this app.

## 2. Run locally

```bash
npm install
cp .env.example .env.local     # then paste your URL and anon key into .env.local
npm run dev                    # http://localhost:5173
```

Click the **Admin** button in the top-right of the site, sign in, edit, then **Save & Publish**.
The first publish creates the `main` row; until then visitors see the sample content.

## 3. Put it on GitHub

```bash
git init
git add .
git commit -m "Portfolio with Supabase backend"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

`.env.local` is in `.gitignore`, so your keys stay off GitHub.

## 4. Deploy on Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import** your GitHub repo.
   Vercel detects **Vite** (build `npm run build`, output `dist`).
2. **Environment Variables** (before the first deploy, or later under *Settings → Environment Variables*):
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon / publishable key
3. **Deploy**. If you add or change variables later, **Redeploy**: Vite bakes them in at build time.
4. Optional: in Supabase **Authentication → URL Configuration**, set **Site URL** to your Vercel domain
   (only needed if you later add password-reset or magic-link emails).

Every `git push` to `main` redeploys the code. Content changes don't need a deploy: Save & Publish updates
Supabase and the live site picks it up on the next page load.

## Rebuilding the Claude artifact preview

```bash
npm run build:artifact     # writes dist-artifact/index.html (preview mode, no Supabase)
```

## Notes

- Removing a media item in Studio removes it from the site JSON; the file stays in the bucket
  (delete it in **Storage** if you want the space back).
- Large videos upload straight to Storage (50 MB limit set in `setup.sql`; raise it there if needed).
- If Save & Publish says *row-level security* / *permission*, your login email is not in `portfolio_admins` (step 1.4).
