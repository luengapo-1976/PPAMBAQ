import { NavItem } from '../shared/models/nav-item.model';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  {
    label: 'Solicitudes y turnos',
    icon: 'event_note',
    children: [
      { label: 'Gestión de solicitudes', icon: 'assignment', route: '/solicitudes' },
      { label: 'Casos por validar', icon: 'fact_check', route: '/casos-por-validar' },
      { label: 'Confirmar asistencia', icon: 'how_to_reg', route: '/confirmar-asistencia' },
      { label: 'Asignar turno', icon: 'event_available', route: '/admin-asignar-turno' },
      { label: 'Retirar turno', icon: 'event_busy', route: '/admin-retirar-turno' },
      { label: 'Informe de turno', icon: 'post_add', route: '/admin-informe-turno' },
    ],
  },
  {
    label: 'Página de inicio',
    icon: 'web',
    children: [
      { label: 'Banners', icon: 'view_carousel', route: '/gestion-banners' },
      { label: 'Noticias', icon: 'campaign', route: '/gestion-noticias' },
      { label: 'Capacitación', icon: 'school', route: '/gestion-capacitaciones' },
    ],
  },
  {
    label: 'Datos maestros',
    icon: 'storage',
    adminOnly: true,
    children: [
      { label: 'Puntos', icon: 'place', route: '/configuracion/puntos' },
      { label: 'Circuitos', icon: 'alt_route', route: '/configuracion/circuitos' },
      { label: 'Congregaciones', icon: 'groups', route: '/configuracion/congregaciones' },
      { label: 'Municipios', icon: 'location_city', route: '/configuracion/municipios' },
      { label: 'Departamentos', icon: 'map', route: '/configuracion/departamentos' },
      { label: 'Mensajes', icon: 'mail', route: '/configuracion/mensajes' },
    ],
  },
  {
    label: 'Configuración',
    icon: 'settings',
    adminOnly: true,
    children: [
      { label: 'Usuarios', icon: 'group', route: '/configuracion/usuarios' },
      { label: 'Parámetros', icon: 'tune', route: '/configuracion/parametros' },
      { label: 'Textos legales', icon: 'gavel', route: '/configuracion/textos-legales' },
    ],
  },
  { label: 'Salir', icon: 'logout', action: 'logout' },
];
