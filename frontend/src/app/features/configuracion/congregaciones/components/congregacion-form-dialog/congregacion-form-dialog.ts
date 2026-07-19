import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '../../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../../shared/ui/button/button';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { SearchSelect, SearchSelectOption } from '../../../../../shared/ui/search-select/search-select';
import { SnackbarService } from '../../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../../core/error.interceptor';
import { EMAIL_PATTERN } from '../../../../../shared/utils/format.util';
import { ReferenceDataService } from '../../../data/reference-data.service';
import { Circuito, Congregacion, Departamento, Municipio } from '../../../data/models';

@Component({
  selector: 'app-congregacion-form-dialog',
  imports: [ReactiveFormsModule, Dialog, Button, FormField, SearchSelect],
  templateUrl: './congregacion-form-dialog.html',
  styleUrl: './congregacion-form-dialog.scss',
})
export class CongregacionFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly record = input<Congregacion | null>(null);
  readonly departamentos = input.required<Departamento[]>();
  readonly municipios = input.required<Municipio[]>();
  readonly circuitos = input.required<Circuito[]>();

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);
  private isPatchingForm = false;

  protected readonly dialogTitle = computed(() =>
    this.mode() === 'create' ? 'Nueva congregación' : 'Editar congregación',
  );

  protected readonly form = this.fb.group({
    codigo_congregacion: this.fb.control<number | null>(null, [Validators.required]),
    nombre_congregacion: ['', [Validators.required, Validators.maxLength(100)]],
    codigo_departamento: ['', Validators.required],
    codigo_municipio: [{ value: '', disabled: true }, Validators.required],
    codigo_circuito: ['', Validators.required],
    correo_congregacion: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN), Validators.maxLength(100)]],
  });

  private readonly selectedDepartamento = toSignal(this.form.controls.codigo_departamento.valueChanges, {
    initialValue: '',
  });

  protected readonly departamentoOptions = computed<SearchSelectOption[]>(() =>
    this.departamentos().map((d) => ({
      value: d.codigo_departamento,
      label: `${d.codigo_departamento} - ${d.nombre_departamento}`,
    })),
  );

  protected readonly municipioOptions = computed<SearchSelectOption[]>(() => {
    const depto = this.selectedDepartamento();
    return this.municipios()
      .filter((m) => !depto || m.codigo_departamento === depto)
      .map((m) => ({ value: m.codigo_municipio, label: `${m.codigo_municipio} - ${m.nombre_municipio}` }));
  });

  protected readonly circuitoOptions = computed<SearchSelectOption[]>(() =>
    this.circuitos().map((c) => ({
      value: c.codigo_circuito,
      label: c.nombre_viajante ? `${c.codigo_circuito} - ${c.nombre_viajante}` : c.codigo_circuito,
    })),
  );

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

    this.form.controls.codigo_departamento.valueChanges.pipe(takeUntilDestroyed()).subscribe((depto) => {
      const municipioControl = this.form.controls.codigo_municipio;
      if (depto) {
        municipioControl.enable({ emitEvent: false });
      } else {
        municipioControl.disable({ emitEvent: false });
      }
      if (this.isPatchingForm) {
        return;
      }
      const current = municipioControl.value;
      const stillValid = this.municipios().some(
        (m) => m.codigo_municipio === current && m.codigo_departamento === depto,
      );
      if (current && !stillValid) {
        municipioControl.setValue('');
      }
    });
  }

  protected onCancel(): void {
    this.form.reset();
    this.closed.emit();
  }

  protected onClear(): void {
    this.form.reset();
    this.form.controls.codigo_municipio.disable({ emitEvent: false });
    if (this.mode() === 'edit' && this.record()) {
      this.form.controls.codigo_congregacion.setValue(this.record()!.codigo_congregacion);
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
        ? this.referenceDataService.updateCongregacion(this.record()!.codigo_congregacion, {
            nombre_congregacion: raw.nombre_congregacion!,
            codigo_departamento: raw.codigo_departamento!,
            codigo_municipio: raw.codigo_municipio!,
            codigo_circuito: raw.codigo_circuito!,
            correo_congregacion: raw.correo_congregacion!,
          })
        : this.referenceDataService.createCongregacion({
            codigo_congregacion: raw.codigo_congregacion!,
            nombre_congregacion: raw.nombre_congregacion!,
            codigo_departamento: raw.codigo_departamento!,
            codigo_municipio: raw.codigo_municipio!,
            codigo_circuito: raw.codigo_circuito!,
            correo_congregacion: raw.correo_congregacion!,
          });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success(
          this.mode() === 'edit' ? 'Congregación actualizada correctamente.' : 'Congregación registrada correctamente.',
        );
        this.form.reset();
        this.saved.emit();
        this.closed.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar la congregación.');
      },
    });
  }

  private applyCreateDefaults(): void {
    this.form.reset();
    this.form.controls.codigo_congregacion.enable({ emitEvent: false });
    this.form.controls.codigo_municipio.disable({ emitEvent: false });
  }

  private populateForm(record: Congregacion): void {
    this.isPatchingForm = true;
    this.form.controls.codigo_municipio.enable({ emitEvent: false });
    this.form.patchValue({
      codigo_congregacion: record.codigo_congregacion,
      nombre_congregacion: record.nombre_congregacion,
      codigo_departamento: record.codigo_departamento,
      codigo_municipio: record.codigo_municipio,
      codigo_circuito: record.codigo_circuito ?? '',
      correo_congregacion: record.correo_congregacion ?? '',
    });
    this.form.controls.codigo_congregacion.disable({ emitEvent: false });
    this.isPatchingForm = false;
  }
}
