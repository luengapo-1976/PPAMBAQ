import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { SearchSelect, SearchSelectOption } from '../../shared/ui/search-select/search-select';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../core/error.interceptor';
import { AuthService } from '../../core/auth.service';
import { LookupsService } from '../solicitudes/data/lookups.service';
import { Punto } from '../configuracion/data/models';
import { formatHoraAmPm } from '../../shared/utils/format.util';
import { TurnosService } from './data/turnos.service';
import { MiTurnoResumen, SolicitarTurnoOutcome, SolicitarTurnoResultado, TurnoResumen } from './data/models';
import { ParticipanteDesktopHeader } from '../../layout/participante-desktop-header/participante-desktop-header';

type DialogState = 'closed' | 'advertencia' | 'justificacion' | 'resultado';

interface DiaFiltroOption {
  value: string;
  label: string;
}

/** Cada turno viene emparejado con otro (mismo día+horario, uno por sexo). Se agrupan
 * aquí para mostrarlos como una sola tarjeta con dos cupos, en vez de dos filas sueltas
 * que casualmente coinciden en horario. */
type EstadoPar = 'libre' | 'parcial' | 'ocupado';

interface ParTurno {
  horaInicio: string;
  horaFin: string;
  turnos: TurnoResumen[];
  disponibles: number;
  estado: EstadoPar;
}

interface GrupoDia {
  diaNumero: number;
  diaNombre: string;
  pares: ParTurno[];
}

const TODOS_LOS_DIAS = 'todos';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Component({
  selector: 'app-solicitar-turno',
  imports: [FormsModule, SearchSelect, Dialog, Button, ParticipanteDesktopHeader],
  templateUrl: './solicitar-turno.html',
  styleUrl: './solicitar-turno.scss',
})
export class SolicitarTurno {
  private readonly lookupsService = inject(LookupsService);
  private readonly turnosService = inject(TurnosService);
  private readonly snackbar = inject(SnackbarService);
  private readonly authService = inject(AuthService);

  protected readonly formatHora = formatHoraAmPm;

  protected readonly primerNombre = computed(
    () => this.authService.currentSession()?.publicador?.primer_nombre?.trim() || 'Publicador',
  );

  protected readonly puntos = signal<Punto[]>([]);
  protected readonly loadingPuntos = signal(true);

  /** null mientras se carga o si falla la consulta: en ese caso no se muestra la
   * leyenda (dato desconocido) y no se bloquea la acción en el frontend — el backend
   * igual aplica el límite como defensa, así que nunca se puede sobrepasar de verdad. */
  protected readonly misTurnosSolicitados = signal<number | null>(null);
  protected readonly misTurnosMaximo = signal(3);
  protected readonly misTurnos = signal<MiTurnoResumen[]>([]);
  protected readonly limiteAlcanzado = computed(() => {
    const solicitados = this.misTurnosSolicitados();
    return solicitados !== null && solicitados >= this.misTurnosMaximo();
  });
  protected readonly tieneMisTurnos = computed(() => (this.misTurnosSolicitados() ?? 0) > 0);
  protected readonly excedeLimite = computed(() => (this.misTurnosSolicitados() ?? 0) > this.misTurnosMaximo());

  /** Turnos a liberar para poder solicitar 1 más: hay que quedar en máximo-1, no en
   * máximo, así que al excedente sobre el máximo se le suma 1. */
  protected readonly turnosALiberar = computed(
    () => (this.misTurnosSolicitados() ?? 0) - this.misTurnosMaximo() + 1,
  );

  protected readonly puntoOptions = computed<SearchSelectOption[]>(() =>
    [...this.puntos()]
      .filter((punto) => punto.estado === 'Activo')
      .sort((a, b) => a.nombre_punto.localeCompare(b.nombre_punto, 'es'))
      .map((punto) => ({ value: String(punto.codigo_punto), label: punto.nombre_punto })),
  );

