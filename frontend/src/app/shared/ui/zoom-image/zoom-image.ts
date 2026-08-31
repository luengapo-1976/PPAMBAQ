import { Component, ElementRef, computed, input, signal, viewChild } from '@angular/core';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const BUTTON_ZOOM_STEP = 0.75;
const WHEEL_ZOOM_FACTOR = 1.15;

interface PointInfo {
  x: number;
  y: number;
}

/** Visor de imagen con zoom por pellizco (touch), rueda del mouse, doble
 * clic/toque y botones +/-. Necesario porque el pellizco nativo del navegador
 * suele estar deshabilitado cuando la app corre instalada como PWA. */
@Component({
  selector: 'app-zoom-image',
  templateUrl: './zoom-image.html',
  styleUrl: './zoom-image.scss',
})
export class ZoomImage {
  readonly src = input.required<string>();
  readonly alt = input('');

  private readonly viewport = viewChild<ElementRef<HTMLDivElement>>('viewport');

  protected readonly scale = signal(1);
  protected readonly translateX = signal(0);
  protected readonly translateY = signal(0);
  protected readonly zoomed = computed(() => this.scale() > 1.01);

  protected readonly transform = computed(
    () => `translate(${this.translateX()}px, ${this.translateY()}px) scale(${this.scale()})`,
  );

  private readonly activePointers = new Map<number, PointInfo>();
  private pinchStartDistance = 0;
  private pinchStartScale = 1;
  private panStart: { x: number; y: number; translateX: number; translateY: number } | null = null;

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    const factor = event.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR;
    this.applyScale(this.scale() * factor);
  }

  protected onDoubleClick(): void {
    this.applyScale(this.zoomed() ? 1 : DOUBLE_TAP_SCALE);
  }

  protected onPointerDown(event: PointerEvent): void {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.activePointers.size === 2) {
      this.pinchStartDistance = this.distanciaEntrePuntos();
      this.pinchStartScale = this.scale();
      this.panStart = null;
    } else if (this.activePointers.size === 1 && this.zoomed()) {
      this.panStart = {
        x: event.clientX,
        y: event.clientY,
        translateX: this.translateX(),
        translateY: this.translateY(),
      };
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) {
      return;
    }
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.activePointers.size === 2) {
      const distancia = this.distanciaEntrePuntos();
      if (this.pinchStartDistance > 0) {
        this.applyScale(this.pinchStartScale * (distancia / this.pinchStartDistance));
      }
      return;
    }

    if (this.activePointers.size === 1 && this.panStart) {
      const dx = event.clientX - this.panStart.x;
      const dy = event.clientY - this.panStart.y;
      this.setTranslate(this.panStart.translateX + dx, this.panStart.translateY + dy);
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    this.activePointers.delete(event.pointerId);
    this.pinchStartDistance = 0;
    this.panStart = null;

    if (this.activePointers.size === 1) {
      const [restante] = this.activePointers.values();
      this.panStart = this.zoomed()
        ? {
            x: restante.x,
            y: restante.y,
            translateX: this.translateX(),
            translateY: this.translateY(),
          }
        : null;
    }
  }

  protected zoomIn(): void {
    this.applyScale(this.scale() + BUTTON_ZOOM_STEP);
  }

  protected zoomOut(): void {
    this.applyScale(this.scale() - BUTTON_ZOOM_STEP);
  }

  protected reset(): void {
    this.scale.set(1);
    this.translateX.set(0);
    this.translateY.set(0);
  }

  private applyScale(nuevaEscala: number): void {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nuevaEscala));
    this.scale.set(clamped);
    if (clamped <= 1) {
      this.translateX.set(0);
      this.translateY.set(0);
    } else {
      this.setTranslate(this.translateX(), this.translateY());
    }
  }

  private setTranslate(x: number, y: number): void {
    const limite = this.limitePan();
    this.translateX.set(Math.min(limite.x, Math.max(-limite.x, x)));
    this.translateY.set(Math.min(limite.y, Math.max(-limite.y, y)));
  }

  private limitePan(): PointInfo {
    const rect = this.viewport()?.nativeElement.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }
    const extra = this.scale() - 1;
    return { x: (rect.width * extra) / 2, y: (rect.height * extra) / 2 };
  }

  private distanciaEntrePuntos(): number {
    const puntos = [...this.activePointers.values()];
    if (puntos.length < 2) {
      return 0;
    }
    const [a, b] = puntos;
    return Math.hypot(b.x - a.x, b.y - a.y);
  }
}
