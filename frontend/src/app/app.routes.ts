import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { authGuard, guestGuard, usuarioAreaGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
    title: 'Iniciar sesión · PPAM BAQ',
    canActivate: [guestGuard],
  },
  {
    path: 'inicio',
    loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
    title: 'Inicio · PPAM BAQ',
    canActivate: [authGuard],
  },
  {
    path: 'solicitar-turno',
    loadComponent: () => import('./features/solicitar-turno/solicitar-turno').then((m) => m.SolicitarTurno),
    title: 'Solicitar turno · PPAM BAQ',
    canActivate: [authGuard],
  },
  {
    path: 'devolver-turno',
    loadComponent: () => import('./features/proximamente/proximamente').then((m) => m.Proximamente),
    title: 'Devolver turno · PPAM BAQ',
    data: {
      title: 'Devolver turno',
      icon: 'assignment_return',
      description: 'Muy pronto podrás notificar la devolución de un turno ya asignado desde aquí.',
    },
    canActivate: [authGuard],
  },
  {
    path: 'reportar-actividad',
    loadComponent: () => import('./features/proximamente/proximamente').then((m) => m.Proximamente),
    title: 'Reportar actividad del turno · PPAM BAQ',
    data: {
      title: 'Reportar actividad del turno',
      icon: 'fact_check',
      description: 'Muy pronto podrás registrar lo realizado durante tu turno de servicio desde aquí.',
    },
    canActivate: [authGuard],
  },
  {
    path: 'actualizar-datos',
    loadComponent: () => import('./features/proximamente/proximamente').then((m) => m.Proximamente),
    title: 'Actualizar datos · PPAM BAQ',
    data: {
      title: 'Actualizar datos',
      icon: 'manage_accounts',
      description: 'Muy pronto podrás revisar y actualizar tu información personal desde aquí.',
    },
    canActivate: [authGuard],
  },
  {
    path: 'mis-turnos',
    loadComponent: () => import('./features/proximamente/proximamente').then((m) => m.Proximamente),
    title: 'Consultar turnos actuales · PPAM BAQ',
    data: {
      title: 'Consultar turnos actuales',
      icon: 'calendar_month',
      description: 'Muy pronto podrás consultar tus próximos turnos programados desde aquí.',
    },
    canActivate: [authGuard],
  },
  {
    path: 'solicitar-baja',
    loadComponent: () => import('./features/proximamente/proximamente').then((m) => m.Proximamente),
    title: 'Solicitar la baja · PPAM BAQ',
    data: {
      title: 'Solicitar la baja',
      icon: 'person_remove',
      description: 'Muy pronto podrás solicitar tu baja del programa de servicio desde aquí.',
    },
    canActivate: [authGuard],
  },
  {
    path: '',
    component: Shell,
    canActivate: [usuarioAreaGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard · PPAM BAQ',
        data: { title: 'Dashboard' },
      },
      {
        path: 'solicitudes',
        loadComponent: () => import('./features/solicitudes/solicitudes').then((m) => m.Solicitudes),
        title: 'Gestión de solicitudes · PPAM BAQ',
        data: { title: 'Gestión de solicitudes' },
      },
      {
        path: 'confirmar-asistencia',
        loadComponent: () =>
          import('./features/confirmar-asistencia/confirmar-asistencia').then((m) => m.ConfirmarAsistencia),
        title: 'Confirmar asistencia · PPAM BAQ',
        data: { title: 'Confirmar asistencia' },
      },
      {
        path: 'configuracion/circuitos',
        loadComponent: () => import('./features/configuracion/circuitos/circuitos').then((m) => m.Circuitos),
        title: 'Circuitos · PPAM BAQ',
        data: { title: 'Circuitos' },
      },
      {
        path: 'configuracion/congregaciones',
        loadComponent: () =>
          import('./features/configuracion/congregaciones/congregaciones').then((m) => m.Congregaciones),
        title: 'Congregaciones · PPAM BAQ',
        data: { title: 'Congregaciones' },
      },
      {
        path: 'configuracion/departamentos',
        loadComponent: () =>
          import('./features/configuracion/departamentos/departamentos').then((m) => m.Departamentos),
        title: 'Departamentos · PPAM BAQ',
        data: { title: 'Departamentos' },
      },
      {
        path: 'configuracion/municipios',
        loadComponent: () => import('./features/configuracion/municipios/municipios').then((m) => m.Municipios),
        title: 'Municipios · PPAM BAQ',
        data: { title: 'Municipios' },
      },
      {
        path: 'configuracion/mensajes',
        loadComponent: () => import('./features/mensajes/mensajes').then((m) => m.Mensajes),
        title: 'Mensajes · PPAM BAQ',
        data: { title: 'Mensajes' },
      },
      {
        path: 'configuracion/usuarios',
        loadComponent: () => import('./features/configuracion/usuarios/usuarios').then((m) => m.Usuarios),
        title: 'Usuarios · PPAM BAQ',
        data: { title: 'Usuarios' },
      },
      {
        path: 'configuracion/puntos',
        loadComponent: () => import('./features/configuracion/puntos/puntos').then((m) => m.Puntos),
        title: 'Puntos · PPAM BAQ',
        data: { title: 'Puntos' },
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
