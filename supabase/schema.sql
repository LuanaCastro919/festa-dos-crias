-- ============================================================
-- BAILE DOS CRIAS — Schema do banco de dados
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query
-- ============================================================

-- extensão para gerar uuids
create extension if not exists "pgcrypto";

-- ---------- LOTES ----------
create table if not exists lots (
  id bigint generated always as identity primary key,
  name text not null,
  price_cents integer not null check (price_cents > 0),
  quantity integer not null check (quantity > 0),
  sold integer not null default 0,
  position integer not null default 0,
  status text not null default 'aguardando' check (status in ('ativo','esgotado','aguardando','encerrado')),
  created_at timestamptz not null default now()
);

-- ---------- PEDIDOS (um pedido = uma cobrança PIX, pode gerar vários ingressos) ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  buyer_name text not null,
  cpf text not null,
  email text not null,
  whatsapp text not null,
  lot_id bigint not null references lots(id),
  qty integer not null check (qty > 0 and qty <= 8),
  total_cents integer not null,
  payment_method text not null default 'PIX',
  status text not null default 'pendente' check (status in ('pendente','pago','expirado','recusado','cancelado')),
  pagbank_order_id text,
  pagbank_charge_id text,
  pix_qr_text text,
  pix_qr_image_url text,
  pix_expiration timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_pagbank_order_id on orders(pagbank_order_id);
create index if not exists idx_orders_email on orders(email);

-- ---------- INGRESSOS (gerados somente após confirmação de pagamento) ----------
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  ticket_code text not null unique,
  lot_id bigint not null references lots(id),
  lot_name text not null,
  buyer_name text not null,
  cpf text not null,
  email text not null,
  whatsapp text not null,
  price_paid_cents integer not null,
  payment_method text not null,
  checkin_status text not null default 'pendente' check (checkin_status in ('pendente','realizado')),
  checkin_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_tickets_code on tickets(ticket_code);
create index if not exists idx_tickets_email on tickets(email);
create index if not exists idx_tickets_cpf on tickets(cpf);

-- ---------- PERFIS DE ADMIN (ligado ao auth.users do Supabase) ----------
create table if not exists admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','portaria')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Toda a escrita/leitura sensível passa pelas rotas /api do
-- servidor (que usam a service_role key e ignoram RLS).
-- Por segurança, bloqueamos acesso direto do navegador (anon key)
-- a tudo, exceto leitura pública dos lotes (pra mostrar preço/vagas).
-- ============================================================

alter table lots enable row level security;
alter table orders enable row level security;
alter table tickets enable row level security;
alter table admin_profiles enable row level security;

drop policy if exists "lots_public_read" on lots;
create policy "lots_public_read" on lots for select using (true);

-- nenhuma policy de insert/update/delete para anon -> só service_role (que ignora RLS) pode escrever

-- ============================================================
-- LOTES INICIAIS DE EXEMPLO — ajuste nomes, preços e quantidades
-- ============================================================
insert into lots (name, price_cents, quantity, position, status)
values
  ('1º Lote', 4000, 100, 1, 'ativo'),
  ('2º Lote', 5000, 150, 2, 'aguardando'),
  ('3º Lote', 6000, 200, 3, 'aguardando')
on conflict do nothing;
