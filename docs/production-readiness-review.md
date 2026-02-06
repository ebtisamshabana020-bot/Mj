# Production Readiness Review (Principal Engineer)

## 1) Findings (Critical / High / Medium / Low)

### Critical

1. **Server-backed architecture is not active in current code; app is still demo-localStorage driven.**
   - `App.tsx` restores session from `localStorage`, persists user in `localStorage`, and loads exams from `localStorage`.
   - This directly conflicts with the required server-only baseline.

2. **Deleted features are still present and routed.**
   - `components/ImageEditor.tsx` and `components/geminiService.ts` exist.
   - `App.tsx` still imports `ImageEditor` and handles `AppView.IMAGE_EDITOR` route.
   - `types.ts` still contains `AppView.IMAGE_EDITOR` and `ImageEditState`.

3. **Auth model is insecure and non-production.**
   - `components/Login.tsx` stores and compares raw passwords in `localStorage`.
   - It auto-creates users on failed login and has hardcoded admin credentials (`Admin` / `password123`).
   - This is a critical auth bypass / privilege-escalation pattern.

4. **Hardcoded Supabase placeholders can cause accidental misconfiguration in production.**
   - `components/services/supabaseClient.ts` uses static demo URL/key defaults (`example.supabase.co`, `demo-anon-key`) instead of strict env validation.

### High

1. **Project has contradictory integration paths causing reliability risk.**
   - Both local/demo components and parallel `components/services/*` Supabase-aware variants exist.
   - This increases drift, confusion, and broken imports during merges.

2. **Role handling is client-authoritative.**
   - UI checks role from mutable client object (`currentUser.role`) rather than server-enforced claims / RLS.
   - Admin panel role mutation is local-only and insecure by design.

3. **Group access strategy is client-side hash verification.**
   - Group password checks happen in browser code and are mutable/tamperable.
   - Verification must be server-side (RPC/Edge Function) with rate limits and auditing.

### Medium

1. **Build consistency risk from duplicate/broken imports in local path.**
   - `components/GroupsList.tsx` includes duplicated `hashString` import statement.

2. **README and Vite config do not enforce secure env contract.**
   - `README.md` still advertises local demo mode.
   - `vite.config.ts` has no strict env guardrails for Supabase variables.

3. **Error handling is mostly alert/string-only and not stateful/recoverable.**
   - Major flows should include retry paths, typed error mapping, and offline/network status messaging.

### Low

1. **Inconsistent source tree naming and duplicate concerns.**
   - `components/` and `components/services/` overlap responsibilities; this complicates onboarding and code ownership.

---

## 2) File-by-file patch plan

> Goal: enforce **server mode only**, remove deleted features, and align runtime with Supabase-backed flow.

### `App.tsx`

- Remove:
  - `LOCAL_USER_KEY`, `LOCAL_EXAMS_KEY`
  - all `localStorage` reads/writes
  - `ImageEditor` import
  - `AppView.IMAGE_EDITOR` route case
- Add:
  - bootstrap flow using `supabase.auth.getSession()`
  - on-session profile fetch from `profiles`
  - `exams` fetch by `group_id`
  - logout via `supabase.auth.signOut()`
  - fatal-error and empty-state rendering for API failures

### `components/Login.tsx`

- Replace local demo login with:
  - synthetic email: `${normalize(username)}@studygenius.app`
  - `supabase.auth.signInWithPassword({ email, password })`
  - read or create profile in `profiles` table
- Remove:
  - demo credential persistence
  - user autoprovision on failed password
  - hardcoded admin auto-login
- Add:
  - rate-limit friendly UX (generic auth error)
  - disabled submit with loading guard

### `components/Register.tsx`

- Remove all `localStorage` paths.
- Use `supabase.auth.signUp` + insert profile row.
- Keep role request as **pending role** only; final privileged role assignment must be admin-only server-side.

### `components/GroupsList.tsx`

- Remove local group persistence and browser-side trust.
- Use server-backed list (query only rows user can access through RLS).
- Group join should call RPC/Edge Function validating password server-side.

### `components/ExamCreator.tsx`, `components/AdminPanel.tsx`, `components/ProfileEditor.tsx`

- Remove local writes and convert to table operations guarded by RLS.
- For admin actions (promote/demote/verify), expose secure RPC that checks caller role from JWT + policy.

### `types.ts`

- Delete `ImageEditState`.
- Remove `AppView.IMAGE_EDITOR` enum member.
- Ensure server-backed entity names align with DB schema (`group_id`, `created_by`, timestamps).

### `components/ImageEditor.tsx`, `components/geminiService.ts`

- Delete files.
- Ensure no import references remain (`rg -n "ImageEditor|geminiService|IMAGE_EDITOR"`).

### `components/services/supabaseClient.ts` and `vite.config.ts`

- Enforce env-only client construction:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Throw startup error if missing.
- Do **not** ship placeholder URL/key.

### `README.md`

- Remove local demo claims.
- Document required env variables and migration/bootstrap commands.
- Add production auth/role model and RLS prerequisites.

---

## 3) SQL / RLS policy templates (Supabase hardening)

> Use `auth.uid()` as identity source. Keep all sensitive authorization server-side.

### 3.1 Schema assumptions

```sql
-- roles are enforced from profiles.role (USER/TEACHER/ADMIN)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null check (role in ('USER','TEACHER','ADMIN')) default 'USER',
  is_verified boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles(id),
  join_password_hash text not null, -- Argon2id hash only
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null check (member_role in ('STUDENT','TEACHER','OWNER')) default 'STUDENT',
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  payload jsonb not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
```

### 3.2 Enable RLS

