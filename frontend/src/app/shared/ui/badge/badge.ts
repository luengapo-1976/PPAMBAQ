import { Component, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'info' | 'warning' | 'success' | 'error';

@Component({
  selector: 'app-badge',
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
}
