create table public.actividad_reportada (
  id uuid primary key default gen_random_uuid(),
  id_turno uuid not null references public.turnos (id),
  fecha_actividad date not null,
  cumplio_turno varchar(2),
  inicio_conversacion varchar(2),
  arreglos_curso varchar(2),
  observaciones text,
  usuario_registra varchar(40),
  fecha_registro date,
  usuario_modifica varchar(40),
  fecha_modificacion date
);

alter table public.actividad_reportada enable row level security;
