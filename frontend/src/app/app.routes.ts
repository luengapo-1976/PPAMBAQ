import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { ParticipanteShell } from './layout/participante-shell/participante-shell';
import { authGuard, guestGuard, usuarioAreaGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
    title: 'Iniciar sesión · PPAM BAQ',
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: ParticipanteShell,
    canActivate: [authGuard],
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
        title: 'Inicio · PPAM BAQ',
        data: { title: 'Inicio' },
      },
      {
        path: 'solicitar-turno',
        loadComponent: () => import('./features/solicitar-turno/solicitar-turno').then((m) => m.SolicitarTurno),
        title: 'Solicitar turno · PPAM BAQ',
        data: { title: 'Solicitar turno' },
      },
      {
        path: 'devolver-turno',
        loadComponent: () => import('./features/devolver-turno/devolver-turno').then((m) => m.DevolverTurno),
        title: 'Devolver turno · PPAM BAQ',
        data: { title: 'Devolver turno' },
      },
      {
        path: 'reportar-actividad',
        loadComponent: () =>
          import('./features/reportar-actividad/reportar-actividad').then((m) => m.ReportarActividad),
        title: 'Reportar actividad del turno · PPAM BAQ',
        data: { title: 'Reportar actividad del turno' },
      },
      {
        path: 'actualizar-datos',
        loadComponent: () => import('./features/actualizar-datos/actualizar-datos').then((m) => m.ActualizarDatos),
        title: 'Actualizar datos · PPAM BAQ',
        data: { title: 'Actualizar datos' },
      },
      {
        path: 'noticias/:id',
        loadComponent: () => import('./features/noticia-detalle/noticia-detalle').then((m) => m.NoticiaDetalle),
        title: 'Noticia · PPAM BAQ',
        data: { title: 'Noticia' },
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
      },
    ],
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
        path: 'casos-por-validar',
        loadComponent: () =>
          import('./features/casos-por-validar/casos-por-validar').then((m) => m.CasosPorValidar),
        title: 'Casos por validar · PPAM BAQ',
        data: { title: 'Casos por validar' },
      },
      {
        path: 'gestion-noticias',
        loadComponent: () => import('./features/gestion-noticias/gestion-noticias').then((m) => m.GestionNoticias),
        title: 'Noticias · PPAM BAQ',
        data: { title: 'Noticias' },
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
