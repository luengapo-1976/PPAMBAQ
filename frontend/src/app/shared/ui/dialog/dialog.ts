import { Component, effect, input, output, signal } from '@angular/core';

const CLOSE_ANIMATION_MS = 220;

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class Dialog {
  readonly open = input(false);
  readonly title = input('');
  readonly size = input<'md' | 'full'>('md');
  readonly position = input<'center' | 'right'>('center');
  readonly rightWidth = input('50vw');
  /** Separación desde el borde derecho del viewport (p. ej. para dejar espacio a
   * una barra de opciones anclada a la derecha). Solo aplica con position="right". */
  readonly rightOffset = input('0px');
  readonly panelBackground = input<string | null>(null);
  readonly closed = output<void>();

  /** Se mantiene en el DOM un instante más allá de `open()` para poder
   * reproducir la animación de salida antes de desmontar el diálogo. */
  protected readonly visible = signal(false);
  protected readonly closing = signal(false);

  private wasOpen = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (isOpen) {
        if (this.closeTimer) {
          clearTimeout(this.closeTimer);
          this.closeTimer = null;
        }
        this.closing.set(false);
        this.visible.set(true);
      } else if (this.wasOpen) {
        this.closing.set(true);
        this.closeTimer = setTimeout(() => {
          this.visible.set(false);
          this.closing.set(false);
          this.closeTimer = null;
        }, CLOSE_ANIMATION_MS);
      }
      this.wasOpen = isOpen;
    });
  }

  protected onScrimClick(): void {
    this.closed.emit();
  }
}
