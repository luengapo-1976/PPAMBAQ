create table public.noticias (
  id uuid primary key default gen_random_uuid(),
  titulo character varying not null,
  resumen character varying(300) not null,
  contenido text not null,
  imagen_url text,
  estado character varying not null default 'BORRADOR'::character varying,
  fecha_publicacion date,
  usuario_registra character varying,
  fecha_registro date,
  usuario_modifica character varying,
  fecha_modificacion date
);

alter table public.noticias enable row level security;
