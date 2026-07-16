import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../shared/ui/button/button';
import { Select, SelectOption } from '../../../../shared/ui/select/select';
import { SearchSelect, SearchSelectOption } from '../../../../shared/ui/search-select/search-select';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../core/error.interceptor';
import { PublicadoresService } from '../../data/publicadores.service';
import {
  Congregacion,
  Departamento,
  EntrenamientoRequerido,
  ENTRENAMIENTOS_REQUERIDOS,
  EstadoCivil,
  ESTADOS_SOLICITUD,
  EstadoSolicitud,
  Municipio,
  ParticipoAntes,
  PrivilegioMin,
  PrivilegioSer,
  Publicador,
  PublicadorPayload,
  PublicadorUpdatePayload,
  Sexo,
} from '../../data/models';
import {
  EMAIL_PATTERN,
  MOVIL_PATTERN,
  formatDateShort,
  nombreCompleto,
  todayIsoDate,
  toTitleCase,
  yearsSince,
} from '../../data/publicador.utils';
import { DuplicateCandidate, DuplicateReason, findDuplicateCandidates } from '../../data/duplicate-check';
import { parseS73Pdf, S73ImportValues } from '../../data/s73-import.util';
import { Punto } from '../../../configuracion/data/models';

const ESTADO_CIVIL_OPTIONS: SelectOption[] = ['Casado', 'Soltero', 'Divorciado', 'Separado', 'Viudo'].map(
  (value) => ({ value, label: value }),
);
const PRIVILEGIO_MIN_OPTIONS: SelectOption[] = ['Ninguno', 'Anciano', 'Siervo ministerial'].map((value) => ({
  value,
  label: value,
}));
const PRIVILEGIO_SER_OPTIONS: SelectOption[] = [
  'Publicador',
  'Precursor regular',
  'Precursor especial',
  'Misionero que sirve en el campo',
  'Miembro de la familia Betel',
].map((value) => ({ value, label: value }));
const PARTICIPO_ANTES_OPTIONS: SelectOption[] = [
  { value: 'SI', label: 'Sí' },
  { value: 'NO', label: 'No' },
];
const SEXO_OPTIONS: SelectOption[] = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
];
const ESTADO_OPTIONS: SelectOption[] = ESTADOS_SOLICITUD.map((value) => ({ value, label: value }));
const ENTRENAMIENTO_REQUERIDO_OPTIONS: SelectOption[] = ENTRENAMIENTOS_REQUERIDOS.map((value) => ({
  value,
  label: value,
}));
const NOMBRE_CONYUGE_ESTADOS_CIVILES = ['Casado', 'Separado'];

