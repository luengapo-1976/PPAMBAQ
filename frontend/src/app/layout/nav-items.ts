import { NavItem } from '../shared/models/nav-item.model';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  { label: 'Gestión de solicitudes', icon: 'assignment', route: '/solicitudes' },
  { label: 'Confirmar asistencia', icon: 'how_to_reg', route: '/confirmar-asistencia' },
  {
    label: 'Configuración',
    icon: 'settings',
    adminOnly: true,
    children: [
      { label: 'Circuitos', icon: 'alt_route', route: '/configuracion/circuitos' },
      { label: 'Congregaciones', icon: 'groups', route: '/configuracion/congregaciones' },
      { label: 'Departamentos', icon: 'map', route: '/configuracion/departamentos' },
      { label: 'Municipios', icon: 'location_city', route: '/configuracion/municipios' },
      { label: 'Mensajes', icon: 'mail', route: '/configuracion/mensajes' },
      { label: 'Usuarios', icon: 'group', route: '/configuracion/usuarios' },
      { label: 'Puntos', icon: 'place', route: '/configuracion/puntos' },
    ],
  },
  { label: 'Salir', icon: 'logout', action: 'logout' },
];
