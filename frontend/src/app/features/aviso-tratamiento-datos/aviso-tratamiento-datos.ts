import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../shared/ui/button/button';
import { AuthService } from '../../core/auth.service';
import {
  AceptacionesLegalesService,
  TIPO_TRATAMIENTO_DATOS,
} from '../../core/aceptaciones-legales.service';
import { TextosLegalesService } from '../configuracion/data/textos-legales.service';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../core/error.interceptor';

@Component({
  selector: 'app-aviso-tratamiento-datos',
  imports: [Button],
  templateUrl: './aviso-tratamiento-datos.html',
  styleUrl: './aviso-tratamiento-datos.scss',
})
export class AvisoTratamientoDatos {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly textosLegalesService = inject(TextosLegalesService);
  private readonly aceptacionesLegalesService = inject(AceptacionesLegalesService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly loading = signal(true);
  protected readonly aceptando = signal(false);
  protected readonly parrafos = signal<string[]>([]);

  constructor() {
    this.cargarTexto();
  }

  protected onAceptar(): void {
    if (this.aceptando()) {
      return;
    }
    this.aceptando.set(true);
    this.aceptacionesLegalesService.aceptar(TIPO_TRATAMIENTO_DATOS).subscribe({
      next: () => {
        this.aceptando.set(false);
        this.authService.marcarAceptacionLegal();
        const siguiente = this.authService.requiereActualizacionDatos()
          ? '/aviso-actualizacion-datos'
          : this.authService.defaultRoute();
        this.router.navigateByUrl(siguiente);
      },
      error: (err: ApiError) => {
        this.aceptando.set(false);
        this.snackbar.error(
          err?.message ?? 'No se pudo registrar tu aceptación. Intenta nuevamente.',
        );
      },
    });
  }

  private cargarTexto(): void {
    this.loading.set(true);
    this.textosLegalesService.obtenerActivo(TIPO_TRATAMIENTO_DATOS).subscribe({
      next: (texto) => {
        const contenido = texto?.contenido ?? '';
        this.parrafos.set(contenido.split(/\n{2,}/).filter((p) => p.trim().length > 0));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar el aviso de tratamiento de datos.');
      },
    });
  }
}
