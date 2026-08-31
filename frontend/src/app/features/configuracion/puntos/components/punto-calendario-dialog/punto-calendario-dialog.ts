import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Dialog } from '../../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../../shared/ui/button/button';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { Switch } from '../../../../../shared/ui/switch/switch';
import { SnackbarService } from '../../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../../core/error.interceptor';
import { TurnosService } from '../../../../solicitar-turno/data/turnos.service';
import {
  CrearTurnoPayload,
  EstadoTurno,
  TurnoResumen,
} from '../../../../solicitar-turno/data/models';
import { Departamento, Municipio, Punto } from '../../../data/models';
import { formatHoraAmPm, etiquetaDisponibilidad } from '../../../../../shared/utils/format.util';
import { exportPuntoCalendarioToPdf } from '../../../data/punto-calendario-pdf.util';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
/** Índice 0=domingo, igual que Date.getDay(), para poder ubicar el día actual dentro
 * de DIAS_SEMANA (que empieza en lunes) al abrir el diálogo. */
const DIAS_JS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export interface FilaCalendario {
  horaInicio: string;
  horaFin: string;
  celdas: TurnoResumen[][];
}

@Component({
  selector: 'app-punto-calendario-dialog',
  imports: [Dialog, Button, Select, Switch, FormsModule],
  templateUrl: './punto-calendario-dialog.html',
  styleUrl: './punto-calendario-dialog.scss',
})
export class PuntoCalendarioDialog {
  private readonly turnosService = inject(TurnosService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  /** Punto(s) que se pueden ver en este diálogo. Con más de uno (caso del encargado
   * con varios puntos a cargo) se muestra un selector arriba de la información. */
  readonly puntos = input<Punto[]>([]);
  readonly departamentos = input<Departamento[]>([]);
  readonly municipios = input<Municipio[]>([]);
  /** Solo true desde "Datos maestros > Puntos" (uso administrativo): habilita el
   * interruptor de activar/inactivar cada horario y el botón "Habilitar nuevo
   * horario". En cualquier otro uso (el encargado viendo el calendario de su propio
   * punto desde Inicio) queda en false: la vista es de solo consulta y, además, los
   * horarios inactivos ni siquiera se muestran, igual que en Solicitar turno. */
  readonly editable = input(false);

  readonly closed = output<void>();

  protected readonly diasSemana = DIAS_SEMANA;
  protected readonly loading = signal(false);
  protected readonly descargando = signal(false);
  protected readonly turnos = signal<TurnoResumen[]>([]);
  protected readonly formatHora = formatHoraAmPm;
  protected readonly etiquetaDisponibilidad = etiquetaDisponibilidad;

  /** Código del punto elegido en el selector (solo relevante cuando puntos().length > 1). */
  protected readonly selectedCodigoPunto = signal<number | null>(null);

  protected readonly punto = computed<Punto | null>(() => {
    const lista = this.puntos();
    const seleccionado = this.selectedCodigoPunto();
    return lista.find((p) => p.codigo_punto === seleccionado) ?? lista[0] ?? null;
  });

  protected readonly puntoOptions = computed<SelectOption[]>(() =>
    this.puntos().map((p) => ({ value: String(p.codigo_punto), label: p.nombre_punto })),
  );

  protected readonly selectedCodigoPuntoStr = computed(() => {
    const codigo = this.punto()?.codigo_punto;
    return codigo !== undefined ? String(codigo) : null;
  });

  protected readonly nombreDepartamento = computed(() => {
    const punto = this.punto();
    if (!punto) {
      return '';
    }
    return (
      this.departamentos().find((d) => d.codigo_departamento === punto.codigo_departamento)
        ?.nombre_departamento ?? punto.codigo_departamento
    );
  });

  protected readonly nombreMunicipio = computed(() => {
    const punto = this.punto();
    if (!punto) {
      return '';
    }
    return (
      this.municipios().find((m) => m.codigo_municipio === punto.codigo_municipio)
        ?.nombre_municipio ?? punto.codigo_municipio
    );
  });

  /** Solo se usa en la vista móvil (agenda por día); la vista de escritorio/tablet
   * sigue mostrando la cuadrícula completa de los 7 días. */
  protected readonly diaSeleccionado = signal(DIAS_JS[new Date().getDay()]);
  private readonly diaSeleccionadoIndex = computed(() =>
    Math.max(this.diasSemana.indexOf(this.diaSeleccionado()), 0),
  );

  /** En modo editable (admin) se ven todos los horarios, activos e inactivos, para
   * poder gestionarlos. En modo de solo consulta, un horario inactivo se excluye
   * por completo — no debe ser visible para los publicadores. */
  protected readonly turnosVisibles = computed<TurnoResumen[]>(() => {
    const lista = this.turnos();
    return this.editable() ? lista : lista.filter((t) => t.estado_turno !== 'INACTIVO');
  });

  protected readonly filas = computed<FilaCalendario[]>(() => {
    const lista = this.turnosVisibles();
    const horarios = new Map<string, { horaInicio: string; horaFin: string }>();
    for (const turno of lista) {
      horarios.set(`${turno.hora_inicio}|${turno.hora_fin}`, {
        horaInicio: turno.hora_inicio,
        horaFin: turno.hora_fin,
      });
    }
    return [...horarios.values()]
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      .map((horario) => ({
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        celdas: DIAS_SEMANA.map((dia) =>
          lista.filter(
            (turno) =>
              turno.dia_nombre === dia &&
              turno.hora_inicio === horario.horaInicio &&
              turno.hora_fin === horario.horaFin,
          ),
        ),
      }));
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const lista = this.puntos();
      const actual = this.selectedCodigoPunto();
      if (!isOpen || lista.length === 0) {
        this.turnos.set([]);
        return;
      }
      const codigo = lista.some((p) => p.codigo_punto === actual) ? actual! : lista[0].codigo_punto;
      if (codigo !== actual) {
        // Dispara un nuevo ciclo del effect con la selección ya resuelta.
        this.selectedCodigoPunto.set(codigo);
        return;
      }
      this.diaSeleccionado.set(DIAS_JS[new Date().getDay()]);
      this.cargarTurnos(codigo);
    });
  }

