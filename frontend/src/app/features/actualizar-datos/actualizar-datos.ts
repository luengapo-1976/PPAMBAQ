import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { Select, SelectOption } from '../../shared/ui/select/select';
import { SearchSelect, SearchSelectOption } from '../../shared/ui/search-select/search-select';
import { FormField } from '../../shared/ui/form-field/form-field';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../core/error.interceptor';
import { AuthService } from '../../core/auth.service';
import { LookupsService } from '../solicitudes/data/lookups.service';
import {
  Congregacion,
  Departamento,
  Municipio,
  Publicador,
  PublicadorUpdatePayload,
} from '../solicitudes/data/models';
import {
  EMAIL_PATTERN,
  MOVIL_PATTERN,
  toDateInputValue,
  toTitleCase,
  yearsSince,
} from '../solicitudes/data/publicador.utils';
import { MisDatosService } from './data/mis-datos.service';
import { ParticipanteDesktopHeader } from '../../layout/participante-desktop-header/participante-desktop-header';

type BajaPaso = 'cerrado' | 'advertencia' | 'justificacion' | 'confirmacion';

const ESTADO_CIVIL_OPTIONS: SelectOption[] = [
  'Casado',
  'Soltero',
  'Divorciado',
  'Separado',
  'Viudo',
].map((value) => ({
  value,
  label: value,
}));
const PRIVILEGIO_MIN_OPTIONS: SelectOption[] = ['Ninguno', 'Anciano', 'Siervo ministerial'].map(
  (value) => ({
    value,
    label: value,
  }),
);
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
const NOMBRE_CONYUGE_ESTADOS_CIVILES = ['Casado', 'Separado'];

