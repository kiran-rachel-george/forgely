-- Enable UUID generation.
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  credits integer not null default 10,
  plan text not null default 'free',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  name text not null,
  is_public boolean not null default false,
  project_type text not null default 'fullstack',
  ai_model text not null default 'claude-sonnet',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  code text not null,
  prompt text not null,
  version_number integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique(project_id, version_number)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_projects_user_id on public.projects (user_id);
create index if not exists idx_projects_workspace_id on public.projects (workspace_id);
create index if not exists idx_versions_project_id on public.versions (project_id);
create index if not exists idx_messages_project_id on public.messages (project_id);
create index if not exists idx_workspaces_user_id on public.workspaces (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.projects enable row level security;
alter table public.versions enable row level security;
alter table public.messages enable row level security;

-- users
drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

-- projects
drop policy if exists "Users can manage own projects" on public.projects;
create policy "Users can manage own projects"
  on public.projects
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- versions
drop policy if exists "Users can manage versions in own projects" on public.versions;
create policy "Users can manage versions in own projects"
  on public.versions
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = versions.project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.projects p
      where p.id = versions.project_id
        and p.user_id = auth.uid()
    )
  );

-- messages
drop policy if exists "Users can manage messages in own projects" on public.messages;
create policy "Users can manage messages in own projects"
  on public.messages
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = messages.project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.projects p
      where p.id = messages.project_id
        and p.user_id = auth.uid()
    )
  );

-- workspaces
drop policy if exists "Users can manage own workspaces" on public.workspaces;
create policy "Users can manage own workspaces"
  on public.workspaces
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
