-- ─────────────────────────────────────────────────────────────────────
-- Grain & Grains · Panel administrativo
-- Ejecuta este archivo en Supabase → SQL Editor → New query → Run.
-- Se puede volver a ejecutar sin problemas: crea solo lo que falta y no
-- borra ni pisa datos (los textos editados en el panel se respetan).
--
-- Seguridad: todas las tablas tienen RLS activado y SIN políticas, así que
-- nadie puede leerlas ni escribirlas desde el navegador con la clave
-- pública. Solo el servidor de la web, con SUPABASE_SERVICE_ROLE_KEY.
-- ─────────────────────────────────────────────────────────────────────

-- Pedidos (se guardan solos desde el checkout y el webhook de Mercado Pago)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,              -- GG-20261022-AB12
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- pending | paid | preparing | shipped | delivered | cancelled | refunded | rejected
  status text not null default 'pending',
  payment_id text,
  payment_method text,                       -- card | wallet (Yape)
  payment_status text,                       -- estado en Mercado Pago
  locale text,
  customer jsonb not null default '{}',      -- nombre, correo, celular, documento, boletín
  address jsonb not null default '{}',
  receipt jsonb not null default '{}',       -- boleta / factura
  items jsonb not null default '[]',         -- líneas con precio
  gifts jsonb not null default '[]',
  coupons jsonb not null default '[]',
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  refunded_amount numeric(10,2) not null default 0,
  carrier text,
  tracking_code text,
  notes text,
  stock_applied boolean not null default false,
  history jsonb not null default '[]'        -- [{ at, status, by, note }]
);
create index if not exists orders_created_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_email_idx on orders ((customer->>'email'));

-- Mensajes del formulario de contacto y cotizaciones
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null,
  name text not null,
  email text not null,
  phone text,
  company text,
  country text,
  volume text,
  message text not null,
  locale text,
  status text not null default 'new',        -- new | replied | closed
  notes text
);
create index if not exists messages_created_idx on messages (created_at desc);

-- Productos: solo lo que cambia respecto al catálogo del código
-- (si un producto no está aquí, se usa tal cual está en el código)
create table if not exists products (
  id text primary key,                        -- id del producto (p. ej. donEliseoFarm)
  category_id text not null,                  -- edición a la que pertenece
  custom boolean not null default false,      -- true = creado en el panel
  active boolean not null default true,       -- false = oculto en la web
  deleted boolean not null default false,     -- eliminado (los del código se pueden restaurar)
  prices jsonb,                               -- { "250g": 45, "1kg": 150 }
  stock jsonb,                                -- { "250g": 20, "1kg": null }  (null = sin límite)
  image text,
  hover_image text,
  card_bg text,                               -- color de fondo de la tarjeta
  certifications jsonb,                       -- ["fairtrade", "usdaOrganic", "cleanCup"]
  sort integer,
  updated_at timestamptz not null default now()
);

-- Ediciones (categorías). Las del código se pueden editar u ocultar; las
-- nuevas se crean aquí. Sus textos (nombre, palabra grande y descripción)
-- van en i18n_overrides bajo editions.<id>.{name,bigBot,subtitle}
create table if not exists editions (
  id text primary key,
  custom boolean not null default false,
  active boolean not null default true,
  deleted boolean not null default false,
  color text,                                 -- color de la edición (tarjetas, puntos)
  panel_bg text,                              -- fondo del slider
  panel_image text,                           -- imagen del slider
  hero_text_color text,
  heading_color text,
  sort integer,
  updated_at timestamptz not null default now()
);

