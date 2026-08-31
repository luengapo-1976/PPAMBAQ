import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';

export interface CarouselSlide {
  imagenUrl: string;
  alt?: string;
}

const DEFAULT_AUTO_ADVANCE_MS = 6000;

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
})
export class Carousel {
  readonly slides = input<CarouselSlide[]>([]);
  readonly autoAdvanceMs = input<number | null>(DEFAULT_AUTO_ADVANCE_MS);

  protected readonly activeIndex = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => this.stopAutoAdvance());

    effect(() => {
      this.slides();
      this.activeIndex.set(0);
      this.startAutoAdvance();
    });
  }

  protected goTo(index: number): void {
    const total = this.slides().length;
    if (total === 0) {
      return;
    }
    this.activeIndex.set(((index % total) + total) % total);
  }

  protected next(): void {
    this.goTo(this.activeIndex() + 1);
  }

  protected prev(): void {
    this.goTo(this.activeIndex() - 1);
  }

  protected onMouseEnter(): void {
    this.stopAutoAdvance();
  }

  protected onMouseLeave(): void {
    this.startAutoAdvance();
  }

  protected startAutoAdvance(): void {
    this.stopAutoAdvance();
    const interval = this.autoAdvanceMs();
    if (!interval || this.slides().length <= 1) {
      return;
    }
    this.timer = setInterval(() => this.next(), interval);
  }

  private stopAutoAdvance(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
