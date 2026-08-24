-- Solo necesario si ya ejecutaste create_turnos_entregados.sql antes de que se
-- agregara la columna "motivo" a ese script. Si vas a crear la tabla desde cero,
-- usa directamente create_turnos_entregados.sql (ya la incluye) y omite este archivo.
alter table public.turnos_entregados
  add column if not exists motivo varchar(200) not null default 'Sin especificar';

alter table public.turnos_entregados
  alter column motivo drop default;
