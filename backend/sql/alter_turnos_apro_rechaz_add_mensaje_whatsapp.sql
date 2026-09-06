alter table public.turnos_apro_rechaz
  add column mensaje_whatsapp_enviado boolean not null default false,
  add column fecha_mensaje_whatsapp date;
