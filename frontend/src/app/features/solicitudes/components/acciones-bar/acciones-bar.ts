import { Component, effect, input, output, signal } from '@angular/core';
import { Button } from '../../../../shared/ui/button/button';

const CLOSE_ANIMATION_MS = 220;

@Component({
  selector: 'app-acciones-bar',
  imports: [Button],
  templateUrl: './acciones-bar.html',
  styleUrl: './acciones-bar.scss',
})
export class AccionesBar {
  readonly open = input(false);
  readonly collapsed = input(false);

  readonly closed = output<void>();
  readonly collapsedChange = output<boolean>();
  readonly selectAsignarLugar = output<void>();
  readonly selectEnviarMensaje = output<void>();

  protected onToggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed());
  }

  /** Se mantiene en el DOM un instante más allá de `open()` para poder
   * reproducir la animación de salida antes de desmontar la barra. */
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
}