@Component({
  selector: 'app-actualizar-datos',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    Dialog,
    Button,
    Select,
    SearchSelect,
    FormField,
    ParticipanteDesktopHeader,
  ],
  templateUrl: './actualizar-datos.html',
  styleUrl: './actualizar-datos.scss',
})
export class ActualizarDatos {
  private readonly fb = inject(FormBuilder);
  private readonly misDatosService = inject(MisDatosService);
  private readonly lookupsService = inject(LookupsService);
  private readonly snackbar = inject(SnackbarService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly estadoCivilOptions = ESTADO_CIVIL_OPTIONS;
  protected readonly privilegioMinOptions = PRIVILEGIO_MIN_OPTIONS;
  protected readonly privilegioSerOptions = PRIVILEGIO_SER_OPTIONS;
  protected readonly participoAntesOptions = PARTICIPO_ANTES_OPTIONS;
  protected readonly sexoOptions = SEXO_OPTIONS;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly datosDesactualizados = this.authService.requiereActualizacionDatos;
  /** Solo se activa cuando el guardado resuelve una actualización obligatoria: al
   * cerrar el diálogo de confirmación, en vez de quedarse en la página, se lleva al
   * publicador a Inicio (ya recuperó acceso normal al resto del menú). */
  private irAInicioAlCerrar = false;
  protected readonly resultadoAbierto = signal(false);
  protected readonly dialogMensaje = signal('');

  protected readonly primerNombre = signal('Publicador');
  protected readonly bajaPaso = signal<BajaPaso>('cerrado');
  protected readonly bajaJustificacion = signal('');
  protected readonly bajaEnviando = signal(false);
  protected readonly bajaMensaje = signal('');

  protected readonly bajaTitulo = computed(() => {
    switch (this.bajaPaso()) {
      case 'justificacion':
        return 'Cuéntanos el motivo';
      case 'confirmacion':
        return 'Baja registrada';
      default:
        return 'Esta acción es irreversible';
    }
  });

  protected readonly bajaPrimaryLabel = computed(() => {
    switch (this.bajaPaso()) {
      case 'justificacion':
        return this.bajaEnviando() ? 'Enviando…' : 'Enviar solicitud';
      case 'confirmacion':
        return 'Entendido';
      default:
        return 'Entiendo y deseo continuar';
    }
  });

  protected readonly bajaPrimaryVariant = computed(() =>
    this.bajaPaso() === 'confirmacion' ? 'primary' : 'danger',
  );

  protected readonly bajaPrimaryDisabled = computed(
    () =>
      this.bajaPaso() === 'justificacion' &&
      (!this.bajaJustificacion().trim() || this.bajaEnviando()),
  );

  protected readonly bajaMuestraCancelar = computed(
    () => this.bajaPaso() === 'advertencia' || this.bajaPaso() === 'justificacion',
  );

  protected readonly departamentos = signal<Departamento[]>([]);
  protected readonly municipios = signal<Municipio[]>([]);
  protected readonly congregaciones = signal<Congregacion[]>([]);

  protected readonly form = this.fb.group({
    primer_apellido: ['', [Validators.maxLength(20)]],
    segundo_apellido: ['', [Validators.maxLength(20)]],
    primer_nombre: ['', [Validators.maxLength(20)]],
    segundo_nombre: ['', [Validators.maxLength(20)]],
    direccion: ['', [Validators.maxLength(100)]],
    codigo_departamento: [''],
    codigo_municipio: [''],
    correo_electronico: ['', [Validators.pattern(EMAIL_PATTERN), Validators.maxLength(100)]],
    movil: ['', [Validators.pattern(MOVIL_PATTERN)]],
    codigo_congregacion: [''],
    fecha_nacimiento: [''],
    sexo: [''],
    fecha_bautismo: [''],
    estado_civil: [''],
    nombre_conyuge: ['', [Validators.maxLength(100)]],
    apellido_casada: ['', [Validators.maxLength(20)]],
    privilegio_min: [''],
    privilegio_ser: [''],
    participo_antes: [''],
  });

  private readonly selectedDepartamento = toSignal(
    this.form.controls.codigo_departamento.valueChanges,
    {
      initialValue: '',
    },
  );
  private readonly selectedCongregacionCodigo = toSignal(
    this.form.controls.codigo_congregacion.valueChanges,
    {
      initialValue: '',
    },
  );
  private readonly selectedSexo = toSignal(this.form.controls.sexo.valueChanges, {
    initialValue: '',
  });
  private readonly selectedEstadoCivil = toSignal(this.form.controls.estado_civil.valueChanges, {
    initialValue: '',
  });
  private readonly fechaNacimiento = toSignal(this.form.controls.fecha_nacimiento.valueChanges, {
    initialValue: '',
  });
  private readonly fechaBautismo = toSignal(this.form.controls.fecha_bautismo.valueChanges, {
    initialValue: '',
  });

  protected readonly departamentoOptions = computed<SearchSelectOption[]>(() =>
    this.departamentos().map((d) => ({
      value: d.codigo_departamento,
      label: d.nombre_departamento,
    })),
  );

  protected readonly municipioOptions = computed<SearchSelectOption[]>(() => {
    const depto = this.selectedDepartamento();
    return this.municipios()
      .filter((m) => !depto || m.codigo_departamento === depto)
      .map((m) => ({ value: m.codigo_municipio, label: m.nombre_municipio }));
  });

  protected readonly congregacionOptions = computed<SearchSelectOption[]>(() =>
    this.congregaciones().map((c) => ({
      value: String(c.codigo_congregacion),
      label: c.nombre_congregacion,
    })),
  );

  protected readonly circuitoDisplay = computed(() => {
    const codigo = this.selectedCongregacionCodigo();
    const congregacion = this.congregaciones().find(
      (c) => String(c.codigo_congregacion) === String(codigo),
    );
    return congregacion?.codigo_circuito ?? '-';
  });

  protected readonly edadDisplay = computed(() => yearsSince(this.fechaNacimiento()));
  protected readonly aniosBautismoDisplay = computed(() => yearsSince(this.fechaBautismo()));

  protected readonly showNombreConyuge = computed(
    () =>
      this.selectedSexo() === 'F' &&
      NOMBRE_CONYUGE_ESTADOS_CIVILES.includes(this.selectedEstadoCivil() ?? ''),
  );

  constructor() {
    this.lookupsService.getDepartamentos().subscribe((data) => this.departamentos.set(data));
    this.lookupsService.getMunicipios().subscribe((data) => this.municipios.set(data));
    this.lookupsService.getCongregaciones().subscribe((data) => this.congregaciones.set(data));

    this.form.controls.codigo_departamento.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((depto) => {
        const municipioControl = this.form.controls.codigo_municipio;
        const current = municipioControl.value;
        const stillValid = this.municipios().some(
          (m) => m.codigo_municipio === current && m.codigo_departamento === depto,
        );
        if (current && !stillValid) {
          municipioControl.setValue('');
        }
      });

    this.cargarMisDatos();
  }

  private cargarMisDatos(): void {
    this.loading.set(true);
    this.misDatosService.obtener().subscribe({
      next: (publicador) => {
        this.populateForm(publicador);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar tu información.');
      },
    });
  }

  private populateForm(record: Publicador): void {
    this.primerNombre.set(record.primer_nombre?.trim() || 'Publicador');
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
      codigo_congregacion:
        record.codigo_congregacion != null ? String(record.codigo_congregacion) : '',
      fecha_nacimiento: toDateInputValue(record.fecha_nacimiento),
      sexo: record.sexo,
      fecha_bautismo: toDateInputValue(record.fecha_bautismo),
      estado_civil: record.estado_civil,
      nombre_conyuge: record.nombre_conyuge ?? '',
      apellido_casada: record.apellido_casada ?? '',
      privilegio_min: record.privilegio_min,
      privilegio_ser: record.privilegio_ser,
      participo_antes: record.participo_antes,
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
  }

  protected onGuardar(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const toNullable = (value: string | null | undefined): string | null =>
      value && value.length > 0 ? value : null;

    const payload: PublicadorUpdatePayload = {
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
      sexo: toNullable(raw.sexo) as Publicador['sexo'] | null,
      fecha_bautismo: toNullable(raw.fecha_bautismo),
      estado_civil: toNullable(raw.estado_civil) as Publicador['estado_civil'] | null,
      nombre_conyuge: toNullable(raw.nombre_conyuge),
      apellido_casada: toNullable(raw.apellido_casada),
      privilegio_min: toNullable(raw.privilegio_min) as Publicador['privilegio_min'] | null,
      privilegio_ser: toNullable(raw.privilegio_ser) as Publicador['privilegio_ser'] | null,
      participo_antes: toNullable(raw.participo_antes) as Publicador['participo_antes'] | null,
    };

    const eraActualizacionForzada = this.datosDesactualizados();
    this.saving.set(true);
    this.misDatosService.actualizar(payload).subscribe({
      next: (resultado) => {
        this.saving.set(false);
        this.authService.marcarDatosActualizados();
        this.irAInicioAlCerrar = eraActualizacionForzada;
        this.dialogMensaje.set(resultado.mensaje);
        this.resultadoAbierto.set(true);
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar tus datos. Intenta nuevamente.');
      },
    });
  }

  protected onCerrarResultado(): void {
    this.resultadoAbierto.set(false);
    if (this.irAInicioAlCerrar) {
      this.irAInicioAlCerrar = false;
      this.router.navigateByUrl('/inicio');
      return;
    }
    this.cargarMisDatos();
  }

  protected onAbrirBaja(): void {
    this.bajaJustificacion.set('');
    this.bajaPaso.set('advertencia');
  }

  protected onContinuarBaja(): void {
    this.bajaPaso.set('justificacion');
  }

  protected onCancelarBaja(): void {
    this.bajaPaso.set('cerrado');
  }

  protected onBajaDialogClosed(): void {
    if (this.bajaPaso() === 'confirmacion') {
      this.onCerrarBajaConfirmacion();
    } else {
      this.onCancelarBaja();
    }
  }

  protected onBajaPrimaryAction(): void {
    switch (this.bajaPaso()) {
      case 'advertencia':
        this.onContinuarBaja();
        break;
      case 'justificacion':
        this.onEnviarBaja();
        break;
      case 'confirmacion':
        this.onCerrarBajaConfirmacion();
        break;
    }
  }

  protected onEnviarBaja(): void {
    const justificacion = this.bajaJustificacion().trim();
    if (!justificacion || this.bajaEnviando()) {
      return;
    }
    this.bajaEnviando.set(true);
    this.misDatosService.solicitarBaja(justificacion).subscribe({
      next: (resultado) => {
        this.bajaEnviando.set(false);
        this.bajaMensaje.set(resultado.mensaje);
        this.bajaPaso.set('confirmacion');
      },
      error: (err: ApiError) => {
        this.bajaEnviando.set(false);
        this.snackbar.error(
          err?.message ?? 'No se pudo registrar tu solicitud de baja. Intenta nuevamente.',
        );
      },
    });
  }

  protected onCerrarBajaConfirmacion(): void {
    this.bajaPaso.set('cerrado');
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
