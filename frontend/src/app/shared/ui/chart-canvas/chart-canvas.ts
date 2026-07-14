import { Component, ElementRef, OnDestroy, ViewChild, effect, input } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-canvas',
  templateUrl: './chart-canvas.html',
  styleUrl: './chart-canvas.scss',
})
export class ChartCanvas implements OnDestroy {
  @ViewChild('canvasRef', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly type = input.required<ChartType>();
  readonly data = input.required<ChartData>();
  readonly options = input<ChartConfiguration['options']>(undefined);

  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const type = this.type();
      const data = this.data();
      const options = this.options();
      this.render(type, data, options);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(type: ChartType, data: ChartData, options: ChartConfiguration['options']): void {
    this.chart?.destroy();
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type,
      data,
      options: { ...options, maintainAspectRatio: false, responsive: true },
    });
  }
}
