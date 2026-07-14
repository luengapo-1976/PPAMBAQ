import { Injectable, signal } from '@angular/core';

export type SnackbarTone = 'success' | 'error' | 'info';

export interface SnackbarMessage {
  id: number;
  text: string;
  tone: SnackbarTone;
}

const AUTO_DISMISS_MS = 4000;

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private nextId = 0;
  readonly message = signal<SnackbarMessage | null>(null);

  show(text: string, tone: SnackbarTone = 'info'): void {
    const id = ++this.nextId;
    this.message.set({ id, text, tone });
    setTimeout(() => {
      if (this.message()?.id === id) {
        this.message.set(null);
      }
    }, AUTO_DISMISS_MS);
  }

  success(text: string): void {
    this.show(text, 'success');
  }

  error(text: string): void {
    this.show(text, 'error');
  }
}