-- Varietales y procesos: listas que se crean en el panel (pestaña
-- "Varietales y procesos"). Sus nombres van en i18n_overrides bajo
-- shop.varietals.<id> / shop.processes.<id>. Inactiva = no se ofrece en
-- ningún café.
create table if not exists varietals (
  id text primary key,                        -- p. ej. geisha
  active boolean not null default true,
  sort integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists processes (
  id text primary key,                        -- p. ej. lavado
  active boolean not null default true,
  sort integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Qué varietales y procesos tiene cada café. El cliente elige una varietal y
-- un proceso entre los que estén visibles (active). product_id no tiene
-- llave foránea: los cafés del código no siempre tienen fila en products.
create table if not exists product_varietals (
  product_id text not null,
  varietal_id text not null references varietals (id) on delete cascade,
  active boolean not null default true,       -- visible para el cliente
  sort integer,
  primary key (product_id, varietal_id)
);

create table if not exists product_processes (
  product_id text not null,
  process_id text not null references processes (id) on delete cascade,
  active boolean not null default true,       -- visible para el cliente
  sort integer,
  primary key (product_id, process_id)
);

-- Combos (packs de cafés con descuento; cada café en la presentación que se
-- elija, 250 g si no se indica). Los del código se pueden editar u ocultar;
-- los nuevos se crean aquí. Su nombre va en i18n_overrides bajo
-- cart.combos.<id>.name
create table if not exists combos (
  id text primary key,
  custom boolean not null default false,
  active boolean not null default true,
  deleted boolean not null default false,
  discount numeric,                           -- % de descuento sobre la suma de los cafés
  items jsonb,                                -- [{ "categoryId": "farmers", "productId": "donEliseoFarm", "size": "250g" }, …]
  sort integer,
  updated_at timestamptz not null default now()
);

-- Cupones creados o modificados desde el panel (mismo formato que el código)
create table if not exists coupons (
  code text primary key,
  data jsonb not null,                        -- { code, reward, rules, active, ... }
  deleted boolean not null default false,     -- oculta un cupón del código
  updated_at timestamptz not null default now()
);

-- Ajustes generales (contacto, envíos, promoción…)
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Textos editados desde el panel (pisan a los de messages/*.json)
create table if not exists i18n_overrides (
  locale text not null,
  key text not null,                          -- p. ej. sustainability.blocks.0.title
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (locale, key)
);

-- Historial de cambios hechos en el panel
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb
);
create index if not exists audit_at_idx on audit_log (at desc);

-- Columnas que se agregaron después: si las tablas ya existían de una
-- versión anterior de este archivo, aquí se completan
alter table products add column if not exists custom boolean not null default false;
alter table products add column if not exists deleted boolean not null default false;
alter table products add column if not exists hover_image text;
alter table products add column if not exists card_bg text;
alter table products add column if not exists certifications jsonb;
alter table products add column if not exists sort integer;
alter table combos add column if not exists items jsonb;

-- Descuenta stock de una presentación sin bajar de 0 (null = sin límite)
create or replace function decrement_stock(p_id text, p_size text, p_qty int)
returns void language sql as $$
  update products
     set stock = jsonb_set(
           stock, array[p_size],
           to_jsonb(greatest(0, (stock->>p_size)::int - p_qty))
         ),
         updated_at = now()
   where id = p_id
     and stock ? p_size
     and stock->>p_size is not null
     and stock->>p_size <> 'null';
$$;

-- Solo el servidor (service_role) puede llamar a la función por la API
revoke execute on function decrement_stock(text, text, int) from public;
revoke execute on function decrement_stock(text, text, int) from anon, authenticated;
grant execute on function decrement_stock(text, text, int) to service_role;

alter table orders enable row level security;
alter table messages enable row level security;
alter table products enable row level security;
alter table editions enable row level security;
alter table combos enable row level security;
alter table varietals enable row level security;
alter table processes enable row level security;
alter table product_varietals enable row level security;
alter table product_processes enable row level security;
alter table coupons enable row level security;
alter table settings enable row level security;
alter table i18n_overrides enable row level security;
alter table audit_log enable row level security;

-- ─────────────────────────────────────────────────────────────────────
-- Datos iniciales: varietales y procesos más comunes, con su nombre en
-- los 8 idiomas de la web. No se asignan a ningún café: en el panel
-- (Productos → Editar) se marca cuáles tiene cada uno. Si ya existen (o
-- se editaron en el panel), no se tocan.
-- ─────────────────────────────────────────────────────────────────────

insert into varietals (id, sort) values
  ('typica', 10),
  ('bourbon', 20),
  ('bourbon-rosado', 30),
  ('caturra', 40),
  ('catuai', 50),
  ('catimor', 60),
  ('pache', 70),
  ('geisha', 80),
  ('mundo-novo', 90),
  ('pacamara', 100),
  ('maragogipe', 110),
  ('castillo', 120),
  ('marsellesa', 130),
  ('costa-rica-95', 140),
  ('sl28', 150)
on conflict (id) do nothing;

insert into i18n_overrides (locale, key, value) values
  ('es', 'shop.varietals.typica', 'Typica'),
  ('en', 'shop.varietals.typica', 'Typica'),
  ('de', 'shop.varietals.typica', 'Typica'),
  ('fr', 'shop.varietals.typica', 'Typica'),
  ('pt', 'shop.varietals.typica', 'Typica'),
  ('zh', 'shop.varietals.typica', '铁皮卡'),
  ('ja', 'shop.varietals.typica', 'ティピカ'),
  ('ko', 'shop.varietals.typica', '티피카'),
  ('es', 'shop.varietals.bourbon', 'Bourbon'),
  ('en', 'shop.varietals.bourbon', 'Bourbon'),
  ('de', 'shop.varietals.bourbon', 'Bourbon'),
  ('fr', 'shop.varietals.bourbon', 'Bourbon'),
  ('pt', 'shop.varietals.bourbon', 'Bourbon'),
  ('zh', 'shop.varietals.bourbon', '波旁'),
  ('ja', 'shop.varietals.bourbon', 'ブルボン'),
  ('ko', 'shop.varietals.bourbon', '버번'),
  ('es', 'shop.varietals.bourbon-rosado', 'Bourbon Rosado'),
  ('en', 'shop.varietals.bourbon-rosado', 'Pink Bourbon'),
  ('de', 'shop.varietals.bourbon-rosado', 'Pink Bourbon'),
  ('fr', 'shop.varietals.bourbon-rosado', 'Bourbon rose'),
  ('pt', 'shop.varietals.bourbon-rosado', 'Bourbon Rosa'),
  ('zh', 'shop.varietals.bourbon-rosado', '粉红波旁'),
  ('ja', 'shop.varietals.bourbon-rosado', 'ピンクブルボン'),
  ('ko', 'shop.varietals.bourbon-rosado', '핑크 버번'),
  ('es', 'shop.varietals.caturra', 'Caturra'),
  ('en', 'shop.varietals.caturra', 'Caturra'),
  ('de', 'shop.varietals.caturra', 'Caturra'),
  ('fr', 'shop.varietals.caturra', 'Caturra'),
  ('pt', 'shop.varietals.caturra', 'Caturra'),
  ('zh', 'shop.varietals.caturra', '卡杜拉'),
  ('ja', 'shop.varietals.caturra', 'カトゥーラ'),
  ('ko', 'shop.varietals.caturra', '카투라'),
  ('es', 'shop.varietals.catuai', 'Catuaí'),
  ('en', 'shop.varietals.catuai', 'Catuaí'),
  ('de', 'shop.varietals.catuai', 'Catuaí'),
  ('fr', 'shop.varietals.catuai', 'Catuaí'),
  ('pt', 'shop.varietals.catuai', 'Catuaí'),
  ('zh', 'shop.varietals.catuai', '卡杜艾'),
  ('ja', 'shop.varietals.catuai', 'カトゥアイ'),
  ('ko', 'shop.varietals.catuai', '카투아이'),
  ('es', 'shop.varietals.catimor', 'Catimor'),
  ('en', 'shop.varietals.catimor', 'Catimor'),
  ('de', 'shop.varietals.catimor', 'Catimor'),
  ('fr', 'shop.varietals.catimor', 'Catimor'),
  ('pt', 'shop.varietals.catimor', 'Catimor'),
  ('zh', 'shop.varietals.catimor', '卡蒂姆'),
  ('ja', 'shop.varietals.catimor', 'カティモール'),
  ('ko', 'shop.varietals.catimor', '카티모르'),
  ('es', 'shop.varietals.pache', 'Pache'),
  ('en', 'shop.varietals.pache', 'Pache'),
  ('de', 'shop.varietals.pache', 'Pache'),
  ('fr', 'shop.varietals.pache', 'Pache'),
  ('pt', 'shop.varietals.pache', 'Pache'),
  ('zh', 'shop.varietals.pache', '帕切'),
  ('ja', 'shop.varietals.pache', 'パチェ'),
  ('ko', 'shop.varietals.pache', '파체'),
  ('es', 'shop.varietals.geisha', 'Geisha'),
  ('en', 'shop.varietals.geisha', 'Geisha'),
  ('de', 'shop.varietals.geisha', 'Geisha'),
  ('fr', 'shop.varietals.geisha', 'Geisha'),
  ('pt', 'shop.varietals.geisha', 'Geisha'),
  ('zh', 'shop.varietals.geisha', '瑰夏'),
  ('ja', 'shop.varietals.geisha', 'ゲイシャ'),
  ('ko', 'shop.varietals.geisha', '게이샤'),
  ('es', 'shop.varietals.mundo-novo', 'Mundo Novo'),
  ('en', 'shop.varietals.mundo-novo', 'Mundo Novo'),
  ('de', 'shop.varietals.mundo-novo', 'Mundo Novo'),
  ('fr', 'shop.varietals.mundo-novo', 'Mundo Novo'),
  ('pt', 'shop.varietals.mundo-novo', 'Mundo Novo'),
  ('zh', 'shop.varietals.mundo-novo', '新世界'),
  ('ja', 'shop.varietals.mundo-novo', 'ムンドノーボ'),
  ('ko', 'shop.varietals.mundo-novo', '문도 노보'),
  ('es', 'shop.varietals.pacamara', 'Pacamara'),
  ('en', 'shop.varietals.pacamara', 'Pacamara'),
  ('de', 'shop.varietals.pacamara', 'Pacamara'),
  ('fr', 'shop.varietals.pacamara', 'Pacamara'),
  ('pt', 'shop.varietals.pacamara', 'Pacamara'),
  ('zh', 'shop.varietals.pacamara', '帕卡马拉'),
  ('ja', 'shop.varietals.pacamara', 'パカマラ'),
  ('ko', 'shop.varietals.pacamara', '파카마라'),
  ('es', 'shop.varietals.maragogipe', 'Maragogipe'),
  ('en', 'shop.varietals.maragogipe', 'Maragogipe'),
  ('de', 'shop.varietals.maragogipe', 'Maragogipe'),
  ('fr', 'shop.varietals.maragogipe', 'Maragogipe'),
  ('pt', 'shop.varietals.maragogipe', 'Maragogipe'),
  ('zh', 'shop.varietals.maragogipe', '象豆'),
  ('ja', 'shop.varietals.maragogipe', 'マラゴジッペ'),
  ('ko', 'shop.varietals.maragogipe', '마라고지페'),
  ('es', 'shop.varietals.castillo', 'Castillo'),
  ('en', 'shop.varietals.castillo', 'Castillo'),
  ('de', 'shop.varietals.castillo', 'Castillo'),
  ('fr', 'shop.varietals.castillo', 'Castillo'),
  ('pt', 'shop.varietals.castillo', 'Castillo'),
  ('zh', 'shop.varietals.castillo', '卡斯蒂略'),
  ('ja', 'shop.varietals.castillo', 'カスティージョ'),
  ('ko', 'shop.varietals.castillo', '카스티요'),
  ('es', 'shop.varietals.marsellesa', 'Marsellesa'),
  ('en', 'shop.varietals.marsellesa', 'Marsellesa'),
  ('de', 'shop.varietals.marsellesa', 'Marsellesa'),
  ('fr', 'shop.varietals.marsellesa', 'Marsellesa'),
  ('pt', 'shop.varietals.marsellesa', 'Marsellesa'),
  ('zh', 'shop.varietals.marsellesa', '马赛'),
  ('ja', 'shop.varietals.marsellesa', 'マルセジェサ'),
  ('ko', 'shop.varietals.marsellesa', '마르셀레사'),
  ('es', 'shop.varietals.costa-rica-95', 'Costa Rica 95'),
  ('en', 'shop.varietals.costa-rica-95', 'Costa Rica 95'),
  ('de', 'shop.varietals.costa-rica-95', 'Costa Rica 95'),
  ('fr', 'shop.varietals.costa-rica-95', 'Costa Rica 95'),
  ('pt', 'shop.varietals.costa-rica-95', 'Costa Rica 95'),
  ('zh', 'shop.varietals.costa-rica-95', '哥斯达黎加95'),
  ('ja', 'shop.varietals.costa-rica-95', 'コスタリカ95'),
  ('ko', 'shop.varietals.costa-rica-95', '코스타리카 95'),
  ('es', 'shop.varietals.sl28', 'SL28'),
  ('en', 'shop.varietals.sl28', 'SL28'),
  ('de', 'shop.varietals.sl28', 'SL28'),
  ('fr', 'shop.varietals.sl28', 'SL28'),
  ('pt', 'shop.varietals.sl28', 'SL28'),
  ('zh', 'shop.varietals.sl28', 'SL28'),
  ('ja', 'shop.varietals.sl28', 'SL28'),
  ('ko', 'shop.varietals.sl28', 'SL28')
on conflict (locale, key) do nothing;

insert into processes (id, sort) values
  ('lavado', 10),
  ('natural', 20),
  ('honey', 30),
  ('honey-amarillo', 40),
  ('honey-rojo', 50),
  ('honey-negro', 60),
  ('semi-lavado', 70),
  ('anaerobico', 80),
  ('maceracion-carbonica', 90),
  ('fermentacion-extendida', 100),
  ('infusionado', 110)
on conflict (id) do nothing;

insert into i18n_overrides (locale, key, value) values
  ('es', 'shop.processes.lavado', 'Lavado'),
  ('en', 'shop.processes.lavado', 'Washed'),
  ('de', 'shop.processes.lavado', 'Gewaschen'),
  ('fr', 'shop.processes.lavado', 'Lavé'),
  ('pt', 'shop.processes.lavado', 'Lavado'),
  ('zh', 'shop.processes.lavado', '水洗'),
  ('ja', 'shop.processes.lavado', 'ウォッシュト'),
  ('ko', 'shop.processes.lavado', '워시드'),
  ('es', 'shop.processes.natural', 'Natural'),
  ('en', 'shop.processes.natural', 'Natural'),
  ('de', 'shop.processes.natural', 'Natural'),
  ('fr', 'shop.processes.natural', 'Naturel'),
  ('pt', 'shop.processes.natural', 'Natural'),
  ('zh', 'shop.processes.natural', '日晒'),
  ('ja', 'shop.processes.natural', 'ナチュラル'),
  ('ko', 'shop.processes.natural', '내추럴'),
  ('es', 'shop.processes.honey', 'Honey'),
  ('en', 'shop.processes.honey', 'Honey'),
  ('de', 'shop.processes.honey', 'Honey'),
  ('fr', 'shop.processes.honey', 'Honey'),
  ('pt', 'shop.processes.honey', 'Honey'),
  ('zh', 'shop.processes.honey', '蜜处理'),
  ('ja', 'shop.processes.honey', 'ハニー'),
  ('ko', 'shop.processes.honey', '허니'),
  ('es', 'shop.processes.honey-amarillo', 'Honey amarillo'),
  ('en', 'shop.processes.honey-amarillo', 'Yellow Honey'),
  ('de', 'shop.processes.honey-amarillo', 'Yellow Honey'),
  ('fr', 'shop.processes.honey-amarillo', 'Honey jaune'),
  ('pt', 'shop.processes.honey-amarillo', 'Honey amarelo'),
  ('zh', 'shop.processes.honey-amarillo', '黄蜜'),
  ('ja', 'shop.processes.honey-amarillo', 'イエローハニー'),
  ('ko', 'shop.processes.honey-amarillo', '옐로 허니'),
  ('es', 'shop.processes.honey-rojo', 'Honey rojo'),
  ('en', 'shop.processes.honey-rojo', 'Red Honey'),
  ('de', 'shop.processes.honey-rojo', 'Red Honey'),
  ('fr', 'shop.processes.honey-rojo', 'Honey rouge'),
  ('pt', 'shop.processes.honey-rojo', 'Honey vermelho'),
  ('zh', 'shop.processes.honey-rojo', '红蜜'),
  ('ja', 'shop.processes.honey-rojo', 'レッドハニー'),
  ('ko', 'shop.processes.honey-rojo', '레드 허니'),
  ('es', 'shop.processes.honey-negro', 'Honey negro'),
  ('en', 'shop.processes.honey-negro', 'Black Honey'),
  ('de', 'shop.processes.honey-negro', 'Black Honey'),
  ('fr', 'shop.processes.honey-negro', 'Honey noir'),
  ('pt', 'shop.processes.honey-negro', 'Honey preto'),
  ('zh', 'shop.processes.honey-negro', '黑蜜'),
  ('ja', 'shop.processes.honey-negro', 'ブラックハニー'),
  ('ko', 'shop.processes.honey-negro', '블랙 허니'),
  ('es', 'shop.processes.semi-lavado', 'Semi lavado'),
  ('en', 'shop.processes.semi-lavado', 'Semi-washed'),
  ('de', 'shop.processes.semi-lavado', 'Halbgewaschen'),
  ('fr', 'shop.processes.semi-lavado', 'Semi-lavé'),
  ('pt', 'shop.processes.semi-lavado', 'Semi-lavado'),
  ('zh', 'shop.processes.semi-lavado', '半水洗'),
  ('ja', 'shop.processes.semi-lavado', 'セミウォッシュト'),
  ('ko', 'shop.processes.semi-lavado', '세미 워시드'),
  ('es', 'shop.processes.anaerobico', 'Anaeróbico'),
  ('en', 'shop.processes.anaerobico', 'Anaerobic'),
  ('de', 'shop.processes.anaerobico', 'Anaerob'),
  ('fr', 'shop.processes.anaerobico', 'Anaérobie'),
  ('pt', 'shop.processes.anaerobico', 'Anaeróbico'),
  ('zh', 'shop.processes.anaerobico', '厌氧'),
  ('ja', 'shop.processes.anaerobico', 'アナエロビック'),
  ('ko', 'shop.processes.anaerobico', '무산소 발효'),
  ('es', 'shop.processes.maceracion-carbonica', 'Maceración carbónica'),
  ('en', 'shop.processes.maceracion-carbonica', 'Carbonic Maceration'),
  ('de', 'shop.processes.maceracion-carbonica', 'Kohlensäuremaischung'),
  ('fr', 'shop.processes.maceracion-carbonica', 'Macération carbonique'),
  ('pt', 'shop.processes.maceracion-carbonica', 'Maceração carbônica'),
  ('zh', 'shop.processes.maceracion-carbonica', '二氧化碳浸渍'),
  ('ja', 'shop.processes.maceracion-carbonica', 'カーボニックマセレーション'),
  ('ko', 'shop.processes.maceracion-carbonica', '카보닉 매서레이션'),
  ('es', 'shop.processes.fermentacion-extendida', 'Fermentación extendida'),
  ('en', 'shop.processes.fermentacion-extendida', 'Extended Fermentation'),
  ('de', 'shop.processes.fermentacion-extendida', 'Verlängerte Fermentation'),
  ('fr', 'shop.processes.fermentacion-extendida', 'Fermentation prolongée'),
  ('pt', 'shop.processes.fermentacion-extendida', 'Fermentação prolongada'),
  ('zh', 'shop.processes.fermentacion-extendida', '延长发酵'),
  ('ja', 'shop.processes.fermentacion-extendida', '長時間発酵'),
  ('ko', 'shop.processes.fermentacion-extendida', '장시간 발효'),
  ('es', 'shop.processes.infusionado', 'Infusionado'),
  ('en', 'shop.processes.infusionado', 'Infused'),
  ('de', 'shop.processes.infusionado', 'Infundiert'),
  ('fr', 'shop.processes.infusionado', 'Infusé'),
  ('pt', 'shop.processes.infusionado', 'Infusionado'),
  ('zh', 'shop.processes.infusionado', '风味浸渍'),
  ('ja', 'shop.processes.infusionado', 'インフューズド'),
  ('ko', 'shop.processes.infusionado', '인퓨즈드')
on conflict (locale, key) do nothing;

-- >>> catálogo inicial (generado con: npm run schema:seed) >>>
-- Lo mismo que trae el código de la web, para que la base empiece completa.
-- Los nombres y descripciones siguen en messages/*.json (se editan en el
-- panel y se guardan en i18n_overrides).

-- Ediciones (4)
insert into editions (id, custom, active, color, panel_bg, panel_image, hero_text_color, heading_color, sort) values
  ('farmers', false, true, '#000000', '#F63049', '/images/hero/edicion_caficultor.webp', '#fff0b4', '#fff0b4', 0),
  ('women', false, true, '#ff0064', '#ff0064', '/images/hero/edicion_mujeres.webp', '#fff6cd', '#fff6cd', 10),
  ('classic', false, true, '#fcde81', '#FFC95F', '/images/hero/edicion_clasico.webp', '#00736B', '#00736B', 20),
  ('infused', false, true, '#ffd44e', '#FFB200', '/images/hero/edicion_infusionados.webp', '#FFFFFF', '#FFFFFF', 30)
on conflict (id) do nothing;

-- Cafés (8) · stock sin límite hasta que se ponga en el panel
insert into products (id, category_id, custom, active, prices, image, hover_image, card_bg, certifications, sort) values
  ('donEliseoFarm', 'farmers', false, true, '{"250g":60,"1kg":240}'::jsonb, '/images/products/031.webp', '/images/products/032.webp', null, '["fairtrade","usdaOrganic","cleanCup"]'::jsonb, 0),
  ('donEdwinFarm', 'farmers', false, true, '{"250g":60,"1kg":240}'::jsonb, '/images/products/010.webp', '/images/products/012.webp', null, '["fairtrade","usdaOrganic","cleanCup"]'::jsonb, 10),
  ('donOsmarFarm', 'farmers', false, true, '{"250g":60,"1kg":240}'::jsonb, '/images/products/021.webp', '/images/products/022.webp', null, '["fairtrade","usdaOrganic","cleanCup"]'::jsonb, 20),
  ('daughtersOfTheForest', 'women', false, true, '{"250g":60,"1kg":240}'::jsonb, '/images/products/071.webp', '/images/products/072.webp', null, '["fairtrade","usdaOrganic","cleanCup"]'::jsonb, 0),
  ('guardiansOfTheEarth', 'women', false, true, '{"250g":60,"1kg":240}'::jsonb, '/images/products/081.webp', '/images/products/082.webp', null, '["fairtrade","usdaOrganic","cleanCup"]'::jsonb, 10),
  ('morningClassic', 'classic', false, true, '{"250g":60,"1kg":240}'::jsonb, '/images/products/041.webp', '/images/products/042.webp', null, '["fairtrade","usdaOrganic","cleanCup"]'::jsonb, 0),
  ('vanilla-infused', 'infused', false, true, '{"250g":60,"1kg":240}'::jsonb, '/images/products/051.webp', '/images/products/052.webp', null, '[]'::jsonb, 0),
  ('guanabana-infused', 'infused', false, true, '{"250g":60,"1kg":240}'::jsonb, '/images/products/061.webp', '/images/products/062.webp', null, '[]'::jsonb, 10)
on conflict (id) do nothing;

-- Combos (4)
insert into combos (id, custom, active, discount, items, sort) values
  ('farmersTrio', false, true, 3, '[{"categoryId":"farmers","productId":"donEliseoFarm","size":"250g"},{"categoryId":"farmers","productId":"donEdwinFarm","size":"250g"},{"categoryId":"farmers","productId":"donOsmarFarm","size":"250g"}]'::jsonb, 0),
  ('discovery', false, true, 15, '[{"categoryId":"farmers","productId":"donEdwinFarm","size":"250g"},{"categoryId":"women","productId":"daughtersOfTheForest","size":"250g"},{"categoryId":"classic","productId":"morningClassic","size":"250g"},{"categoryId":"infused","productId":"vanilla-infused","size":"250g"}]'::jsonb, 10),
  ('womenDuo', false, true, 10, '[{"categoryId":"women","productId":"daughtersOfTheForest","size":"250g"},{"categoryId":"women","productId":"guardiansOfTheEarth","size":"250g"}]'::jsonb, 20),
  ('infusedDuo', false, true, 10, '[{"categoryId":"infused","productId":"vanilla-infused","size":"250g"},{"categoryId":"infused","productId":"guanabana-infused","size":"250g"}]'::jsonb, 30)
on conflict (id) do nothing;

-- Cupones (47)
insert into coupons (code, data) values
  ('GRAIN10', '{"code":"GRAIN10","reward":{"type":"percent","value":10},"note":"10% en toda la tienda"}'::jsonb),
  ('BIENVENIDO15', '{"code":"BIENVENIDO15","reward":{"type":"percent","value":15,"maxDiscount":40},"rules":{"minSubtotal":120}}'::jsonb),
  ('CAFICULTOR20', '{"code":"CAFICULTOR20","reward":{"type":"percent","value":20},"rules":{"editions":["farmers"],"excludeCombos":true}}'::jsonb),
  ('CLASICOS12', '{"code":"CLASICOS12","reward":{"type":"percent","value":12},"rules":{"excludeEditions":["infused"]}}'::jsonb),
  ('COMBO10', '{"code":"COMBO10","reward":{"type":"percent","value":10},"rules":{"onlyCombos":true}}'::jsonb),
  ('PRUEBA30', '{"code":"PRUEBA30","reward":{"type":"percent","value":30},"rules":{"maxSubtotal":150,"maxQty":2}}'::jsonb),
  ('GRANO15', '{"code":"GRANO15","reward":{"type":"percent","value":15},"rules":{"grinds":["wholeBean"]}}'::jsonb),
  ('TRES20', '{"code":"TRES20","reward":{"type":"percent","value":20},"rules":{"maxDiscountedUnits":3},"note":"20% en máximo 3 bolsas"}'::jsonb),
  ('VARIEDAD12', '{"code":"VARIEDAD12","reward":{"type":"percent","value":12},"rules":{"minDistinct":3}}'::jsonb),
  ('AMIGOS10', '{"code":"AMIGOS10","reward":{"type":"percent","value":10},"rules":{"excludeCustomers":{"emails":[],"domains":["grainngrains.org"],"documents":[]}},"note":"Para todos menos el equipo"}'::jsonb),
  ('CONSUMIDOR8', '{"code":"CONSUMIDOR8","reward":{"type":"percent","value":8},"rules":{"consumerOnly":true}}'::jsonb),
  ('WELCOME10', '{"code":"WELCOME10","reward":{"type":"percent","value":10},"rules":{"locales":["en","de","fr","pt","zh","ja","ko"]},"note":"Para quien compra desde la web en otro idioma"}'::jsonb),
  ('MENOS20', '{"code":"MENOS20","reward":{"type":"fixed","value":20},"rules":{"minSubtotal":150}}'::jsonb),
  ('CADA100', '{"code":"CADA100","reward":{"type":"fixedPer","value":10,"every":100},"note":"S/ 10 por cada S/ 100"}'::jsonb),
  ('PAREJA15', '{"code":"PAREJA15","reward":{"type":"fixed","value":15},"rules":{"requireProducts":["daughtersOfTheForest","guardiansOfTheEarth"]}}'::jsonb),
  ('KILO200', '{"code":"KILO200","reward":{"type":"fixedPrice","price":200},"rules":{"sizes":["1kg"]}}'::jsonb),
  ('CUARTOGRATIS', '{"code":"CUARTOGRATIS","reward":{"type":"percentItem","value":100,"target":"cheapest"},"rules":{"minQty":4,"excludeCombos":true}}'::jsonb),
  ('MUJERES3X2', '{"code":"MUJERES3X2","reward":{"type":"buyXgetY","buy":2,"get":1},"rules":{"editions":["women"]}}'::jsonb),
  ('SEGUNDO50', '{"code":"SEGUNDO50","reward":{"type":"buyXgetY","buy":1,"get":1,"discount":50}}'::jsonb),
  ('DOSELISEO', '{"code":"DOSELISEO","reward":{"type":"gift","categoryId":"infused","productId":"vanilla-infused","size":"250g","grind":"wholeBean","qty":1},"rules":{"requireQty":{"donEliseoFarm":2}},"note":"Lleva 2 Don Eliseo y te regalamos un Experimental de Vainilla"}'::jsonb),
  ('REGALO', '{"code":"REGALO","reward":{"type":"gift","categoryId":"classic","productId":"morningClassic","size":"250g","grind":"wholeBean","qty":1},"rules":{"minSubtotal":200}}'::jsonb),
  ('ENVIOGRATIS', '{"code":"ENVIOGRATIS","reward":{"type":"freeShipping"},"rules":{"minQty":2,"zones":["lima"]}}'::jsonb),
  ('PROVINCIA5', '{"code":"PROVINCIA5","reward":{"type":"shippingDiscount","value":5},"rules":{"zones":["provinces"]}}'::jsonb),
  ('AREQUIPA', '{"code":"AREQUIPA","reward":{"type":"freeShipping"},"rules":{"departments":["Arequipa"]}}'::jsonb),
  ('ENVIO5', '{"code":"ENVIO5","reward":{"type":"shippingFixed","price":5},"rules":{"zones":["provinces"]},"note":"Envío a provincias a S/ 5"}'::jsonb),
  ('MITADENVIO', '{"code":"MITADENVIO","reward":{"type":"shippingPercent","value":50}}'::jsonb),
  ('ENVIOSELVA', '{"code":"ENVIOSELVA","reward":{"type":"freeShipping"},"rules":{"minSubtotal":180,"excludeDepartments":["Loreto","Madre de Dios","Ucayali"]}}'::jsonb),
  ('MAYORISTA', '{"code":"MAYORISTA","reward":{"type":"tiered","by":"qty","tiers":[{"min":1,"percent":15},{"min":20,"percent":20},{"min":50,"percent":25}]},"rules":{"wholesale":true,"sizes":["1kg"],"excludeCombos":true}}'::jsonb),
  ('ESCALA', '{"code":"ESCALA","reward":{"type":"tiered","by":"amount","tiers":[{"min":200,"percent":5},{"min":400,"percent":10},{"min":800,"percent":15}]}}'::jsonb),
  ('CORPORATIVO', '{"code":"CORPORATIVO","reward":{"type":"percent","value":18},"rules":{"customers":{"emails":[],"domains":["empresa-aliada.com"],"documents":[]}},"note":"Cambia el dominio por el de la empresa real"}'::jsonb),
  ('DISTRIBUIDOR', '{"code":"DISTRIBUIDOR","reward":{"type":"fixedPrice","price":190},"rules":{"wholesale":true,"sizes":["1kg"],"customers":{"emails":[],"domains":[],"documents":["20000000001"]}},"note":"Pon los RUC reales de tus distribuidores"}'::jsonb),
  ('NOVEDADES7', '{"code":"NOVEDADES7","reward":{"type":"percent","value":7},"rules":{"newsletter":true}}'::jsonb),
  ('YAPE5', '{"code":"YAPE5","reward":{"type":"percent","value":5},"rules":{"paymentMethods":["wallet"]}}'::jsonb),
  ('NAVIDAD25', '{"code":"NAVIDAD25","reward":{"type":"percent","value":25},"rules":{"validFrom":"2026-12-01","validUntil":"2026-12-31"}}'::jsonb),
  ('FINDE10', '{"code":"FINDE10","reward":{"type":"percent","value":10},"rules":{"daysOfWeek":[5,6,0]}}'::jsonb),
  ('MADRUGADOR', '{"code":"MADRUGADOR","reward":{"type":"percent","value":8},"rules":{"hours":{"from":"06:00","to":"10:00"}}}'::jsonb),
  ('NOCTURNO', '{"code":"NOCTURNO","reward":{"type":"percent","value":7},"rules":{"hours":{"from":"22:00","to":"02:00"}}}'::jsonb),
  ('FIESTASPATRIAS', '{"code":"FIESTASPATRIAS","reward":{"type":"percent","value":28},"rules":{"dates":["2027-07-28","2027-07-29"]}}'::jsonb),
  ('QUINCENA', '{"code":"QUINCENA","reward":{"type":"percent","value":10},"rules":{"monthDays":[15,-1]}}'::jsonb),
  ('BLACKFRIDAY', '{"code":"BLACKFRIDAY","reward":{"type":"percent","value":30},"rules":{"validFrom":"2026-11-27 00:00","validUntil":"2026-11-27 23:59","maxDiscount":100},"exclusive":true,"note":"Solo ese día, máximo S/ 100, no se combina con nada"}'::jsonb),
  ('PRIMERA10', '{"code":"PRIMERA10","reward":{"type":"percent","value":10},"rules":{"firstPurchase":true}}'::jsonb),
  ('LANZAMIENTO', '{"code":"LANZAMIENTO","reward":{"type":"percent","value":20},"rules":{"maxUses":100,"maxUsesPerCustomer":1}}'::jsonb),
  ('FIEL15', '{"code":"FIEL15","reward":{"type":"percent","value":15},"rules":{"minPreviousOrders":3}}'::jsonb),
  ('DIARIO12', '{"code":"DIARIO12","reward":{"type":"percent","value":12},"rules":{"maxUsesPerDay":20}}'::jsonb),
  ('INFLUENCER15', '{"code":"INFLUENCER15","reward":{"type":"percent","value":15},"rules":{"budget":1500,"maxUsesPerCustomer":1},"aliases":["ANA15","LUIS15"],"note":"Códigos de influencers; se corta al regalar S/ 1 500"}'::jsonb),
  ('PROMO-PROVINCIAS', '{"code":"PROMO-PROVINCIAS","reward":{"type":"freeShipping"},"rules":{"zones":["provinces"],"minSubtotal":250},"autoApply":true,"stackable":true,"active":false}'::jsonb),
  ('PROMO-500', '{"code":"PROMO-500","reward":{"type":"gift","categoryId":"classic","productId":"morningClassic","size":"250g","grind":"wholeBean","qty":1},"rules":{"minSubtotal":500},"autoApply":true,"stackable":true,"active":false}'::jsonb)
on conflict (code) do nothing;

-- Ajustes: envíos, contacto, modal de promoción y presentaciones extra
insert into settings (key, value) values
  ('shop', '{"freeShippingFrom":150,"rates":{"lima":10,"provinces":20},"days":{"lima":{"min":1,"max":3},"provinces":{"min":3,"max":7}}}'::jsonb),
  ('contact', '{"phone":"+51 927 645 665","whatsapp":"51927645665","email":"tradingna@grainngrains.org"}'::jsonb),
  ('promo', '{"code":"GRAIN10","enabled":true}'::jsonb),
  ('sizes', '[]'::jsonb)
on conflict (key) do nothing;
-- <<< catálogo inicial <<<
