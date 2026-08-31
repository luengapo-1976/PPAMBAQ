import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from '../../../shared/ui/button/button';
import { Switch } from '../../../shared/ui/switch/switch';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../core/error.interceptor';
import { ParametrosService } from '../data/parametros.service';

/** Único parámetro que existe por ahora; la tabla admite agregar más a futuro (cada
 * uno, una fila nueva) sin cambios de esquema. */
const CLAVE_ACTUALIZACION_DATOS_MESES = 'ACTUALIZACION_DATOS_MESES';

@Component({
  selector: 'app-parametros',
  imports: [FormsModule, Button, Switch],
  templateUrl: './parametros.html',
  styleUrl: './parametros.scss',
})
export class Parametros {
  private readonly parametrosService = inject(ParametrosService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly meses = signal<number | null>(null);
  protected readonly activo = signal(false);

  protected readonly mesesValido = computed(() => this.meses() !== null && this.meses()! > 0);

  constructor() {
    this.cargar();
  }

  protected onMesesChange(value: number | null): void {
    const parsed = value !== null && Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
    this.meses.set(parsed);
    if (parsed === null) {
      this.activo.set(false);
    }
  }

  protected onActivoChange(value: boolean): void {
    if (!this.mesesValido()) {
      return;
    }
    this.activo.set(value);
  }

  protected onGuardar(): void {
    if (!this.mesesValido() || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.parametrosService
      .update(CLAVE_ACTUALIZACION_DATOS_MESES, {
        valor: String(this.meses()),
        activo: this.activo(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbar.success('Parámetro guardado correctamente.');
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.snackbar.error(err?.message ?? 'No se pudo guardar el parámetro.');
        },
      });
  }

  private cargar(): void {
    this.loading.set(true);
    this.parametrosService.list().subscribe({
      next: (parametros) => {
        const parametro = parametros.find((p) => p.clave === CLAVE_ACTUALIZACION_DATOS_MESES);
        this.meses.set(parametro?.valor ? Number(parametro.valor) : null);
        this.activo.set(parametro?.activo ?? false);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar los parámetros.');
      },
    });
  }
}
