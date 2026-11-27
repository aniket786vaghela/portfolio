-- Portfolio backend setup. Run once in Supabase → SQL Editor → New query → Run.
-- Safe to run again: every statement is idempotent.

-- 1) Who may edit. Add your own email after running this file (see step 5).
--    Kept in a table (not in this file) so your email never lands in your Git repo.
create table if not exists public.portfolio_admins (
  email text primary key
);
alter table public.portfolio_admins enable row level security;
-- No policies on purpose: the browser can't read or change this table.

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.portfolio_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

-- 2) The site content: one JSON document in the row id = 'main'.
create table if not exists public.portfolio_data (
  id         text primary key,
  content    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.portfolio_data enable row level security;

drop policy if exists "portfolio_data public read" on public.portfolio_data;
create policy "portfolio_data public read"
  on public.portfolio_data for select
  to anon, authenticated
  using (true);

drop policy if exists "portfolio_data admin insert" on public.portfolio_data;
create policy "portfolio_data admin insert"
  on public.portfolio_data for insert
  to authenticated
  with check (public.is_portfolio_admin());

drop policy if exists "portfolio_data admin update" on public.portfolio_data;
create policy "portfolio_data admin update"
  on public.portfolio_data for update
  to authenticated
  using (public.is_portfolio_admin())
  with check (public.is_portfolio_admin());

drop policy if exists "portfolio_data admin delete" on public.portfolio_data;
create policy "portfolio_data admin delete"
  on public.portfolio_data for delete
  to authenticated
  using (public.is_portfolio_admin());

-- 3) Public media bucket (images, videos, companion faces). 50 MB per file.
insert into storage.buckets (id, name, public, file_size_limit)
values ('portfolio-media', 'portfolio-media', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit;

-- 4) Storage policies: anyone can read, only the admin can upload/replace/delete.
drop policy if exists "portfolio-media public read" on storage.objects;
create policy "portfolio-media public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio-media');

drop policy if exists "portfolio-media admin upload" on storage.objects;
create policy "portfolio-media admin upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

drop policy if exists "portfolio-media admin update" on storage.objects;
create policy "portfolio-media admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio-media' and public.is_portfolio_admin())
  with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

drop policy if exists "portfolio-media admin delete" on storage.objects;
create policy "portfolio-media admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

-- 5) Allow your login to edit. Run this line separately with YOUR email
--    (the same one you create under Authentication → Users):
-- insert into public.portfolio_admins (email) values ('you@example.com') on conflict do nothing;
