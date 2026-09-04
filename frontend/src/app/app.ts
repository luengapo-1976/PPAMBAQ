import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InactivityService } from './core/inactivity.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** Solo se necesita instanciarlo para que arranque su vigilancia de inactividad. */
  private readonly inactivityService = inject(InactivityService);
}
