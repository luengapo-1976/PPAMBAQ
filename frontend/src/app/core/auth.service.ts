import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface PublicadorPerfil {
  id: string;
  primer_nombre: string | null;
  segundo_nombre: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  nombre_completo: string;
}

export interface AuthSession {
  login: string;
  rol: string | null;
  publicador: PublicadorPerfil | null;
  /** true si, al momento de loguearse, había pasado el número de meses configurado en
   * Configuración > Parámetros generales desde la última actualización de datos del
   * publicador. Se limpia con marcarDatosActualizados() al guardar en "Mis datos". */
  requiereActualizacionDatos: boolean;
  /** true si el publicador todavía no aceptó la versión vigente del texto de
   * tratamiento de datos personales. Se limpia con marcarAceptacionLegal() al aceptar. */
  requiereAceptacionLegal: boolean;
}

interface LoginResponse extends AuthSession {
  access_token: string;
}

/** Vista que se muestra tras iniciar sesión: 'usuario' → Dashboard (BackOffice),
 * 'participante' → landing de Inicio. Solo alternable cuando la sesión tiene ambas
 * identidades (usuarios + publicador vinculado por móvil). */
export type VistaActiva = 'usuario' | 'participante';

const TOKEN_KEY = 'ppam.auth.token';
const SESSION_KEY = 'ppam.auth.session';
const VISTA_KEY = 'ppam.auth.vista';

export const ADMIN_ROLE = 'Administrador';

function decodeExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly session = signal<AuthSession | null>(this.restoreSession());

  readonly currentSession = this.session.asReadonly();
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.session()?.rol === ADMIN_ROLE);

  private readonly vista = signal<VistaActiva>(this.restoreVista());
  readonly vistaActiva = this.vista.asReadonly();

  /** Tiene un rol en la tabla usuarios (BackOffice/Coordinador). */
  readonly tieneRolUsuario = computed(() => !!this.session()?.rol);
  /** Tiene un publicador vinculado (por login+móvil, o por cruce de móvil). */
  readonly tienePublicador = computed(() => !!this.session()?.publicador);
  /** Solo se puede alternar entre Dashboard e Inicio cuando ambas identidades existen. */
  readonly puedeAlternarVista = computed(() => this.tieneRolUsuario() && this.tienePublicador());
  readonly requiereActualizacionDatos = computed(
    () => this.session()?.requiereActualizacionDatos ?? false,
  );
  readonly requiereAceptacionLegal = computed(
    () => this.session()?.requiereAceptacionLegal ?? false,
  );

  login(login: string, password: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/login', { login, password }).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.access_token);
        const session: AuthSession = {
          login: response.login,
          rol: response.rol,
          publicador: response.publicador,
          requiereActualizacionDatos: response.requiereActualizacionDatos,
          requiereAceptacionLegal: response.requiereAceptacionLegal,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        this.session.set(session);
        /** Al iniciar sesión siempre se muestra primero Inicio (vista de
         * participante), incluso para administradores — pueden alternar a
         * Dashboard con el switch. Si el usuario tiene rol pero NO publicador
         * vinculado, Inicio no tendría nada útil que mostrar, así que en ese
         * caso puntual se mantiene el comportamiento anterior (Dashboard). */
        this.setVista(session.rol && !session.publicador ? 'usuario' : 'participante');
      }),
    );
  }

  /** Se llama al guardar exitosamente en "Mis datos": resuelve el requerimiento de
   * actualización obligatoria (si estaba activo) para esta sesión. */
  marcarDatosActualizados(): void {
    const session = this.session();
    if (!session || !session.requiereActualizacionDatos) {
      return;
    }
    const updated: AuthSession = { ...session, requiereActualizacionDatos: false };
    this.session.set(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }

  /** Se llama al aceptar exitosamente el texto de tratamiento de datos personales. */
  marcarAceptacionLegal(): void {
    const session = this.session();
    if (!session || !session.requiereAceptacionLegal) {
      return;
    }
    const updated: AuthSession = { ...session, requiereAceptacionLegal: false };
    this.session.set(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }

  setVista(vista: VistaActiva): void {
    this.vista.set(vista);
    localStorage.setItem(VISTA_KEY, vista);
  }

  /** Ruta a mostrar tras iniciar sesión o al visitar /login ya autenticado. */
  defaultRoute(): string {
    return this.vista() === 'usuario' ? '/dashboard' : '/inicio';
  }

  forgotPassword(correo: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('auth/forgot-password', { correo });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(VISTA_KEY);
    this.session.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private restoreSession(): AuthSession | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (!token || !rawSession) {
      return null;
    }

    const expiry = decodeExpiry(token);
    if (expiry !== null && expiry <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    try {
      const parsed = JSON.parse(rawSession) as AuthSession;
      /** Sesiones guardadas antes de estos campos existir no los traen: se normalizan a
       * false en vez de dejarlos undefined. */
      return {
        ...parsed,
        requiereActualizacionDatos: parsed.requiereActualizacionDatos ?? false,
        requiereAceptacionLegal: parsed.requiereAceptacionLegal ?? false,
      };
    } catch {
      return null;
    }
  }

  private restoreVista(): VistaActiva {
    const raw = localStorage.getItem(VISTA_KEY);
    if (raw === 'usuario' || raw === 'participante') {
      return raw;
    }
    return this.session()?.rol ? 'usuario' : 'participante';
  }
}
