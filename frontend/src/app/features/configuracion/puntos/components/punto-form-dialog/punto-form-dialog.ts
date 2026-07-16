import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '../../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../../shared/ui/button/button';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { SnackbarService } from '../../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../../core/error.interceptor';
import { MOVIL_PATTERN } from '../../../../../shared/utils/format.util';
import { ReferenceDataService } from '../../../data/reference-data.service';
import { PUNTO_ESTADOS, Punto, PuntoEstado } from '../../../data/models';

const ESTADO_OPTIONS: SelectOption[] = PUNTO_ESTADOS.map((value) => ({ value, label: value }));

@Component({
  selector: 'app-punto-form-dialog',
  imports: [ReactiveFormsModule, Dialog, Button, FormField, Select],
  templateUrl: './punto-form-dialog.html',
  styleUrl: './punto-form-dialog.scss',
})
export class PuntoFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly record = input<Punto | null>(null);
  readonly puntos = input<Punto[]>([]);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);
  protected readonly estadoOptions = ESTADO_OPTIONS;

  protected readonly dialogTitle = computed(() => (this.mode() === 'create' ? 'Nuevo punto' : 'Editar punto'));

  protected readonly form = this.fb.group({
    codigo_punto: [{ value: null as number | null, disabled: true }, Validators.required],
    nombre_punto: ['', [Validators.required, Validators.maxLength(100)]],
    direccion: ['', [Validators.maxLength(100)]],
    encargado: ['', [Validators.maxLength(100)]],
    movil: ['', [Validators.pattern(MOVIL_PATTERN)]],
    estado: [{ value: 'Activo' as PuntoEstado, disabled: true }, Validators.required],
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (!isOpen) {
        return;
      }
      if (this.mode() === 'create') {
        this.applyCreateDefaults();
      } else {
        const record = this.record();
        if (record) {
          this.populateForm(record);
        }
      }
    });
  }

  protected onCancel(): void {
    this.form.reset();
    this.closed.emit();
  }

  protected onClear(): void {
    this.form.reset();
    if (this.mode() === 'edit' && this.record()) {
      this.form.controls.codigo_punto.setValue(this.record()!.codigo_punto);
      this.form.controls.estado.setValue(this.record()!.estado);
    } else {
      this.form.controls.codigo_punto.setValue(this.computeNextCodigo());
      this.form.controls.estado.setValue('Activo');
    }
  }

  protected onSave(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saving.set(true);

    const request$ =
      this.mode() === 'edit'
        ? this.referenceDataService.updatePunto(this.record()!.codigo_punto, {
            nombre_punto: raw.nombre_punto!,
            direccion: raw.direccion || null,
            encargado: raw.encargado || null,
            movil: raw.movil || null,
            estado: raw.estado!,
          })
        : this.referenceDataService.createPunto({
            codigo_punto: raw.codigo_punto!,
            nombre_punto: raw.nombre_punto!,
            direccion: raw.direccion || null,
            encargado: raw.encargado || null,
            movil: raw.movil || null,
            estado: raw.estado!,
          });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success(
          this.mode() === 'edit' ? 'Punto actualizado correctamente.' : 'Punto registrado correctamente.',
        );
        this.form.reset();
        this.saved.emit();
        this.closed.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar el punto.');
      },
    });
  }

  /** Siguiente código disponible = máximo codigo_punto existente + 1 (empieza en 1 si no hay registros). */
  private computeNextCodigo(): number {
    const maxCodigo = this.puntos().reduce((max, p) => (p.codigo_punto > max ? p.codigo_punto : max), 0);
    return maxCodigo + 1;
  }

  private applyCreateDefaults(): void {
    this.form.reset();
    this.form.controls.codigo_punto.setValue(this.computeNextCodigo());
    this.form.controls.estado.setValue('Activo');
    this.form.controls.estado.disable({ emitEvent: false });
  }

  private populateForm(record: Punto): void {
    this.form.patchValue({
      codigo_punto: record.codigo_punto,
      nombre_punto: record.nombre_punto,
      direccion: record.direccion ?? '',
      encargado: record.encargado ?? '',
      movil: record.movil ?? '',
      estado: record.estado,
    });
    this.form.controls.estado.enable({ emitEvent: false });
  }
}
