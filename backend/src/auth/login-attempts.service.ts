import { Injectable, UnauthorizedException } from '@nestjs/common';

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000;

interface AttemptState {
  attempts: number;
  lockedUntil: number | null;
}

/** Limita los intentos fallidos de login: al tercer intento fallido con el mismo
 * usuario, bloquea nuevos intentos para ese usuario durante 5 minutos. Cambiar de
 * usuario reinicia el conteo, porque el estado se guarda por login, no globalmente.
 * En memoria: se reinicia si el proceso se reinicia, lo cual es aceptable para este
 * control (no es la única defensa — las contraseñas también se validan con hash). */
@Injectable()
export class LoginAttemptsService {
  private readonly state = new Map<string, AttemptState>();

  private key(login: string): string {
    return login.trim().toLowerCase();
  }

  /** Lanza si el usuario está actualmente bloqueado por exceso de intentos. */
  assertNotLocked(login: string): void {
    const entry = this.state.get(this.key(login));
    if (!entry?.lockedUntil) {
      return;
    }

    const remainingMs = entry.lockedUntil - Date.now();
    if (remainingMs <= 0) {
      this.state.delete(this.key(login));
      return;
    }

    const remainingMinutes = Math.ceil(remainingMs / 60000);
    throw new UnauthorizedException(
      `Demasiados intentos fallidos. Intenta nuevamente en ${remainingMinutes} minuto${remainingMinutes === 1 ? '' : 's'}.`,
    );
  }

  registerFailure(login: string): void {
    const key = this.key(login);
    const entry = this.state.get(key) ?? { attempts: 0, lockedUntil: null };
    entry.attempts += 1;
    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.lockedUntil = Date.now() + LOCKOUT_MS;
    }
    this.state.set(key, entry);
  }

  registerSuccess(login: string): void {
    this.state.delete(this.key(login));
  }
}
