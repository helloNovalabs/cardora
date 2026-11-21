-- Cardora : une collection par compte (21/11/2026)
create table if not exists public.collections (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.collections enable row level security;
create policy "lire sa collection" on public.collections for select using (auth.uid() = user_id);
create policy "créer sa collection" on public.collections for insert with check (auth.uid() = user_id);
create policy "modifier sa collection" on public.collections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
