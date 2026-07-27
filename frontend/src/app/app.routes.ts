import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
    title: 'Iniciar sesión · PPAM BAQ',
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
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
