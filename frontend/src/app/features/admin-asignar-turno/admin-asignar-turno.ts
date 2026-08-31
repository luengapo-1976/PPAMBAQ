import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { SearchSelect, SearchSelectOption } from '../../shared/ui/search-select/search-select';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../core/error.interceptor';
import { LookupsService } from '../solicitudes/data/lookups.service';
import { Punto } from '../configuracion/data/models';
import { formatHoraAmPm } from '../../shared/utils/format.util';
import { TurnosService } from '../solicitar-turno/data/turnos.service';
import { publicadorSearchOptions } from '../solicitar-turno/data/publicador-picker.util';
import {
  ConteoTurnosPublicador,
  SolicitarTurnoOutcome,
  SolicitarTurnoResultado,
  TurnoResumen,
} from '../solicitar-turno/data/models';
import { PublicadoresService } from '../solicitudes/data/publicadores.service';
import { Publicador } from '../solicitudes/data/models';

type DialogState = 'closed' | 'publicador' | 'advertencia' | 'justificacion' | 'resultado';

interface DiaFiltroOption {
  value: string;
  label: string;
}

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
  selector: 'app-admin-asignar-turno',
  imports: [FormsModule, SearchSelect, Dialog, Button],
  templateUrl: './admin-asignar-turno.html',
  styleUrl: './admin-asignar-turno.scss',
})
export class AdminAsignarTurno {
  private readonly lookupsService = inject(LookupsService);
  private readonly turnosService = inject(TurnosService);
  private readonly publicadoresService = inject(PublicadoresService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly formatHora = formatHoraAmPm;

  protected readonly puntos = signal<Punto[]>([]);
  protected readonly loadingPuntos = signal(true);

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

  protected readonly selectedDiaFiltro = signal<string>(TODOS_LOS_DIAS);
  protected readonly soloDisponibles = signal(false);
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
      ...[...dias.entries()]
        .sort(([a], [b]) => a - b)
        .map(([numero, nombre]) => ({ value: String(numero), label: nombre })),
    ];
  });

  private readonly turnosFiltrados = computed<TurnoResumen[]>(() => {
    const filtro = this.selectedDiaFiltro();
    return filtro === TODOS_LOS_DIAS
      ? this.turnos()
      : this.turnos().filter((t) => String(t.dia_numero) === filtro);
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
              disponibles === 0
                ? 'ocupado'
                : disponibles === turnosPar.length
                  ? 'libre'
                  : 'parcial';
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

  // --- Selección de publicador y envío ---

  protected readonly publicadores = signal<Publicador[]>([]);
  protected readonly publicadorOptions = computed(() =>
    publicadorSearchOptions(this.publicadores()),
  );
  protected readonly selectedPublicadorId = signal<string | null>(null);
  protected readonly conteoPublicador = signal<ConteoTurnosPublicador | null>(null);
  protected readonly cargandoConteo = signal(false);
  protected readonly limitePublicadorAlcanzado = computed(() => {
    const conteo = this.conteoPublicador();
    return !!conteo && conteo.solicitados >= conteo.maximo;
  });

  protected readonly turnoObjetivo = signal<TurnoResumen | null>(null);

  protected readonly dialogState = signal<DialogState>('closed');
  protected readonly dialogMensaje = signal('');
  protected readonly dialogTitulo = signal('');
  protected readonly dialogResultadoOutcome = signal<SolicitarTurnoOutcome | null>(null);

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
  protected readonly enviando = signal(false);

  protected readonly primaryLabel = computed(() => {
    switch (this.dialogState()) {
      case 'publicador':
        return this.enviando() ? 'Enviando…' : 'Asignar turno';
      case 'advertencia':
        return 'Continuar';
      case 'justificacion':
        return this.enviando() ? 'Enviando…' : 'Enviar solicitud';
      case 'resultado':
        return 'Entendido';
      default:
        return '';
    }
  });

  protected readonly primaryDisabled = computed(() => {
    if (this.dialogState() === 'publicador') {
      return !this.selectedPublicadorId() || this.limitePublicadorAlcanzado() || this.enviando();
    }
    return (
      this.dialogState() === 'justificacion' && (!this.justificacion().trim() || this.enviando())
    );
  });

  protected readonly showSecondary = computed(
    () => this.dialogState() !== 'closed' && this.dialogState() !== 'resultado',
  );

  protected onPrimaryAction(): void {
    switch (this.dialogState()) {
      case 'publicador':
        this.onConfirmarPublicador();
        break;
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

    this.publicadoresService.list().subscribe({
      next: (data) => this.publicadores.set(data),
      error: () => this.snackbar.error('No se pudo cargar el listado de publicadores.'),
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

  protected onAbrirAsignacion(turno: TurnoResumen): void {
    this.turnoObjetivo.set(turno);
    this.selectedPublicadorId.set(null);
    this.conteoPublicador.set(null);
    this.dialogTitulo.set('Elige el publicador');
    this.dialogState.set('publicador');
  }

  protected onSeleccionarPublicadorAsignacion(id: string | null): void {
    this.selectedPublicadorId.set(id);
    this.conteoPublicador.set(null);
    if (!id) {
      return;
    }
    this.cargandoConteo.set(true);
    this.turnosService.contarSolicitados(id).subscribe({
      next: (conteo) => {
        this.conteoPublicador.set(conteo);
        this.cargandoConteo.set(false);
      },
      error: () => {
        this.cargandoConteo.set(false);
      },
    });
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
    this.turnoObjetivo.set(null);
    this.selectedPublicadorId.set(null);
    this.conteoPublicador.set(null);
    this.justificacion.set('');
  }

  protected onConfirmarPublicador(): void {
    const turno = this.turnoObjetivo();
    const idPublicador = this.selectedPublicadorId();
    if (!turno || !idPublicador || this.limitePublicadorAlcanzado() || this.enviando()) {
      return;
    }
    this.enviarSolicitud(turno, undefined, idPublicador);
  }

  protected onContinuarConJustificacion(): void {
    this.dialogTitulo.set('Cuéntanos la justificación');
    this.dialogState.set('justificacion');
  }

  protected onEnviarJustificacion(): void {
    const turno = this.turnoObjetivo();
    const idPublicador = this.selectedPublicadorId();
    const texto = this.justificacion().trim();
    if (!turno || !idPublicador || !texto || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.enviarSolicitud(turno, texto, idPublicador, () => this.enviando.set(false));
  }

  protected onCerrarResultado(): void {
    this.dialogState.set('closed');
    this.turnoObjetivo.set(null);
    this.selectedPublicadorId.set(null);
    this.conteoPublicador.set(null);
    this.justificacion.set('');
    const codigo = this.selectedCodigoPunto();
    if (codigo) {
      this.cargarTurnos(Number(codigo));
    }
  }

  private enviarSolicitud(
    turno: TurnoResumen,
    justificacion: string | undefined,
    idPublicador: string,
    onDone?: () => void,
  ): void {
    this.enviando.set(true);
    this.turnosService.solicitar(turno.id, justificacion, idPublicador).subscribe({
      next: (resultado) => {
        this.enviando.set(false);
        onDone?.();
        this.manejarResultado(resultado);
      },
      error: (err: ApiError) => {
        this.enviando.set(false);
        onDone?.();
        this.snackbar.error(
          err?.message ?? 'No se pudo procesar la asignación. Intenta nuevamente.',
        );
      },
    });
  }

  private manejarResultado(resultado: SolicitarTurnoResultado): void {
    if (resultado.outcome === 'requiere_justificacion') {
      this.dialogMensaje.set(resultado.mensaje);
      this.dialogTitulo.set('Antes de continuar');
      this.justificacion.set('');
      this.dialogState.set('advertencia');
      return;
    }

    this.dialogMensaje.set(resultado.mensaje);
    this.dialogTitulo.set(
      resultado.outcome === 'aprobado' ? 'Turno asignado' : 'Solicitud enviada',
    );
    this.dialogResultadoOutcome.set(resultado.outcome);
    this.dialogState.set('resultado');
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
        /** Un horario inactivo (estado_turno) no debe ofrecerse para asignar: se
         * excluye por completo de la cuadrícula, como si no existiera. */
        this.turnos.set(data.filter((turno) => turno.estado_turno !== 'INACTIVO'));
        this.loadingTurnos.set(false);
      });
  }
}
