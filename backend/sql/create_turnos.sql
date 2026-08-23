create table public.turnos (
  id uuid primary key default gen_random_uuid(),
  codigo_punto integer not null references public.puntos (codigo_punto),
  dia_numero integer not null,
  dia_nombre varchar(20) not null,
  hora_inicio time without time zone not null,
  hora_fin time without time zone not null,
  id_publicador uuid references public.publicadores (id),
  observaciones text,
  usuario_registra varchar(40),
  fecha_registro date,
  usuario_modifica varchar(40),
  fecha_modificacion date
);

alter table public.turnos enable row level security;
