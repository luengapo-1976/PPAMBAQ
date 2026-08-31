export interface MenuItem {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  icon: string;
  route: string;
}

export const PARTICIPANTE_MENU_ITEMS: MenuItem[] = [
  {
    id: 'solicitar-turno',
    eyebrow: 'Turnos disponibles',
    title: 'Solicitar turno',
    description: 'Si deseas ampliar tu participación, revisa los turnos disponibles y solicítalo.',
    cta: 'Solicitar turno',
    icon: 'event_available',
    route: '/solicitar-turno',
  },
  {
    id: 'devolver-turno',
    eyebrow: 'Cambio de circunstancias',
    title: 'Devolver turno',
    description:
      'Si ya no puedes seguir atendiendo tu turno, cédelo a otro voluntario que lo necesite.',
    cta: 'Entregar turno',
    icon: 'assignment_return',
    route: '/devolver-turno',
  },
  {
    id: 'reportar-actividad',
    eyebrow: 'Informe del turno',
    title: 'Reportar actividad del turno',
    description:
      'Cada vez que termines tu servicio, reporta tu actividad para nuestros informes mensuales.',
    cta: 'Reportar turno',
    icon: 'fact_check',
    route: '/reportar-actividad',
  },
  {
    id: 'actualizar-datos',
    eyebrow: 'Tus datos al día',
    title: 'Actualizar datos',
    description:
      'Mantén tu información personal al día para que podamos contactarte cuando haga falta.',
    cta: 'Actualizar datos',
    icon: 'manage_accounts',
    route: '/actualizar-datos',
  },
];
