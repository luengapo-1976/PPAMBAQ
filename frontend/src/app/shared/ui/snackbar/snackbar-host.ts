import { Component, inject } from '@angular/core';
import { SnackbarService } from './snackbar.service';

@Component({
  selector: 'app-snackbar-host',
  templateUrl: './snackbar-host.html',
  styleUrl: './snackbar-host.scss',
})
export class SnackbarHost {
  protected readonly snackbarService = inject(SnackbarService);
}
