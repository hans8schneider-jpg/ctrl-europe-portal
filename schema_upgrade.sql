-- Run this in Supabase SQL Editor to upgrade your database

-- Add last_seen to profiles
alter table profiles add column if not exists last_seen timestamp;
alter table profiles add column if not exists status text default 'active'; -- active, away, needs_help
alter table profiles add column if not exists secondary_bucket text; -- for dual membership

-- Events/Calendar table
create table if not exists events (
  id serial primary key,
  title text not null,
  description text,
  date text not null,
  time text,
  type text default 'event', -- event, deadline, meeting
  created_by uuid references profiles(id),
  created_at timestamp default now()
);

-- Pinned messages
alter table messages add column if not exists pinned boolean default false;
alter table messages add column if not exists pinned_by uuid references profiles(id);

-- Task history - who completed what
alter table tasks add column if not exists completed_by uuid references profiles(id);
alter table tasks add column if not exists completed_at timestamp;
alter table tasks add column if not exists bucket_target text default 'all';

-- Weekly stats view
create or replace view weekly_stats as
select 
  p.bucket,
  count(t.id) filter (where t.done = true and t.completed_at > now() - interval '7 days') as completed_this_week,
  count(t.id) filter (where t.done = false) as open_tasks,
  count(distinct t.completed_by) as active_members
from profiles p
left join tasks t on t.bucket_target = p.bucket
group by p.bucket;

-- RLS policies for events
alter table events enable row level security;
create policy "Events readable by authenticated" on events for select using (auth.role() = 'authenticated');
create policy "Events insertable by authenticated" on events for insert with check (auth.role() = 'authenticated');
create policy "Events deletable by creator" on events for delete using (auth.uid() = created_by);

-- Update profiles RLS
create policy "Profiles updatable by owner" on profiles for update using (auth.uid() = id);
