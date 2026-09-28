-- Execute no SQL Editor do Supabase

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists receitas (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id),
  title text not null,
  description text,
  ingredients text not null,
  instructions text not null,
  prep_time_minutes integer check (prep_time_minutes > 0),
  servings integer check (servings > 0),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  image text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  receita_id uuid not null references receitas(id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  receita_id uuid not null unique references receitas(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);