  protected onSeleccionarPunto(codigo: string | null): void {
    if (codigo === null) {
      return;
    }
    this.selectedCodigoPunto.set(Number(codigo));
  }

  protected onClosed(): void {
    this.closed.emit();
  }

  // ---------- Activar / inactivar un horario (solo editable) ----------
  // El switche se muestra una sola vez por celda (día + hora), pero un horario
  // tiene dos cupos en la tabla turnos (uno por integrante de la pareja): activar
  // o inactivar afecta a los dos cupos de esa celda a la vez.

  protected readonly actualizandoCeldaKey = signal<string | null>(null);

  protected claveCelda(turnos: TurnoResumen[]): string {
    const t = turnos[0];
    return t ? `${t.dia_nombre}|${t.hora_inicio}|${t.hora_fin}` : '';
  }

  protected onToggleEstadoTurno(turnos: TurnoResumen[]): void {
    if (turnos.length === 0 || this.actualizandoCeldaKey()) {
      return;
    }
    const clave = this.claveCelda(turnos);
    const nuevoEstado: EstadoTurno = turnos[0].estado_turno === 'INACTIVO' ? 'ACTIVO' : 'INACTIVO';
    this.actualizandoCeldaKey.set(clave);
    forkJoin(turnos.map((t) => this.turnosService.actualizarEstado(t.id, nuevoEstado))).subscribe({
      next: () => {
        this.actualizandoCeldaKey.set(null);
        this.snackbar.success(
          nuevoEstado === 'ACTIVO' ? 'Horario activado.' : 'Horario inactivado.',
        );
        const codigo = this.punto()?.codigo_punto;
        if (codigo) {
          this.cargarTurnos(codigo);
        }
      },
      error: (err: ApiError) => {
        this.actualizandoCeldaKey.set(null);
        this.snackbar.error(err?.message ?? 'No se pudo actualizar el estado del horario.');
      },
    });
  }

