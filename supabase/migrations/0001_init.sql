-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Enum types
create type subscription_status as enum ('active', 'canceled', 'past_due');
create type issue_status as enum ('pending', 'generated', 'scheduled', 'sent', 'failed', 'canceled');
create type cadence_enum as enum ('1', '2', '4');
create type tone_enum as enum ('professional', 'friendly', 'playful', 'analytical', 'editorial', 'custom');
create type length_enum as enum ('short', 'medium', 'long');
create type job_type as enum ('generate', 'send');
create type job_status as enum ('queued', 'processing', 'succeeded', 'failed', 'retry');

-- Tables
create table users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status subscription_status not null default 'canceled',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  cadence cadence_enum not null default '1',
  send_day int,
  send_time time,
  timezone text,
  topics text[],
  tone tone_enum not null default 'professional',
  tone_custom text,
  length length_enum not null default 'medium',
  must_include text[],
  avoid text[],
  cta text,
  sender_name text,
  reply_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table newsletter_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  template_version text,
  theme jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  scheduled_at timestamptz,
  generated_at timestamptz,
  status issue_status not null default 'pending',
  subject text,
  preheader text,
  content_json jsonb,
  content_html text,
  model_used text,
  tokens_input int,
  tokens_output int,
  cost_estimate_cents int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  type job_type not null,
  status job_status not null default 'queued',
  attempts int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table email_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  resend_message_id text,
  event_type text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  to_email text not null,
  payload jsonb,
  status text not null default 'scheduled',
  send_at timestamptz not null,
  sent_at timestamptz,
  delivered_at timestamptz,
  error text
);

-- Indexes
create index idx_users_clerk_user_id on users(clerk_user_id);
create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_preferences_user_id on preferences(user_id);
create index idx_issues_user_id on issues(user_id);
create index idx_issues_status_scheduled_at on issues(status, scheduled_at);
create index idx_jobs_issue_id on jobs(issue_id);
create index idx_jobs_status on jobs(status);
create index idx_email_events_issue_id on email_events(issue_id);
create index idx_audit_logs_user_id on audit_logs(user_id);
create index idx_deliveries_issue_id on deliveries(issue_id);
create index idx_deliveries_send_at_status on deliveries(send_at, status);

-- Row Level Security
alter table users enable row level security;
alter table subscriptions enable row level security;
alter table preferences enable row level security;
alter table newsletter_templates enable row level security;
alter table issues enable row level security;
alter table jobs enable row level security;
alter table email_events enable row level security;
alter table audit_logs enable row level security;
alter table deliveries enable row level security;

-- Base policies (service role has bypass, auth users only operate on their rows)
create policy "Allow service role full access on users"
  on users
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Users can view own profile"
  on users
  for select
  using (auth.uid()::text = clerk_user_id);

create policy "Users can manage own subscriptions"
  on subscriptions
  using (auth.role() = 'service_role' or user_id in (select id from users where clerk_user_id = auth.uid()::text))
  with check (auth.role() = 'service_role' or user_id in (select id from users where clerk_user_id = auth.uid()::text));

create policy "Users can manage own preferences"
  on preferences
  using (auth.role() = 'service_role' or user_id in (select id from users where clerk_user_id = auth.uid()::text))
  with check (auth.role() = 'service_role' or user_id in (select id from users where clerk_user_id = auth.uid()::text));

create policy "Users can read own issues"
  on issues
  for select
  using (auth.role() = 'service_role' or user_id in (select id from users where clerk_user_id = auth.uid()::text));

create policy "Users can manage own issues"
  on issues
  for all
  using (auth.role() = 'service_role' or user_id in (select id from users where clerk_user_id = auth.uid()::text))
  with check (auth.role() = 'service_role' or user_id in (select id from users where clerk_user_id = auth.uid()::text));

create policy "Users can read own jobs"
  on jobs
  for select
  using (
    auth.role() = 'service_role'
    or issue_id in (select id from issues where user_id in (select id from users where clerk_user_id = auth.uid()::text))
  );

create policy "Service role manages jobs"
  on jobs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Users can read own email events"
  on email_events
  for select
  using (
    auth.role() = 'service_role'
    or issue_id in (select id from issues where user_id in (select id from users where clerk_user_id = auth.uid()::text))
  );

create policy "Service role manages email events"
  on email_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role manages audit logs"
  on audit_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role manages deliveries"
  on deliveries
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Users can read own deliveries"
  on deliveries
  for select
  using (
    auth.role() = 'service_role'
    or user_id in (select id from users where clerk_user_id = auth.uid()::text)
  );