```sql
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.exams enable row level security;
alter table public.messages enable row level security;
```

### 3.3 Helper predicates

```sql
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'ADMIN'
  );
$$;

create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = gid and gm.user_id = uid
  );
$$;

create or replace function public.can_manage_group(gid uuid, uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = gid
      and gm.user_id = uid
      and gm.member_role in ('TEACHER','OWNER')
  ) or public.is_admin(uid);
$$;
```

### 3.4 Minimum policies by role

```sql
-- PROFILES
create policy "profiles_self_read"
on public.profiles for select
using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles_self_update"
on public.profiles for update
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles_insert_self"
on public.profiles for insert
with check (id = auth.uid());

-- GROUPS
create policy "groups_member_read"
on public.groups for select
using (public.is_group_member(id, auth.uid()) or public.is_admin(auth.uid()));

create policy "groups_teacher_create"
on public.groups for insert
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('TEACHER','ADMIN'))
  and owner_id = auth.uid()
);

create policy "groups_owner_update"
on public.groups for update
using (owner_id = auth.uid() or public.is_admin(auth.uid()))
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

-- GROUP MEMBERS
create policy "group_members_member_read"
on public.group_members for select
using (user_id = auth.uid() or public.can_manage_group(group_id, auth.uid()));

create policy "group_members_manage_by_manager"
on public.group_members for all
using (public.can_manage_group(group_id, auth.uid()))
with check (public.can_manage_group(group_id, auth.uid()));

-- EXAMS
create policy "exams_member_read"
on public.exams for select
using (public.is_group_member(group_id, auth.uid()));

create policy "exams_teacher_write"
on public.exams for insert
with check (public.can_manage_group(group_id, auth.uid()) and created_by = auth.uid());

create policy "exams_teacher_update_delete"
on public.exams for update
using (public.can_manage_group(group_id, auth.uid()))
with check (public.can_manage_group(group_id, auth.uid()));

create policy "exams_teacher_delete"
on public.exams for delete
using (public.can_manage_group(group_id, auth.uid()));

-- MESSAGES
create policy "messages_member_read"
on public.messages for select
using (public.is_group_member(group_id, auth.uid()));

create policy "messages_member_insert"
on public.messages for insert
with check (public.is_group_member(group_id, auth.uid()) and sender_id = auth.uid());
```

### 3.5 Password strategy (Argon2)

- **Use Argon2id** for group join passwords; do not hash/verify in the browser.
- Recommended params (start point):
  - memory: 64–128 MB
  - iterations: 2–4
  - parallelism: 1–2
- Implement verification inside an Edge Function / trusted backend endpoint:
  1. Receive `group_id` and plaintext join password over TLS.
  2. Fetch `join_password_hash` server-side.
  3. Verify with Argon2id.
  4. On success, insert into `group_members`.
  5. Rate-limit and audit failed attempts.

### 3.6 Zero-downtime migration order

1. **Additive phase:** create new tables/functions/policies without removing old paths.
2. **Dual-read phase:** app reads from server; localStorage path disabled by feature flag.
3. **Dual-write short phase (optional):** write to server only for auth-critical entities.
4. **Cutover:** remove localStorage code paths and deleted feature references.
5. **Lockdown:** enforce RLS strictly, revoke permissive policies, remove legacy columns.
6. **Cleanup:** delete stale files/routes (`ImageEditor`, `geminiService`) and update docs.

---

## 4) Git commands (conflict-proof delivery)

### Rebase workflow (preferred for clean history)

```bash
git fetch origin
git checkout <feature-branch>
git rebase origin/main
# resolve conflicts, then:
git add -A
git rebase --continue
# run checks
npm run build
# update remote safely when rebased:
git push --force-with-lease origin <feature-branch>
```

Use `--force-with-lease` **only** after a rebase/amend/history rewrite.

### Merge workflow (no history rewrite)

```bash
git fetch origin
git checkout <feature-branch>
git merge origin/main
# resolve conflicts
 git add -A
 git commit -m "Merge origin/main into <feature-branch>"
# run checks
npm run build
git push origin <feature-branch>
```

### One-command fallback for known conflict set

> Keeps your branch version for the known files and finalizes merge/rebase state in one shot.

```bash
git checkout --ours README.md components/Login.tsx vite.config.ts components/ImageEditor.tsx components/geminiService.ts && git add README.md components/Login.tsx vite.config.ts components/ImageEditor.tsx components/geminiService.ts && (git rebase --continue || git commit -m "Resolve known conflicts (ours)" )
```

If you want the upstream/main version instead, swap `--ours` with `--theirs`.

---

## 5) Final validation checklist (build / test / deploy)

### Build & static checks

- `npm ci`
- `npm run build`
- `npm run lint` (if configured)
- `rg -n "localStorage|studygenius_demo|ImageEditor|geminiService|IMAGE_EDITOR|demo-anon-key|example.supabase.co" App.tsx components types.ts README.md vite.config.ts`

### Runtime functional checks

- Login with valid server user (`signInWithPassword`) succeeds.
- Invalid password shows generic error; no user auto-creation.
- Logout invalidates session server-side (`signOut`).
- Group/exam fetch works only through Supabase queries.
- Admin-only actions fail for non-admin even if UI is tampered.

### Security checks

- RLS enabled on `profiles`, `groups`, `group_members`, `exams`, `messages`.
- No hardcoded Supabase URL/key fallback.
- Join password verification handled server-side with **Argon2id**.
- Rate limit + audit events for auth and group join failures.

### Deployment gates

- Required env vars present in deployment target.
- DB migrations applied in order with rollback notes.
- Post-deploy smoke test run against production-like environment.
