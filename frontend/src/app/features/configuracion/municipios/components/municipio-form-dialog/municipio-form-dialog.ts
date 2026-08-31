import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '../../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../../shared/ui/button/button';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import {
  SearchSelect,
  SearchSelectOption,
} from '../../../../../shared/ui/search-select/search-select';
import { SnackbarService } from '../../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../../core/error.interceptor';
import { ReferenceDataService } from '../../../data/reference-data.service';
import { Departamento, Municipio } from '../../../data/models';

@Component({
  selector: 'app-municipio-form-dialog',
  imports: [ReactiveFormsModule, Dialog, Button, FormField, SearchSelect],
  templateUrl: './municipio-form-dialog.html',
  styleUrl: './municipio-form-dialog.scss',
})
export class MunicipioFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly record = input<Municipio | null>(null);
  readonly departamentos = input.required<Departamento[]>();

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);

  protected readonly dialogTitle = computed(() =>
    this.mode() === 'create' ? 'Nuevo municipio' : 'Editar municipio',
  );

  protected readonly departamentoOptions = computed<SearchSelectOption[]>(() =>
    this.departamentos().map((d) => ({
      value: d.codigo_departamento,
      label: `${d.codigo_departamento} - ${d.nombre_departamento}`,
    })),
  );

  protected readonly form = this.fb.group({
    codigo_municipio: ['', [Validators.required, Validators.maxLength(6)]],
    nombre_municipio: ['', [Validators.required, Validators.maxLength(100)]],
    codigo_departamento: ['', Validators.required],
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
      this.form.controls.codigo_municipio.setValue(this.record()!.codigo_municipio);
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
        ? this.referenceDataService.updateMunicipio(this.record()!.codigo_municipio, {
            nombre_municipio: raw.nombre_municipio!,
            codigo_departamento: raw.codigo_departamento!,
          })
        : this.referenceDataService.createMunicipio({
            codigo_municipio: raw.codigo_municipio!,
            nombre_municipio: raw.nombre_municipio!,
            codigo_departamento: raw.codigo_departamento!,
          });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success(
          this.mode() === 'edit'
            ? 'Municipio actualizado correctamente.'
            : 'Municipio registrado correctamente.',
        );
        this.form.reset();
        this.saved.emit();
        this.closed.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar el municipio.');
      },
    });
  }

  private applyCreateDefaults(): void {
    this.form.reset();
    this.form.controls.codigo_municipio.enable({ emitEvent: false });
  }

  private populateForm(record: Municipio): void {
    this.form.patchValue({
      codigo_municipio: record.codigo_municipio,
      nombre_municipio: record.nombre_municipio,
      codigo_departamento: record.codigo_departamento,
    });
    this.form.controls.codigo_municipio.disable({ emitEvent: false });
  }
}
