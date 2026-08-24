alter table public.publicadores_retirados
  add column valida_retiro character varying,
  add column observaciones_retiro text,
  add column fecha_validacion_retiro date;