  protected readonly selectedCodigoPunto = signal<string | null>(null);
  protected readonly puntoSeleccionado = computed<Punto | null>(() => {
    const codigo = this.selectedCodigoPunto();
    if (!codigo) {
      return null;
    }
    return this.puntos().find((punto) => String(punto.codigo_punto) === codigo) ?? null;
  });

  protected readonly turnos = signal<TurnoResumen[]>([]);
  protected readonly loadingTurnos = signal(false);
  protected readonly solicitandoIds = signal<ReadonlySet<string>>(new Set());

  protected readonly selectedDiaFiltro = signal<string>(TODOS_LOS_DIAS);
  protected readonly soloDisponibles = signal(false);

  /** Datos de contacto del punto (encargado/móvil) se ocultan por defecto: no son
   * necesarios para la tarea principal (elegir un turno) y sacarlos del flujo
   * reduce el scroll hasta la lista de horarios. */
  protected readonly contactoExpandido = signal(false);

  protected readonly diaOptions = computed<DiaFiltroOption[]>(() => {
    const dias = new Map<number, string>();
    for (const turno of this.turnos()) {
      if (!dias.has(turno.dia_numero)) {
        dias.set(turno.dia_numero, turno.dia_nombre);
      }
    }
    return [
      { value: TODOS_LOS_DIAS, label: 'Todos los días' },
      ...[...dias.entries()].sort(([a], [b]) => a - b).map(([numero, nombre]) => ({ value: String(numero), label: nombre })),
    ];
  });

  private readonly turnosFiltrados = computed<TurnoResumen[]>(() => {
    const filtro = this.selectedDiaFiltro();
    return filtro === TODOS_LOS_DIAS ? this.turnos() : this.turnos().filter((t) => String(t.dia_numero) === filtro);
  });

  protected readonly mostrarFiltroDia = computed(() => this.diaOptions().length > 2);

  protected readonly turnosEmptyMensaje = computed(() => {
    if (this.selectedDiaFiltro() !== TODOS_LOS_DIAS && this.turnos().length > 0) {
      return 'Este punto no tiene turnos ese día. Elige otro día o "Todos los días".';
    }
    if (this.soloDisponibles() && this.turnos().length > 0) {
      return 'No hay turnos disponibles con este filtro. Desmarca "Filtrar solo los disponibles" para ver todos.';
    }
    return 'Este punto todavía no tiene turnos configurados.';
  });

