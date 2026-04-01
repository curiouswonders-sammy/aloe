-- Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('student', 'teacher', 'coach')),
  created_at timestamptz not null default now()
);

-- Direct messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists messages_sender_idx on public.messages(sender_id, created_at);
create index if not exists messages_recipient_idx on public.messages(recipient_id, created_at);

alter table public.profiles enable row level security;
alter table public.messages enable row level security;

-- A user can read their own profile.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- A user can read messages where they are sender or recipient.
drop policy if exists "Users can read own messages" on public.messages;
create policy "Users can read own messages"
  on public.messages
  for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- A user can send messages only as themselves.
drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages"
  on public.messages
  for insert
  to authenticated
  with check (auth.uid() = sender_id);
