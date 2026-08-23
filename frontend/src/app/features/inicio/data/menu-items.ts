export interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  /** Acción sensible (ej. baja del programa): se separa visualmente del resto del menú. */
  sensitive?: boolean;
}

export const PARTICIPANTE_MENU_ITEMS: MenuItem[] = [
  {
    id: 'solicitar-turno',
    title: 'Solicitar turno',
    description: 'Elige fecha y punto para tu próximo turno de servicio.',
    icon: 'event_available',
    route: '/solicitar-turno',
  },
  {
    id: 'devolver-turno',
    title: 'Devolver turno',
    description: 'Notifica que devuelves un turno que ya tenías asignado.',
    icon: 'assignment_return',
    route: '/devolver-turno',
  },
  {
    id: 'reportar-actividad',
    title: 'Reportar actividad del turno',
    description: 'Registra lo realizado durante tu turno de servicio.',
    icon: 'fact_check',
    route: '/reportar-actividad',
  },
  {
    id: 'actualizar-datos',
    title: 'Actualizar datos',
    description: 'Revisa y actualiza tu información personal.',
    icon: 'manage_accounts',
    route: '/actualizar-datos',
  },
  {
    id: 'consultar-turnos',
    title: 'Consultar turnos actuales',
    description: 'Consulta tus próximos turnos programados.',
    icon: 'calendar_month',
    route: '/mis-turnos',
  },
  {
    id: 'solicitar-baja',
    title: 'Solicitar la baja',
    description: 'Solicita darte de baja del programa de servicio.',
    icon: 'person_remove',
    route: '/solicitar-baja',
    sensitive: true,
  },
];