  // ---------- Habilitar nuevo horario (solo editable) ----------

  protected readonly nuevoHorarioAbierto = signal(false);
  protected readonly nuevoHorarioDia = signal<string | null>(null);
  protected readonly nuevoHorarioHoraInicio = signal('');
  protected readonly nuevoHorarioHoraFin = signal('');
  protected readonly creandoHorario = signal(false);

  protected readonly diaOptionsNuevoHorario = computed<SelectOption[]>(() =>
    DIAS_SEMANA.map((dia) => ({ value: dia, label: dia })),
  );

  protected readonly horaOrdenValido = computed(() => {
    const inicio = this.nuevoHorarioHoraInicio();
    const fin = this.nuevoHorarioHoraFin();
    return !inicio || !fin || fin > inicio;
  });

  protected readonly nuevoHorarioValido = computed(
    () =>
      !!this.nuevoHorarioDia() &&
      !!this.nuevoHorarioHoraInicio() &&
      !!this.nuevoHorarioHoraFin() &&
      this.horaOrdenValido(),
  );

  protected onAbrirNuevoHorario(): void {
    this.nuevoHorarioDia.set(null);
    this.nuevoHorarioHoraInicio.set('');
    this.nuevoHorarioHoraFin.set('');
    this.nuevoHorarioAbierto.set(true);
  }

  protected onCancelarNuevoHorario(): void {
    this.nuevoHorarioAbierto.set(false);
  }

  protected onGuardarNuevoHorario(): void {
    const codigo = this.punto()?.codigo_punto;
    const dia = this.nuevoHorarioDia();
    if (!codigo || !dia || !this.nuevoHorarioValido() || this.creandoHorario()) {
      return;
    }
    this.creandoHorario.set(true);
    this.turnosService
      .crear({
        codigo_punto: codigo,
        dia_nombre: dia as CrearTurnoPayload['dia_nombre'],
        hora_inicio: this.nuevoHorarioHoraInicio(),
        hora_fin: this.nuevoHorarioHoraFin(),
      })
      .subscribe({
        next: () => {
          this.creandoHorario.set(false);
          this.nuevoHorarioAbierto.set(false);
          this.snackbar.success('Horario habilitado correctamente.');
          this.cargarTurnos(codigo);
        },
        error: (err: ApiError) => {
          this.creandoHorario.set(false);
          this.snackbar.error(err?.message ?? 'No se pudo habilitar el nuevo horario.');
        },
      });
  }

  /** Cupos del día elegido para esa fila (agenda móvil) — misma información que la
   * celda correspondiente de la cuadrícula de escritorio. */
  protected celdaDelDia(fila: FilaCalendario): TurnoResumen[] {
    return fila.celdas[this.diaSeleccionadoIndex()] ?? [];
  }

  protected async onDescargarPdf(): Promise<void> {
    const punto = this.punto();
    if (!punto || this.descargando()) {
      return;
    }
    this.descargando.set(true);
    try {
      await exportPuntoCalendarioToPdf({
        punto,
        nombreDepartamento: this.nombreDepartamento(),
        nombreMunicipio: this.nombreMunicipio(),
        filas: this.filas(),
        diasSemana: this.diasSemana,
      });
    } finally {
      this.descargando.set(false);
    }
  }

  private cargarTurnos(codigoPunto: number): void {
    this.loading.set(true);
    this.turnosService.findByCodigoPunto(codigoPunto).subscribe({
      next: (data) => {
        this.turnos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.turnos.set([]);
        this.loading.set(false);
      },
    });
  }
}
