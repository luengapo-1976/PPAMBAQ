-- Solo necesario si ya ejecutaste create_actividad_reportada.sql antes de que se
-- agregara la columna "fecha_actividad" a ese script. Si vas a crear la tabla desde
-- cero, usa directamente create_actividad_reportada.sql (ya la incluye) y omite
-- este archivo.
alter table public.actividad_reportada
  add column if not exists fecha_actividad date not null default '2000-01-01';

alter table public.actividad_reportada
  alter column fecha_actividad drop default;
