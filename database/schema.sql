-- ============================================================
-- Receitas API - Estrutura do banco de dados (Supabase / PostgreSQL)
-- Execute no SQL Editor do Supabase (projeto de desenvolvimento e de testes).
-- O script é idempotente: pode ser executado mais de uma vez.
-- ============================================================

-- Categorias de receitas
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  display_order integer not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Receitas (N:1 com categories)
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

-- Avaliações (N:1 com receitas)
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  receita_id uuid not null references receitas(id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- Favoritos (1:1 com receitas: cada receita só pode ser favoritada uma vez)
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  receita_id uuid not null unique references receitas(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

-- Regras de unicidade reforçadas no banco (a API também valida nos Services)
create unique index if not exists categories_name_unique
  on categories (lower(name));

create unique index if not exists receitas_title_per_category_unique
  on receitas (category_id, lower(title));

-- Índices para as consultas por chave estrangeira
create index if not exists receitas_category_id_idx on receitas (category_id);
create index if not exists reviews_receita_id_idx on reviews (receita_id);

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
