import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface AuthSession {
  login: string;
  rol: string | null;
}

interface LoginResponse extends AuthSession {
  access_token: string;
}

const TOKEN_KEY = 'ppam.auth.token';
const SESSION_KEY = 'ppam.auth.session';

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

  login(login: string, password: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/login', { login, password }).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.access_token);
        const session: AuthSession = { login: response.login, rol: response.rol };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        this.session.set(session);
      }),
    );
  }

  forgotPassword(correo: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('auth/forgot-password', { correo });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
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
      return JSON.parse(rawSession) as AuthSession;
    } catch {
      return null;
    }
  }
}
