import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '../../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../../shared/ui/button/button';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { SnackbarService } from '../../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../../core/error.interceptor';
import { ReferenceDataService } from '../../../data/reference-data.service';
import { Departamento } from '../../../data/models';

@Component({
  selector: 'app-departamento-form-dialog',
  imports: [ReactiveFormsModule, Dialog, Button, FormField],
  templateUrl: './departamento-form-dialog.html',
  styleUrl: './departamento-form-dialog.scss',
})
export class DepartamentoFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly record = input<Departamento | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);

  protected readonly dialogTitle = computed(() =>
    this.mode() === 'create' ? 'Nuevo departamento' : 'Editar departamento',
  );

  protected readonly form = this.fb.group({
    codigo_departamento: ['', [Validators.required, Validators.maxLength(6)]],
    nombre_departamento: ['', [Validators.required, Validators.maxLength(100)]],
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
      this.form.controls.codigo_departamento.setValue(this.record()!.codigo_departamento);
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
        ? this.referenceDataService.updateDepartamento(this.record()!.codigo_departamento, {
            nombre_departamento: raw.nombre_departamento!,
          })
        : this.referenceDataService.createDepartamento({
            codigo_departamento: raw.codigo_departamento!,
            nombre_departamento: raw.nombre_departamento!,
          });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success(
          this.mode() === 'edit' ? 'Departamento actualizado correctamente.' : 'Departamento registrado correctamente.',
        );
        this.form.reset();
        this.saved.emit();
        this.closed.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar el departamento.');
      },
    });
  }

  private applyCreateDefaults(): void {
    this.form.reset();
    this.form.controls.codigo_departamento.enable({ emitEvent: false });
  }

  private populateForm(record: Departamento): void {
    this.form.patchValue({
      codigo_departamento: record.codigo_departamento,
      nombre_departamento: record.nombre_departamento,
    });
    this.form.controls.codigo_departamento.disable({ emitEvent: false });
  }
}