@Component({
  selector: 'app-publicador-form-dialog',
  imports: [ReactiveFormsModule, Dialog, Button, Select, SearchSelect, FormField],
  templateUrl: './publicador-form-dialog.html',
  styleUrl: './publicador-form-dialog.scss',
})
export class PublicadorFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly publicadoresService = inject(PublicadoresService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly record = input<Publicador | null>(null);
  readonly departamentos = input.required<Departamento[]>();
  readonly municipios = input.required<Municipio[]>();
  readonly congregaciones = input.required<Congregacion[]>();
  readonly existingPublicadores = input<Publicador[]>([]);
  readonly puntos = input<Punto[]>([]);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);
  protected readonly importingS73 = signal(false);

  protected readonly estadoCivilOptions = ESTADO_CIVIL_OPTIONS;
  protected readonly privilegioMinOptions = PRIVILEGIO_MIN_OPTIONS;
  protected readonly privilegioSerOptions = PRIVILEGIO_SER_OPTIONS;
  protected readonly participoAntesOptions = PARTICIPO_ANTES_OPTIONS;
  protected readonly sexoOptions = SEXO_OPTIONS;
  protected readonly estadoOptions = ESTADO_OPTIONS;
  protected readonly entrenamientoRequeridoOptions = ENTRENAMIENTO_REQUERIDO_OPTIONS;
  protected readonly nombreCompleto = nombreCompleto;
  protected readonly formatDateShort = formatDateShort;

  private isPatchingForm = false;

  /** Si en modo "crear" el usuario confirma que corresponde a una persona ya
   * registrada, guardamos aquí su id para que "Guardar" actualice ese registro
   * en vez de insertar uno nuevo (evita duplicados). */
  private readonly matchedExistingId = signal<string | null>(null);
  private readonly dismissedDuplicateKeys = signal<Set<string>>(new Set());

  protected readonly duplicateDialogOpen = signal(false);
  protected readonly duplicateCandidates = signal<DuplicateCandidate[]>([]);
  protected readonly selectedCandidateId = signal<string | null>(null);

  protected readonly duplicateReasons = computed<Set<DuplicateReason>>(
    () => new Set(this.duplicateCandidates().flatMap((c) => c.reasons)),
  );
  protected readonly duplicateHasMovilOrCorreo = computed(
    () => this.duplicateReasons().has('movil') || this.duplicateReasons().has('correo'),
  );

  protected readonly form = this.fb.group({
    primer_apellido: ['', [Validators.required, Validators.maxLength(20)]],
    segundo_apellido: ['', [Validators.maxLength(20)]],
    primer_nombre: ['', [Validators.required, Validators.maxLength(20)]],
    segundo_nombre: ['', [Validators.maxLength(20)]],
    direccion: ['', [Validators.required, Validators.maxLength(100)]],
    codigo_departamento: ['', Validators.required],
    codigo_municipio: [{ value: '', disabled: true }, Validators.required],
    correo_electronico: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN), Validators.maxLength(100)]],
    movil: ['', [Validators.required, Validators.pattern(MOVIL_PATTERN)]],
    codigo_congregacion: ['', Validators.required],
    fecha_nacimiento: ['', Validators.required],
    sexo: ['', Validators.required],
    fecha_bautismo: ['', Validators.required],
    estado_civil: ['', Validators.required],
    nombre_conyuge: ['', [Validators.maxLength(100)]],
    apellido_casada: ['', [Validators.maxLength(20)]],
    privilegio_min: ['', Validators.required],
    privilegio_ser: ['', Validators.required],
    participo_antes: ['', Validators.required],
    fecha_solicitud: ['', Validators.required],
    estado: [{ value: 'REGISTRADO', disabled: true }, Validators.required],
    entrenamiento_requerido: [{ value: 'Primer entrenamiento', disabled: true }, Validators.required],
    fecha_aprobacion: [''],
    fecha_cumple_requisitos: [''],
  });

  private readonly selectedDepartamento = toSignal(this.form.controls.codigo_departamento.valueChanges, {
    initialValue: '',
  });
  private readonly selectedCongregacionCodigo = toSignal(this.form.controls.codigo_congregacion.valueChanges, {
    initialValue: '',
  });
  private readonly selectedSexo = toSignal(this.form.controls.sexo.valueChanges, { initialValue: '' });
  private readonly selectedEstadoCivil = toSignal(this.form.controls.estado_civil.valueChanges, {
    initialValue: '',
  });
  private readonly fechaNacimiento = toSignal(this.form.controls.fecha_nacimiento.valueChanges, {
    initialValue: '',
  });
  private readonly fechaBautismo = toSignal(this.form.controls.fecha_bautismo.valueChanges, { initialValue: '' });
  private readonly selectedEstadoValue = toSignal(this.form.controls.estado.valueChanges, {
    initialValue: this.form.controls.estado.value,
  });

  protected readonly departamentoOptions = computed<SearchSelectOption[]>(() =>
    this.departamentos().map((d) => ({ value: d.codigo_departamento, label: d.nombre_departamento })),
  );

  protected readonly municipioOptions = computed<SearchSelectOption[]>(() => {
    const depto = this.selectedDepartamento();
    return this.municipios()
      .filter((m) => !depto || m.codigo_departamento === depto)
      .map((m) => ({ value: m.codigo_municipio, label: m.nombre_municipio }));
  });

  protected readonly congregacionOptions = computed<SearchSelectOption[]>(() =>
    this.congregaciones().map((c) => ({ value: String(c.codigo_congregacion), label: c.nombre_congregacion })),
  );

  protected readonly circuitoDisplay = computed(() => {
    const codigo = this.selectedCongregacionCodigo();
    const congregacion = this.congregaciones().find((c) => String(c.codigo_congregacion) === String(codigo));
    return congregacion?.codigo_circuito ?? '—';
  });

  protected readonly edadDisplay = computed(() => yearsSince(this.fechaNacimiento()));
  protected readonly aniosBautismoDisplay = computed(() => yearsSince(this.fechaBautismo()));

  /** Datos de "Asignar lugar de entrenamiento": solo se muestran en edición y
   * únicamente si esa capacitación ya tiene fecha o lugar asignado. */
  protected readonly showPrimeraCapacitacion = computed(
    () =>
      this.mode() === 'edit' &&
      (!!this.record()?.fecha_primera_capacitacion || !!this.record()?.lugar_primera_capacitacion),
  );
  protected readonly showSegundaCapacitacion = computed(
    () =>
      this.mode() === 'edit' &&
      (!!this.record()?.fecha_segunda_capacitacion || !!this.record()?.lugar_segunda_capacitacion),
  );

  protected readonly primeraCapacitacionPunto = computed(() => {
    const codigo = this.record()?.lugar_primera_capacitacion;
    return codigo == null ? null : (this.puntos().find((p) => p.codigo_punto === codigo) ?? null);
  });
  protected readonly segundaCapacitacionPunto = computed(() => {
    const codigo = this.record()?.lugar_segunda_capacitacion;
    return codigo == null ? null : (this.puntos().find((p) => p.codigo_punto === codigo) ?? null);
  });

  protected readonly showNombreConyuge = computed(
    () => this.selectedSexo() === 'F' && NOMBRE_CONYUGE_ESTADOS_CIVILES.includes(this.selectedEstadoCivil() ?? ''),
  );

  protected readonly showFechaAprobacion = computed(
    () => this.mode() === 'edit' && this.selectedEstadoValue() === 'CUMPLE REQUISITOS',
  );

  protected readonly dialogTitle = computed(() =>
    this.mode() === 'create' ? 'Nueva solicitud' : 'Editar solicitud',
  );

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (!isOpen) {
        return;
      }
      this.matchedExistingId.set(null);
      this.dismissedDuplicateKeys.set(new Set());
      this.duplicateDialogOpen.set(false);
      if (this.mode() === 'create') {
        this.applyCreateDefaults();
      } else {
        const record = this.record();
        if (record) {
          this.populateForm(record, { enableWorkflowFields: true });
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

    this.form.controls.entrenamiento_requerido.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (this.isPatchingForm || this.mode() !== 'edit') {
        return;
      }
      if (value === 'Entrenamiento completado') {
        const today = todayIsoDate();
        this.form.controls.estado.setValue('CUMPLE REQUISITOS');
        this.form.controls.fecha_cumple_requisitos.setValue(today);
        if (!this.form.controls.fecha_aprobacion.value) {
          this.form.controls.fecha_aprobacion.setValue(today);
        }
      }
    });

    effect(() => {
      const visible = this.showNombreConyuge();
      const required = visible && this.mode() !== 'edit';
      const control = this.form.controls.nombre_conyuge;
      control.setValidators(required ? [Validators.required, Validators.maxLength(100)] : [Validators.maxLength(100)]);
      if (!visible && control.value) {
        control.setValue('', { emitEvent: false });
      }
      control.updateValueAndValidity({ emitEvent: false });
    });

    effect(() => {
      const visible = this.showNombreConyuge();
      const required = visible && this.mode() !== 'edit';
      const control = this.form.controls.apellido_casada;
      control.setValidators(required ? [Validators.required, Validators.maxLength(20)] : [Validators.maxLength(20)]);
      if (!visible && control.value) {
        control.setValue('', { emitEvent: false });
      }
      control.updateValueAndValidity({ emitEvent: false });
    });

    effect(() => {
      if (this.showFechaAprobacion() && !this.form.controls.fecha_aprobacion.value) {
        this.form.controls.fecha_aprobacion.setValue(todayIsoDate());
      }
    });

    effect(() => {
      this.configureValidatorsForMode();
    });
  }

  protected onBlurCapitalize(
    controlName:
      | 'primer_apellido'
      | 'segundo_apellido'
      | 'primer_nombre'
      | 'segundo_nombre'
      | 'apellido_casada'
      | 'nombre_conyuge'
      | 'direccion',
  ): void {
    const control = this.form.controls[controlName];
    if (typeof control.value === 'string' && control.value.length > 0) {
      control.setValue(toTitleCase(control.value), { emitEvent: false });
    }
    if (controlName !== 'direccion') {
      this.checkForDuplicates();
    }
  }

  protected onBlurCheckDuplicates(): void {
    this.checkForDuplicates();
  }

  protected onCancel(): void {
    this.form.reset();
    this.closed.emit();
  }

  protected onClear(): void {
    this.form.reset();
    this.matchedExistingId.set(null);
    if (this.mode() === 'create') {
      this.form.controls.estado.setValue('REGISTRADO');
      this.form.controls.entrenamiento_requerido.setValue('Primer entrenamiento');
    }
  }

  protected onSave(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const isEdit = this.mode() === 'edit';
    /** En modo edición los campos pueden estar vacíos (validaciones relajadas), así
     * que se guarda tal cual lo que hay en el formulario: vacío se persiste como null. */
    const toNullable = (value: string | null | undefined): string | null =>
      value && value.length > 0 ? value : null;

    const payload: PublicadorUpdatePayload = isEdit
      ? {
          primer_apellido: toNullable(raw.primer_apellido),
          segundo_apellido: toNullable(raw.segundo_apellido),
          primer_nombre: toNullable(raw.primer_nombre),
          segundo_nombre: toNullable(raw.segundo_nombre),
          direccion: toNullable(raw.direccion),
          codigo_departamento: toNullable(raw.codigo_departamento),
          codigo_municipio: toNullable(raw.codigo_municipio),
          correo_electronico: toNullable(raw.correo_electronico),
          movil: toNullable(raw.movil),
          codigo_congregacion: raw.codigo_congregacion ? Number(raw.codigo_congregacion) : null,
          fecha_nacimiento: toNullable(raw.fecha_nacimiento),
          sexo: toNullable(raw.sexo) as Sexo | null,
          fecha_bautismo: toNullable(raw.fecha_bautismo),
          estado_civil: toNullable(raw.estado_civil) as EstadoCivil | null,
          nombre_conyuge: toNullable(raw.nombre_conyuge),
          apellido_casada: toNullable(raw.apellido_casada),
          privilegio_min: toNullable(raw.privilegio_min) as PrivilegioMin | null,
          privilegio_ser: toNullable(raw.privilegio_ser) as PrivilegioSer | null,
          participo_antes: toNullable(raw.participo_antes) as ParticipoAntes | null,
          fecha_solicitud: toNullable(raw.fecha_solicitud),
          estado: toNullable(raw.estado) as EstadoSolicitud | null,
          entrenamiento_requerido: toNullable(raw.entrenamiento_requerido) as EntrenamientoRequerido | null,
        }
      : {
          primer_apellido: raw.primer_apellido!,
          segundo_apellido: raw.segundo_apellido || null,
          primer_nombre: raw.primer_nombre!,
          segundo_nombre: raw.segundo_nombre || null,
          direccion: raw.direccion!,
          codigo_departamento: raw.codigo_departamento!,
          codigo_municipio: raw.codigo_municipio!,
          correo_electronico: raw.correo_electronico!,
          movil: raw.movil!,
          codigo_congregacion: Number(raw.codigo_congregacion),
          fecha_nacimiento: raw.fecha_nacimiento!,
          sexo: raw.sexo as Sexo,
          fecha_bautismo: raw.fecha_bautismo!,
          estado_civil: raw.estado_civil as EstadoCivil,
          nombre_conyuge: raw.nombre_conyuge || null,
          apellido_casada: raw.apellido_casada || null,
          privilegio_min: raw.privilegio_min as PrivilegioMin,
          privilegio_ser: raw.privilegio_ser as PrivilegioSer,
          participo_antes: raw.participo_antes as ParticipoAntes,
          fecha_solicitud: raw.fecha_solicitud!,
          estado: raw.estado as EstadoSolicitud,
          entrenamiento_requerido: raw.entrenamiento_requerido as EntrenamientoRequerido,
        };

    if (raw.estado === 'CUMPLE REQUISITOS') {
      payload.fecha_aprobacion = isEdit ? toNullable(raw.fecha_aprobacion) : raw.fecha_aprobacion || null;
      payload.fecha_cumple_requisitos = isEdit
        ? toNullable(raw.fecha_cumple_requisitos)
        : raw.fecha_cumple_requisitos || null;
    }

    const targetId = isEdit ? this.record()!.id : this.matchedExistingId();

    this.saving.set(true);
    const request$ = targetId
      ? this.publicadoresService.update(targetId, payload)
      : this.publicadoresService.create(payload as PublicadorPayload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success(targetId ? 'Solicitud actualizada correctamente.' : 'Solicitud registrada correctamente.');
        this.form.reset();
        this.matchedExistingId.set(null);
        this.saved.emit();
        this.closed.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar la solicitud.');
      },
    });
  }

  protected async onImportS73(files: FileList | null): Promise<void> {
    const file = files?.[0] ?? null;
    if (!file) {
      return;
    }
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      this.snackbar.error('Selecciona un archivo PDF válido.');
      return;
    }
    this.importingS73.set(true);
    try {
      const bytes = await file.arrayBuffer();
      const { values, warnings } = await parseS73Pdf(bytes, this.departamentos(), this.municipios(), this.congregaciones());
      this.applyImportedData(values);
      if (warnings.length > 0) {
        this.snackbar.show(`Importado. Revisa antes de guardar: ${warnings.join(' ')}`, 'info');
      } else {
        this.snackbar.success('Datos importados desde el PDF S-73. Revisa el formulario antes de guardar.');
      }
    } catch {
      this.snackbar.error('No se pudo leer el archivo. Verifica que sea un formulario S-73 con campos rellenables.');
    } finally {
      this.importingS73.set(false);
    }
  }

  private applyImportedData(values: S73ImportValues): void {
    this.isPatchingForm = true;
    if (values.codigo_departamento) {
      this.form.controls.codigo_municipio.enable({ emitEvent: false });
    }
    this.form.patchValue(values);
    this.isPatchingForm = false;
    this.form.markAllAsTouched();
    this.checkForDuplicates();
  }

  protected onDismissDuplicate(): void {
    const reasons = this.duplicateReasons();
    if (reasons.has('movil')) {
      this.form.controls.movil.setValue('');
    }
    if (reasons.has('correo')) {
      this.form.controls.correo_electronico.setValue('');
    }
    this.duplicateDialogOpen.set(false);
  }

  protected onConfirmDuplicate(): void {
    const id = this.selectedCandidateId();
    const candidate = this.duplicateCandidates().find((c) => c.publicador.id === id);
    if (!candidate) {
      return;
    }
    this.populateForm(candidate.publicador, { enableWorkflowFields: true });
    this.matchedExistingId.set(candidate.publicador.id);
    this.duplicateDialogOpen.set(false);
    this.snackbar.show('Se cargaron los datos del registro existente. Al guardar, se actualizará esa solicitud.', 'info');
  }

  private checkForDuplicates(): void {
    if (this.duplicateDialogOpen()) {
      return;
    }
    const raw = this.form.getRawValue();
    const excludeId = this.mode() === 'edit' ? (this.record()?.id ?? null) : this.matchedExistingId();
    const candidates = findDuplicateCandidates(
      {
        primerApellido: raw.primer_apellido ?? '',
        segundoApellido: raw.segundo_apellido ?? '',
        primerNombre: raw.primer_nombre ?? '',
        segundoNombre: raw.segundo_nombre ?? '',
        movil: raw.movil ?? '',
        correoElectronico: raw.correo_electronico ?? '',
      },
      this.existingPublicadores(),
      excludeId,
    );

    if (candidates.length === 0) {
      return;
    }

    const key = candidates
      .map((c) => c.publicador.id)
      .sort()
      .join(',');
    if (this.dismissedDuplicateKeys().has(key)) {
      return;
    }

    this.duplicateCandidates.set(candidates);
    this.selectedCandidateId.set(candidates.length === 1 ? candidates[0].publicador.id : null);
    this.dismissedDuplicateKeys.update((prev) => new Set(prev).add(key));
    this.duplicateDialogOpen.set(true);
  }

  /** En "Editar solicitud" se quita Validators.required de todos los campos (las demás
   * validaciones de formato/longitud se mantienen), para permitir guardar sin poblar
   * campos que ya se encuentren vacíos. En "Nueva solicitud" se conservan las
   * validaciones originales sin cambios. */
  private configureValidatorsForMode(): void {
    const isEdit = this.mode() === 'edit';
    const req = (validators: ValidatorFn[]): ValidatorFn[] => (isEdit ? validators : [Validators.required, ...validators]);

    this.form.controls.primer_apellido.setValidators(req([Validators.maxLength(20)]));
    this.form.controls.primer_nombre.setValidators(req([Validators.maxLength(20)]));
    this.form.controls.direccion.setValidators(req([Validators.maxLength(100)]));
    this.form.controls.codigo_departamento.setValidators(req([]));
    this.form.controls.codigo_municipio.setValidators(req([]));
    this.form.controls.correo_electronico.setValidators(
      req([Validators.pattern(EMAIL_PATTERN), Validators.maxLength(100)]),
    );
    this.form.controls.movil.setValidators(req([Validators.pattern(MOVIL_PATTERN)]));
    this.form.controls.codigo_congregacion.setValidators(req([]));
    this.form.controls.fecha_nacimiento.setValidators(req([]));
    this.form.controls.sexo.setValidators(req([]));
    this.form.controls.fecha_bautismo.setValidators(req([]));
    this.form.controls.estado_civil.setValidators(req([]));
    this.form.controls.privilegio_min.setValidators(req([]));
    this.form.controls.privilegio_ser.setValidators(req([]));
    this.form.controls.participo_antes.setValidators(req([]));
    this.form.controls.fecha_solicitud.setValidators(req([]));
    this.form.controls.estado.setValidators(req([]));
    this.form.controls.entrenamiento_requerido.setValidators(req([]));

    for (const control of Object.values(this.form.controls)) {
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private applyCreateDefaults(): void {
    this.form.reset();
    this.form.controls.codigo_municipio.disable({ emitEvent: false });
    this.form.controls.estado.setValue('REGISTRADO');
    this.form.controls.entrenamiento_requerido.setValue('Primer entrenamiento');
    this.form.controls.entrenamiento_requerido.disable();
  }

  private populateForm(record: Publicador, opts: { enableWorkflowFields: boolean }): void {
    this.isPatchingForm = true;
    this.form.controls.codigo_municipio.enable({ emitEvent: false });
    if (opts.enableWorkflowFields) {
      this.form.controls.entrenamiento_requerido.enable();
    }
    this.form.patchValue({
      primer_apellido: record.primer_apellido,
      segundo_apellido: record.segundo_apellido,
      primer_nombre: record.primer_nombre,
      segundo_nombre: record.segundo_nombre,
      direccion: record.direccion,
      codigo_departamento: record.codigo_departamento,
      codigo_municipio: record.codigo_municipio,
      correo_electronico: record.correo_electronico,
      movil: record.movil,
      codigo_congregacion: String(record.codigo_congregacion),
      fecha_nacimiento: record.fecha_nacimiento,
      sexo: record.sexo,
      fecha_bautismo: record.fecha_bautismo,
      estado_civil: record.estado_civil,
      nombre_conyuge: record.nombre_conyuge ?? '',
      apellido_casada: record.apellido_casada ?? '',
      privilegio_min: record.privilegio_min,
      privilegio_ser: record.privilegio_ser,
      participo_antes: record.participo_antes,
      fecha_solicitud: record.fecha_solicitud,
      estado: record.estado,
      entrenamiento_requerido: record.entrenamiento_requerido,
      fecha_aprobacion: record.fecha_aprobacion ?? '',
      fecha_cumple_requisitos: record.fecha_cumple_requisitos ?? '',
    });
    this.isPatchingForm = false;
  }
}
