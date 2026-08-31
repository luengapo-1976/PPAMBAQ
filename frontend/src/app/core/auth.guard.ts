import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([authService.defaultRoute()]);
};

/** Bloquea la navegación a cualquier pantalla del árbol de ParticipanteShell mientras
 * el publicador no haya aceptado la versión vigente del texto de tratamiento de datos
 * personales. La pantalla de aviso vive fuera de ese árbol (ruta hermana), así que no
 * necesita un caso especial aquí como sí lo necesita datosActualizacionGuard. */
export const aceptacionLegalGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.requiereAceptacionLegal()) {
    return true;
  }

  return router.createUrlTree(['/aviso-tratamiento-datos']);
};

/** Bloquea la navegación a cualquier otra pantalla de participante mientras haya una
 * actualización de datos obligatoria pendiente (ver AuthService.requiereActualizacionDatos):
 * redirige siempre a "Mis datos", hasta que la persona guarde ahí. Se aplica como
 * canActivateChild sobre todo el árbol de ParticipanteShell, así que también se evalúa
 * para la propia ruta 'actualizar-datos' — por eso la deja pasar explícitamente. */
export const datosActualizacionGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.requiereActualizacionDatos() || state.url === '/actualizar-datos') {
    return true;
  }

  return router.createUrlTree(['/actualizar-datos']);
};

/** Protege el Shell (BackOffice): requiere sesión y un rol en la tabla usuarios.
 * Una sesión de solo-participante (sin rol) es redirigida a /inicio. */
export const usuarioAreaGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  if (authService.tieneRolUsuario()) {
    return true;
  }

  return router.createUrlTree(['/inicio']);
};
