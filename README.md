# Gym Planner — diet & workout plans for one gym

A small web app for **one gym (~50 members, 1–3 staff)**. Staff add members, make
7‑day diet plans and workout plans, edit them, and print / save them as PDF to share
on WhatsApp.

- **Phase 1 (this version): staff-only.** Members do not log in yet.
- Free to run: Next.js on **Vercel free tier** + **Supabase free tier**. No paid or AI APIs.

---

## What it does

| Page | What staff can do |
|---|---|
| **Login** | Staff log in with email + password. There is no public sign-up. |
| **Members** | Search by name/phone, add, edit, deactivate / reactivate, download CSV backups. |
| **Member page** | Profile, daily calorie & macro targets, diet + workout plans, weight history. |
| **Diet plan editor** | Auto-make a 7‑day plan, or build one by hand. Change foods and servings; totals update instantly. Draft / Published. |
| **Workout plan editor** | Start from a template (or blank), change exercises, sets, reps, rest, notes. Draft / Published. |
| **Print / PDF** | Clean black-and-white page. Phone: *Print → Save as PDF → share in WhatsApp*. |
| **Foods / Exercises** | Add and edit the gym's food list and exercise list. |

### How diet plans are made (no AI — fixed rules)

All numbers live in one file: [`src/lib/nutrition/config.ts`](src/lib/nutrition/config.ts).

1. **Adults only.** Under 18 → *“needs trainer manual plan”*; no automatic plan.
2. **“Needs professional review” ticked** → automatic plan blocked with a warning. Staff can still build one by hand.
3. Calories: **Mifflin‑St Jeor BMR × activity** (1.2 / 1.375 / 1.55 / 1.725).
   Fat loss −15 % (never deeper than −20 %), muscle gain +10 %, maintenance / general fitness = maintenance.
4. **Safety floor:** never below **1,200 kcal (women)** / **1,500 kcal (men)**.
5. Protein 1.6–2.2 g/kg (fat loss, muscle gain) or 1.2–1.6 g/kg (others). The target is the **low end**
   of that range (`proteinTargetPosition` in the config) — the middle (e.g. 173 g for a 91 kg vegetarian)
   is not reachable from normal Indian vegetarian food. Protein-rich foods are picked first (soya, paneer,
   moong/masoor dal, curd, sprouts). Fat 20–30 %. Carbs = the rest.
   **Cooking style** (per member): **Simple** (default) = one dal/curry + one sabzi and one kind of
   roti/rice per day, eaten at lunch and dinner; snacks and sides need no cooking. **More variety** =
   different dishes at lunch and dinner.
   Portions are kitchen-sized: whole rotis (at least 2 per meal above 1,800 kcal), at least 1 katori
   dal, and every lunch has a sabzi or salad.
6. 7 days × 6 meals (breakfast, mid‑morning, lunch, pre‑workout, post‑workout, dinner).
   **Rest days** skip pre/post‑workout and spread those calories over the other meals.
7. Food rules: diet type respected (vegetarian = no meat/fish/egg, vegan = no animal products),
   **allergies and “foods to avoid” are never included**, every day within **±5 %** of target,
   cheaper foods preferred when there is a budget, the same main dish never on back‑to‑back days.
8. If a correct plan is impossible, it **says why and makes no plan**. Every generated plan is
   re-checked by an independent safety check before it is shown.
9. In the editor, foods that break the rules are greyed out, and a plan with an allergy or
   diet-type problem **cannot be published**. If a member's allergies change after a plan was
   published, the member page shows a red warning.

### Seed data — please read

- **93 foods and 55 exercises** are loaded as **starter seed data** (`data/foods.ts`, `data/exercises.ts`
  → generated `supabase/seed.sql`).
- **Every food is marked `verified = false`.** The values come from USDA FoodData Central (SR Legacy),
  IFCT 2017, or are *recipe estimates* for cooked Indian dishes (neither database lists home recipes).
  They were **not** checked line-by-line against the source databases while building this app.
  Check each food in the **Foods** page and tick **Verified** once checked. Unverified foods show a ⚠.
- Food prices (₹ per serving) are rough estimates, only used to prefer cheaper foods. Edit them freely.
- Exercise instructions are short, original text written for this app.

---

## Setup for the gym owner (one time, about 30 minutes)

You need: a Google or GitHub account, and this project's code on GitHub.

### 1. Create the free database (Supabase)

1. Go to **supabase.com** → *Start your project* → sign in → **New project**.
2. Name: `gym-planner`. Choose a strong database password and **save it somewhere safe**.
   Region: **Mumbai (ap-south-1)** if you are in India. Plan: **Free**.
3. Wait ~2 minutes for the project to be ready.

### 2. Create the tables

1. In Supabase, open **SQL Editor** → **New query**.
2. Open the file `supabase/migrations/20261104000100_schema.sql`, copy everything, paste, click **Run**.
3. New query again → paste `supabase/migrations/20261104000200_security.sql` → **Run**.
4. New query again → paste `supabase/seed.sql` → **Run** (loads the starter foods and exercises).

