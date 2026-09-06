import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { ParticipanteShell } from './layout/participante-shell/participante-shell';
import {
  aceptacionLegalGuard,
  authGuard,
  datosActualizacionGuard,
  guestGuard,
  usuarioAreaGuard,
} from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
    title: 'Iniciar sesión · PPAM BAQ',
    canActivate: [guestGuard],
  },
  {
    path: 'aviso-tratamiento-datos',
    loadComponent: () =>
      import('./features/aviso-tratamiento-datos/aviso-tratamiento-datos').then(
        (m) => m.AvisoTratamientoDatos,
      ),
    title: 'Autorización de tratamiento de datos · PPAM BAQ',
    canActivate: [authGuard],
  },
  {
    path: 'aviso-actualizacion-datos',
    loadComponent: () =>
      import('./features/aviso-actualizacion-datos/aviso-actualizacion-datos').then(
        (m) => m.AvisoActualizacionDatos,
      ),
    title: 'Actualiza tus datos · PPAM BAQ',
    canActivate: [authGuard],
  },
  {
    path: '',
    component: ParticipanteShell,
    canActivate: [authGuard],
    canActivateChild: [aceptacionLegalGuard, datosActualizacionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
        title: 'Inicio · PPAM BAQ',
        data: { title: 'Inicio' },
      },
      {
        path: 'solicitar-turno',
        loadComponent: () =>
          import('./features/solicitar-turno/solicitar-turno').then((m) => m.SolicitarTurno),
        title: 'Solicitar turno · PPAM BAQ',
        data: { title: 'Solicitar turno' },
      },
      {
        path: 'devolver-turno',
        loadComponent: () =>
          import('./features/devolver-turno/devolver-turno').then((m) => m.DevolverTurno),
        title: 'Devolver turno · PPAM BAQ',
        data: { title: 'Devolver turno' },
      },
      {
        path: 'reportar-actividad',
        loadComponent: () =>
          import('./features/reportar-actividad/reportar-actividad').then(
            (m) => m.ReportarActividad,
          ),
        title: 'Reportar actividad del turno · PPAM BAQ',
        data: { title: 'Reportar actividad del turno' },
      },
      {
        path: 'actualizar-datos',
        loadComponent: () =>
          import('./features/actualizar-datos/actualizar-datos').then((m) => m.ActualizarDatos),
        title: 'Actualizar datos · PPAM BAQ',
        data: { title: 'Actualizar datos' },
      },
      {
        path: 'noticias/:id',
        loadComponent: () =>
          import('./features/noticia-detalle/noticia-detalle').then((m) => m.NoticiaDetalle),
        title: 'Noticia · PPAM BAQ',
        data: { title: 'Noticia' },
      },
      {
        path: 'capacitaciones/:id',
        loadComponent: () =>
          import('./features/capacitacion-detalle/capacitacion-detalle').then(
            (m) => m.CapacitacionDetalle,
          ),
        title: 'Capacitación · PPAM BAQ',
        data: { title: 'Capacitación' },
      },
      {
        path: 'mis-turnos',
        loadComponent: () =>
          import('./features/proximamente/proximamente').then((m) => m.Proximamente),
        title: 'Consultar turnos actuales · PPAM BAQ',
        data: {
          title: 'Consultar turnos actuales',
          icon: 'calendar_month',
          description: 'Muy pronto podrás consultar tus próximos turnos programados desde aquí.',
        },
      },
      {
        path: 'solicitar-baja',
        loadComponent: () =>
          import('./features/proximamente/proximamente').then((m) => m.Proximamente),
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
        loadComponent: () =>
          import('./features/solicitudes/solicitudes').then((m) => m.Solicitudes),
        title: 'Gestión de solicitudes · PPAM BAQ',
        data: { title: 'Gestión de solicitudes' },
      },
      {
        path: 'confirmar-asistencia',
        loadComponent: () =>
          import('./features/confirmar-asistencia/confirmar-asistencia').then(
            (m) => m.ConfirmarAsistencia,
          ),
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
        path: 'admin-asignar-turno',
        loadComponent: () =>
          import('./features/admin-asignar-turno/admin-asignar-turno').then(
            (m) => m.AdminAsignarTurno,
          ),
        title: 'Asignar turno · PPAM BAQ',
        data: { title: 'Asignar turno' },
      },
      {
        path: 'admin-retirar-turno',
        loadComponent: () =>
          import('./features/admin-retirar-turno/admin-retirar-turno').then(
            (m) => m.AdminRetirarTurno,
          ),
        title: 'Retirar turno · PPAM BAQ',
        data: { title: 'Retirar turno' },
      },
      {
        path: 'admin-informe-turno',
        loadComponent: () =>
          import('./features/admin-informe-turno/admin-informe-turno').then(
            (m) => m.AdminInformeTurno,
          ),
        title: 'Informe de turno · PPAM BAQ',
        data: { title: 'Informe de turno' },
      },
      {
        path: 'admin-retirar-ppam',
        loadComponent: () =>
          import('./features/admin-retirar-ppam/admin-retirar-ppam').then(
            (m) => m.AdminRetirarPpam,
          ),
        title: 'Retirar de la PPAM · PPAM BAQ',
        data: { title: 'Retirar de la PPAM' },
      },
      {
        path: 'gestion-noticias',
        loadComponent: () =>
          import('./features/gestion-noticias/gestion-noticias').then((m) => m.GestionNoticias),
        title: 'Noticias · PPAM BAQ',
        data: { title: 'Noticias' },
      },
      {
        path: 'gestion-banners',
        loadComponent: () =>
          import('./features/gestion-banners/gestion-banners').then((m) => m.GestionBanners),
        title: 'Banners · PPAM BAQ',
        data: { title: 'Banners' },
      },
      {
        path: 'gestion-capacitaciones',
        loadComponent: () =>
          import('./features/gestion-capacitaciones/gestion-capacitaciones').then(
            (m) => m.GestionCapacitaciones,
          ),
        title: 'Capacitación · PPAM BAQ',
        data: { title: 'Capacitación' },
      },
      {
        path: 'configuracion/circuitos',
        loadComponent: () =>
          import('./features/configuracion/circuitos/circuitos').then((m) => m.Circuitos),
        title: 'Circuitos · PPAM BAQ',
        data: { title: 'Circuitos' },
      },
      {
        path: 'configuracion/congregaciones',
        loadComponent: () =>
          import('./features/configuracion/congregaciones/congregaciones').then(
            (m) => m.Congregaciones,
          ),
        title: 'Congregaciones · PPAM BAQ',
        data: { title: 'Congregaciones' },
      },
      {
        path: 'configuracion/departamentos',
        loadComponent: () =>
          import('./features/configuracion/departamentos/departamentos').then(
            (m) => m.Departamentos,
          ),
        title: 'Departamentos · PPAM BAQ',
        data: { title: 'Departamentos' },
      },
      {
        path: 'configuracion/municipios',
        loadComponent: () =>
          import('./features/configuracion/municipios/municipios').then((m) => m.Municipios),
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
        loadComponent: () =>
          import('./features/configuracion/usuarios/usuarios').then((m) => m.Usuarios),
        title: 'Usuarios · PPAM BAQ',
        data: { title: 'Usuarios' },
      },
      {
        path: 'configuracion/puntos',
        loadComponent: () => import('./features/configuracion/puntos/puntos').then((m) => m.Puntos),
        title: 'Puntos · PPAM BAQ',
        data: { title: 'Puntos' },
      },
      {
        path: 'configuracion/parametros',
        loadComponent: () =>
          import('./features/configuracion/parametros/parametros').then((m) => m.Parametros),
        title: 'Parámetros · PPAM BAQ',
        data: { title: 'Parámetros' },
      },
      {
        path: 'configuracion/textos-legales',
        loadComponent: () =>
          import('./features/configuracion/textos-legales/textos-legales').then(
            (m) => m.TextosLegales,
          ),
        title: 'Textos legales · PPAM BAQ',
        data: { title: 'Textos legales' },
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
