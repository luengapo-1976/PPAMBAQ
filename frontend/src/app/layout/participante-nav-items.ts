export interface ParticipanteNavItem {
  id: string;
  label: string;
  route: string;
  icon: string;
}

/** Los 5 destinos son pares entre sí (no hay jerarquía push/pop entre ellos), por
 * lo que cualquiera de ellos sirve como forma de "navegar" a los demás. Fuente
 * única para el tab bar móvil (ParticipanteTabbar) y la franja de navegación del
 * header de tablet/desktop (ParticipanteDesktopHeader), para que los mismos 5
 * destinos se vean siempre igual (mismo ícono, mismo orden) en ambos lugares. */
export const PARTICIPANTE_NAV_ITEMS: ParticipanteNavItem[] = [
  { id: 'inicio', label: 'Inicio', route: '/inicio', icon: 'home' },
  { id: 'solicitar', label: 'Solicitar', route: '/solicitar-turno', icon: 'event_available' },
  { id: 'devolver', label: 'Devolver', route: '/devolver-turno', icon: 'assignment_return' },
  { id: 'actividad', label: 'Actividad', route: '/reportar-actividad', icon: 'fact_check' },
  { id: 'mis-datos', label: 'Mis datos', route: '/actualizar-datos', icon: 'manage_accounts' },
];