  protected readonly gruposPorDia = computed<GrupoDia[]>(() => {
    const dias = new Map<number, { diaNombre: string; pares: Map<string, TurnoResumen[]> }>();

    for (const turno of this.turnosFiltrados()) {
      let dia = dias.get(turno.dia_numero);
      if (!dia) {
        dia = { diaNombre: turno.dia_nombre, pares: new Map() };
        dias.set(turno.dia_numero, dia);
      }
      const clave = `${turno.hora_inicio}|${turno.hora_fin}`;
      const par = dia.pares.get(clave) ?? [];
      par.push(turno);
      dia.pares.set(clave, par);
    }

    return [...dias.entries()]
      .sort(([a], [b]) => a - b)
      .map(([diaNumero, { diaNombre, pares }]) => ({
        diaNumero,
        diaNombre,
        pares: [...pares.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, turnosPar]) => {
            const disponibles = turnosPar.filter((t) => t.disponibilidad !== 'ocupado').length;
            const estado: EstadoPar =
              disponibles === 0 ? 'ocupado' : disponibles === turnosPar.length ? 'libre' : 'parcial';
            return {
              horaInicio: turnosPar[0].hora_inicio,
              horaFin: turnosPar[0].hora_fin,
              turnos: turnosPar,
              disponibles,
              estado,
            };
          }),
      }));
  });

  /** Con "solo disponibles" activo, se quitan las parejas totalmente ocupadas (y los
   * días que se quedan sin ninguna pareja) sin recalcular el agrupamiento en sí. */
  protected readonly gruposPorDiaVisibles = computed<GrupoDia[]>(() => {
    if (!this.soloDisponibles()) {
      return this.gruposPorDia();
    }
    return this.gruposPorDia()
      .map((grupo) => ({ ...grupo, pares: grupo.pares.filter((par) => par.estado !== 'ocupado') }))
      .filter((grupo) => grupo.pares.length > 0);
  });

  protected readonly resumenTurnos = computed(() => {
    let turnos = 0;
    let disponibles = 0;
    for (const grupo of this.gruposPorDiaVisibles()) {
      for (const par of grupo.pares) {
        turnos++;
        disponibles += par.disponibles;
      }
    }
    return { turnos, disponibles };
  });

  protected readonly dialogState = signal<DialogState>('closed');
  protected readonly dialogMensaje = signal('');
  protected readonly dialogTitulo = signal('');
  protected readonly dialogResultadoOutcome = signal<SolicitarTurnoOutcome | null>(null);

  /** Resalta en negrita el nombre y el móvil del encargado dentro del mensaje del
   * diálogo (texto libre proveniente del backend), para que destaquen del resto
   * del párrafo sin depender de que el backend los marque explícitamente. */
  protected readonly dialogMensajeHtml = computed(() => {
    const mensajeEscapado = escapeHtml(this.dialogMensaje());
    const punto = this.puntoSeleccionado();
    const destacar = [punto?.encargado, punto?.movil].filter((v): v is string => !!v?.trim());

    return destacar.reduce((texto, valor) => {
      const valorEscapado = escapeHtml(valor);
      const patron = new RegExp(escapeRegExp(valorEscapado), 'g');
      return texto.replace(patron, `<strong>${valorEscapado}</strong>`);
    }, mensajeEscapado);
  });
  protected readonly justificacion = signal('');
  protected readonly enviandoJustificacion = signal(false);
  private turnoEnConflicto: TurnoResumen | null = null;

  /** Los botones del toolbar del diálogo se mantienen siempre presentes (nunca dentro
   * de un @if) para que app-dialog los proyecte de forma confiable en su slot
   * [dialogToolbar]; solo cambian de etiqueta/acción/visibilidad según el estado. */
  protected readonly primaryLabel = computed(() => {
    switch (this.dialogState()) {
      case 'advertencia':
        return 'Continuar';
      case 'justificacion':
        return this.enviandoJustificacion() ? 'Enviando…' : 'Enviar solicitud';
      case 'resultado':
        return 'Entendido';
      default:
        return '';
    }
  });

  protected readonly primaryDisabled = computed(
    () => this.dialogState() === 'justificacion' && (!this.justificacion().trim() || this.enviandoJustificacion()),
  );

  protected readonly showSecondary = computed(
    () => this.dialogState() === 'advertencia' || this.dialogState() === 'justificacion',
  );

  protected onPrimaryAction(): void {
    switch (this.dialogState()) {
      case 'advertencia':
        this.onContinuarConJustificacion();
        break;
      case 'justificacion':
        this.onEnviarJustificacion();
        break;
      case 'resultado':
        this.onCerrarResultado();
        break;
    }
  }

  constructor() {
    this.lookupsService.getPuntos().subscribe({
      next: (data) => {
        this.puntos.set(data);
        this.loadingPuntos.set(false);
      },
      error: () => {
        this.loadingPuntos.set(false);
        this.snackbar.error('No se pudo cargar el listado de puntos.');
      },
    });

    this.cargarConteoTurnos();
  }

  private cargarConteoTurnos(): void {
    this.turnosService.contarSolicitados().subscribe({
      next: (conteo) => {
        this.misTurnosSolicitados.set(conteo.solicitados);
        this.misTurnosMaximo.set(conteo.maximo);
        this.misTurnos.set(conteo.turnos);
      },
      error: () => {
        this.misTurnosSolicitados.set(null);
      },
    });
  }

  protected onSeleccionarPunto(codigo: string | null): void {
    this.selectedCodigoPunto.set(codigo);
    this.selectedDiaFiltro.set(TODOS_LOS_DIAS);
    this.contactoExpandido.set(false);
    this.turnos.set([]);
    if (!codigo) {
      return;
    }
    this.cargarTurnos(Number(codigo));
  }

  protected onToggleContacto(): void {
    this.contactoExpandido.update((v) => !v);
  }

  protected isSolicitando(turnoId: string): boolean {
    return this.solicitandoIds().has(turnoId);
  }

  protected etiquetaDisponibilidad(turno: TurnoResumen): string {
    switch (turno.disponibilidad) {
      case 'disponible_hermano':
        return 'Disponible para un hermano';
      case 'disponible_hermana':
        return 'Disponible para una hermana';
      default:
        return 'Disponible';
    }
  }

  protected onSolicitar(turno: TurnoResumen): void {
    if (this.limiteAlcanzado()) {
      return;
    }
    this.enviarSolicitud(turno, undefined);
  }

  protected onDialogClosed(): void {
    if (this.dialogState() === 'resultado') {
      this.onCerrarResultado();
    } else {
      this.onCancelarDialog();
    }
  }

  protected onCancelarDialog(): void {
    this.dialogState.set('closed');
    this.turnoEnConflicto = null;
    this.justificacion.set('');
  }

  protected onContinuarConJustificacion(): void {
    this.dialogTitulo.set('Cuéntanos tu justificación');
    this.dialogState.set('justificacion');
  }

  protected onEnviarJustificacion(): void {
    const turno = this.turnoEnConflicto;
    const texto = this.justificacion().trim();
    if (!turno || !texto || this.enviandoJustificacion()) {
      return;
    }
    this.enviandoJustificacion.set(true);
    this.enviarSolicitud(turno, texto, () => this.enviandoJustificacion.set(false));
  }

  protected onCerrarResultado(): void {
    this.dialogState.set('closed');
    this.turnoEnConflicto = null;
    this.justificacion.set('');
    this.cargarConteoTurnos();
    const codigo = this.selectedCodigoPunto();
    if (codigo) {
      this.cargarTurnos(Number(codigo));
    }
  }

  private enviarSolicitud(turno: TurnoResumen, justificacion: string | undefined, onDone?: () => void): void {
    this.setSolicitando(turno.id, true);
    this.turnosService.solicitar(turno.id, justificacion).subscribe({
      next: (resultado) => {
        this.setSolicitando(turno.id, false);
        onDone?.();
        this.manejarResultado(turno, resultado);
      },
      error: (err: ApiError) => {
        this.setSolicitando(turno.id, false);
        onDone?.();
        this.snackbar.error(err?.message ?? 'No se pudo procesar la solicitud. Intenta nuevamente.');
      },
    });
  }

  private manejarResultado(turno: TurnoResumen, resultado: SolicitarTurnoResultado): void {
    if (resultado.outcome === 'requiere_justificacion') {
      this.turnoEnConflicto = turno;
      this.dialogMensaje.set(resultado.mensaje);
      this.dialogTitulo.set('Antes de continuar');
      this.justificacion.set('');
      this.dialogState.set('advertencia');
      return;
    }

    this.dialogMensaje.set(resultado.mensaje);
    this.dialogTitulo.set(resultado.outcome === 'aprobado' ? 'Solicitud aprobada' : 'Solicitud enviada');
    this.dialogResultadoOutcome.set(resultado.outcome);
    this.dialogState.set('resultado');
  }

  private setSolicitando(turnoId: string, activo: boolean): void {
    this.solicitandoIds.update((ids) => {
      const next = new Set(ids);
      if (activo) {
        next.add(turnoId);
      } else {
        next.delete(turnoId);
      }
      return next;
    });
  }

  private cargarTurnos(codigoPunto: number): void {
    this.loadingTurnos.set(true);
    this.turnosService
      .findByCodigoPunto(codigoPunto)
      .pipe(
        catchError(() => {
          this.snackbar.error('No se pudo cargar los horarios de este punto.');
          return of<TurnoResumen[]>([]);
        }),
      )
      .subscribe((data) => {
        this.turnos.set(data);
        this.loadingTurnos.set(false);
      });
  }
}