You should see “Success. No rows returned” each time.

### 3. Turn OFF public sign-up

**Authentication → Sign In / Providers** → turn off **“Allow new users to sign up”** → Save.
(Only you create accounts. Even if someone did sign up, they would see nothing — but keep it off.)

### 4. Add a staff account (repeat for each trainer)

1. **Authentication → Users → Add user → Create new user.** Enter the email and a password,
   tick **Auto Confirm User**, click **Create user**.
2. **SQL Editor → New query**, paste this (change the email), **Run**:

   ```sql
   update public.profiles set role = 'staff' where email = 'trainer@example.com';
   ```

   Without this step the person can log in but sees *“This account is not a staff account”*.

To remove a trainer: Authentication → Users → ⋯ → **Delete user**.

### 5. Put the website online (Vercel)

1. In Supabase: **Project Settings → API**. Keep this tab open — you need the
   **Project URL** and the **anon public** key. (**Never** use the `service_role` key.)
2. Go to **vercel.com** → sign in with GitHub → **Add New → Project** → import this repository.
3. Before clicking Deploy, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon public key
4. Click **Deploy**. When it finishes, open the link and log in with your staff account.
5. In Supabase → **Authentication → URL Configuration**, set **Site URL** to your Vercel link.

If you add or change the keys later, go to Vercel → Deployments → ⋯ → **Redeploy**.
If the keys are missing, the app shows a “connect the database” page instead of pretending to work.

---

## ⚠ Important: free plan limits and backups

- **Supabase free projects pause after about 1 week with no activity.** The app will then show
  *“Something went wrong”*. Fix: log in to supabase.com, open the project, click **Restore / Resume**.
  Using the app regularly keeps it awake.
- **The free plan has no automatic backups.** If data is deleted or the project is lost, it is gone.

### Weekly backup (2 minutes)

On the **Members** page, open **“Backup: download data as CSV (Excel)”** and download all five files
(Members, Weight history, Plans, Foods, Exercises). Save them in Google Drive with the date.
(Phone numbers in the CSV start with `'` — this stops Excel from treating them as formulas.)

Optional full database backup for a technical helper:
`npx supabase db dump --db-url "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" -f backup.sql`

---

## For developers

```bash
npm install
cp .env.example .env.local        # add your keys, or use local Supabase below
npm run dev                       # http://localhost:3000
```

### Local Supabase (Docker required)

```bash
npx supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
npx supabase db reset             # runs migrations + supabase/seed.sql
```

Put the printed API URL and anon key in `.env.local`. Create a staff user via the local auth admin
API or Studio, then run the `update public.profiles set role = 'staff' ...` line.

### Commands

| Command | What it does |
|---|---|
| `npm test` | Unit tests: calorie/macro maths, diet rules, seed-data checks, validation, CSV. |
| `npm run test:db` | Row Level Security tests against a **running local Supabase** (see below). |
| `npm run typecheck` / `npm run lint` | TypeScript strict check / ESLint. |
| `npm run build` | Production build. |
| `npm run seed:sql` | Regenerate `supabase/seed.sql` from `data/*.ts`. |

`npm run test:db` needs `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`, `SUPABASE_TEST_SERVICE_ROLE_KEY`
set to the **local** values from `npx supabase status`. It creates two throw-away users (one staff,
one not) and proves anonymous and non-staff users can't read or change anything. The service-role
key is used **only** by this test file, never by the app.

### Project layout

```
supabase/migrations/   schema + security (RLS) SQL
supabase/seed.sql      GENERATED seed data — edit data/*.ts instead
data/                  seed foods & exercises (typed, unit-tested)
src/lib/nutrition/     config.ts (all rules) · calc.ts · rules.ts · generator.ts
src/lib/workout/       templates.ts
src/app/(staff)/       all staff pages + server actions
src/app/login/         login page
src/app/api/export/    CSV backup download
tests/                 vitest unit tests;  tests/db/ = RLS tests
```

### Security model

- Every table has **Row Level Security**. Staff (`profiles.role = 'staff'`) can read/write
  everything; logged-in non-staff and anonymous visitors get **nothing**. Anonymous grants are revoked.
- New accounts always start as `member`; only SQL / the dashboard can make someone staff.
- The app only uses the public anon key + the user's login session. The service-role key is never used.

### Known limitations (Phase 1)

- Workout templates are defined in code (`src/lib/workout/templates.ts`); plans made from them are fully editable.
- Sex is male/female only, because the Mifflin‑St Jeor formula needs one of the two.
- Some combinations (e.g. a heavy vegetarian on fat loss, or vegan + no soy) can fall a little short of
  the protein target on some days (the 91 kg vegetarian test case averages ~140 g vs 146 g). Whey protein
  is in the food list but is never added automatically — that is the trainer's decision.
- Some combinations (e.g. vegan + no soy + low budget) may fall short of the protein target;
  the plan shows a warning so the trainer can adjust.
