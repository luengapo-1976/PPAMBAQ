import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly count = input.required<number>();
  readonly selected = input(false);
  readonly toggle = output<void>();
}
