import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '../../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../../shared/ui/button/button';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { SnackbarService } from '../../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../../core/error.interceptor';
import { EMAIL_PATTERN, MOVIL_PATTERN } from '../../../../../shared/utils/format.util';
import { ReferenceDataService } from '../../../data/reference-data.service';
import { Circuito } from '../../../data/models';

@Component({
  selector: 'app-circuito-form-dialog',
  imports: [ReactiveFormsModule, Dialog, Button, FormField],
  templateUrl: './circuito-form-dialog.html',
  styleUrl: './circuito-form-dialog.scss',
})
export class CircuitoFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly record = input<Circuito | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);

  protected readonly dialogTitle = computed(() =>
    this.mode() === 'create' ? 'Nuevo circuito' : 'Editar circuito',
  );

  protected readonly form = this.fb.group({
    codigo_circuito: ['', [Validators.required, Validators.maxLength(10)]],
    nombre_viajante: ['', [Validators.required, Validators.maxLength(100)]],
    movil: ['', [Validators.required, Validators.pattern(MOVIL_PATTERN)]],
    correo_electronico: [
      '',
      [Validators.required, Validators.pattern(EMAIL_PATTERN), Validators.maxLength(100)],
    ],
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
      this.form.controls.codigo_circuito.setValue(this.record()!.codigo_circuito);
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
        ? this.referenceDataService.updateCircuito(this.record()!.codigo_circuito, {
            nombre_viajante: raw.nombre_viajante!,
            movil: raw.movil!,
            correo_electronico: raw.correo_electronico!,
          })
        : this.referenceDataService.createCircuito({
            codigo_circuito: raw.codigo_circuito!,
            nombre_viajante: raw.nombre_viajante!,
            movil: raw.movil!,
            correo_electronico: raw.correo_electronico!,
          });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success(
          this.mode() === 'edit'
            ? 'Circuito actualizado correctamente.'
            : 'Circuito registrado correctamente.',
        );
        this.form.reset();
        this.saved.emit();
        this.closed.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar el circuito.');
      },
    });
  }

  private applyCreateDefaults(): void {
    this.form.reset();
    this.form.controls.codigo_circuito.enable({ emitEvent: false });
  }

  private populateForm(record: Circuito): void {
    this.form.patchValue({
      codigo_circuito: record.codigo_circuito,
      nombre_viajante: record.nombre_viajante ?? '',
      movil: record.movil ?? '',
      correo_electronico: record.correo_electronico ?? '',
    });
    this.form.controls.codigo_circuito.disable({ emitEvent: false });
  }
}
