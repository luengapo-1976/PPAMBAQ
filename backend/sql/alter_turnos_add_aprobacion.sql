alter table public.turnos
  add column aprobado_por character varying,
  add column justificacion_aprobacion text,
  add column fecha_aprobacion date;
