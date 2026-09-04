import { Injectable, NgZone, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

/** Cierra la sesión automáticamente tras 15 minutos sin actividad del usuario
 * (clics, teclas, toques o scroll). Se activa/desactiva solo, según el estado de
 * autenticación, para no acumular listeners cuando no hay sesión iniciada. */
@Injectable({ providedIn: 'root' })
export class InactivityService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly onActivity = () => this.resetTimer();

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.start();
      } else {
        this.stop();
      }
    });
  }

  private start(): void {
    this.ngZone.runOutsideAngular(() => {
      for (const event of ACTIVITY_EVENTS) {
        document.addEventListener(event, this.onActivity, { passive: true });
      }
    });
    this.resetTimer();
  }

  private stop(): void {
    for (const event of ACTIVITY_EVENTS) {
      document.removeEventListener(event, this.onActivity);
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private resetTimer(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => this.onTimeout(), INACTIVITY_TIMEOUT_MS);
  }

  private onTimeout(): void {
    this.stop();
    this.authService.logout();
    this.ngZone.run(() => {
      this.router.navigateByUrl('/login?sesionExpirada=1');
    });
  }
}
