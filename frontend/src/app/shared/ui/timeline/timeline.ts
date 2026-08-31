import { Component, input } from '@angular/core';

export type TimelineVariant = 'neutral' | 'success' | 'warning' | 'error';

export interface TimelineDetalle {
  label: string;
  value: string;
}

export interface TimelineItem {
  titulo: string;
  fecha: string | null;
  variant: TimelineVariant;
  icon: string;
  detalles?: TimelineDetalle[];
}

@Component({
  selector: 'app-timeline',
  imports: [],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class Timeline {
  readonly items = input.required<TimelineItem[]>();
}
