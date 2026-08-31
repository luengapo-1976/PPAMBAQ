import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';
import { StatCard } from '../../shared/ui/stat-card/stat-card';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../core/error.interceptor';
import { LookupsService } from '../solicitudes/data/lookups.service';
import { Congregacion } from '../solicitudes/data/models';
import { yearsSince } from '../solicitudes/data/publicador.utils';
import { formatDateShort, formatHoraAmPm } from '../../shared/utils/format.util';
import { CasosPorValidarService } from './data/casos-por-validar.service';
import { RetiroResumen, TurnoValidacionResumen } from './data/models';

type Tipo = 'turnos' | 'retiros';
type Estado = 'pendientes' | 'aprobados' | 'rechazados';
type DialogPaso = 'cerrado' | 'detalle' | 'justificacion';
type AccionTurno = 'aprobar' | 'rechazar';

@Component({
  selector: 'app-casos-por-validar',
  imports: [FormsModule, StatCard, Dialog, Button],
  templateUrl: './casos-por-validar.html',
  styleUrl: './casos-por-validar.scss',
})
export class CasosPorValidar {
  private readonly casosService = inject(CasosPorValidarService);
  private readonly lookupsService = inject(LookupsService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly formatDateShort = formatDateShort;
  protected readonly formatHoraAmPm = formatHoraAmPm;
  protected readonly yearsSince = yearsSince;

  protected readonly loading = signal(true);

  protected readonly turnosPendientes = signal<TurnoValidacionResumen[]>([]);
  protected readonly turnosAprobados = signal<TurnoValidacionResumen[]>([]);
  protected readonly turnosRechazados = signal<TurnoValidacionResumen[]>([]);
  protected readonly retirosPendientes = signal<RetiroResumen[]>([]);
  protected readonly retirosAprobados = signal<RetiroResumen[]>([]);

  protected readonly congregaciones = toSignal(
    this.lookupsService.getCongregaciones().pipe(catchError(() => of<Congregacion[]>([]))),
    { initialValue: [] },
  );

  protected readonly tipo = signal<Tipo>('turnos');
  protected readonly estado = signal<Estado>('pendientes');

  protected readonly rowsTurnos = computed(() => {
    switch (this.estado()) {
      case 'aprobados':
        return this.turnosAprobados();
      case 'rechazados':
        return this.turnosRechazados();
      default:
        return this.turnosPendientes();
    }
  });
  protected readonly rowsRetiros = computed(() =>
    this.estado() === 'pendientes' ? this.retirosPendientes() : this.retirosAprobados(),
  );

  /** "Aprobados"/"rechazados" comparten la misma columna extra (quién decidió,
   * cuándo) — solo cambia la etiqueta según el estado que se esté mostrando. */
  protected readonly mostrarColumnaDecision = computed(() => this.estado() !== 'pendientes');
  protected readonly etiquetaDecisionPor = computed(() =>
    this.estado() === 'rechazados' ? 'Rechazado por' : 'Aprobado por',
  );
  protected readonly etiquetaFechaDecision = computed(() =>
    this.estado() === 'rechazados' ? 'Fecha de rechazo' : 'Fecha de aprobación',
  );

  protected readonly dialogPaso = signal<DialogPaso>('cerrado');
  protected readonly detalleTurno = signal<TurnoValidacionResumen | null>(null);
  protected readonly detalleRetiro = signal<RetiroResumen | null>(null);
  protected readonly justificacionAprobacion = signal('');
  protected readonly aprobando = signal(false);
  protected readonly accionSeleccionada = signal<AccionTurno | null>(null);

  protected readonly dialogTitulo = computed(() => {
    if (this.dialogPaso() === 'justificacion') {
      return this.accionSeleccionada() === 'rechazar' ? 'Rechazar solicitud' : 'Aprobar solicitud';
    }
    return 'Detalle del caso';
  });

  protected readonly justificacionLabel = computed(() =>
    this.tipo() === 'turnos' ? 'Justificación de respuesta' : 'Observaciones de aprobación',
  );

  protected readonly justificacionPlaceholder = computed(() =>
    this.accionSeleccionada() === 'rechazar'
      ? 'Escribe el motivo del rechazo…'
      : 'Escribe el motivo de la aprobación…',
  );

  protected readonly dialogPrimaryLabel = computed(() => {
    if (this.aprobando()) {
      return 'Enviando…';
    }
    return this.accionSeleccionada() === 'rechazar' ? 'Enviar rechazo' : 'Enviar aprobación';
  });

  protected readonly dialogPrimaryDisabled = computed(
    () => !this.justificacionAprobacion().trim() || this.aprobando(),
  );

  constructor() {
    this.cargarTodo();
  }

  protected congregacionNombre(codigo: number | null): string {
    if (codigo == null) {
      return '-';
    }
    const congregacion = this.congregaciones().find((c) => c.codigo_congregacion === codigo);
    return congregacion?.nombre_congregacion ?? '-';
  }

  protected nombreCompletoRetiro(retiro: RetiroResumen): string {
    const nombre = [
      retiro.primer_nombre,
      retiro.segundo_nombre,
      retiro.primer_apellido,
      retiro.segundo_apellido,
    ]
      .filter((parte): parte is string => !!parte && parte.trim().length > 0)
      .join(' ');
    return nombre || 'Publicador';
  }

  protected onSelectCard(tipo: Tipo, estado: Estado): void {
    this.tipo.set(tipo);
    this.estado.set(estado);
  }

  protected onVerDetalleTurno(row: TurnoValidacionResumen): void {
    this.detalleTurno.set(row);
    this.detalleRetiro.set(null);
    this.dialogPaso.set('detalle');
  }

  protected onVerDetalleRetiro(row: RetiroResumen): void {
    this.detalleRetiro.set(row);
    this.detalleTurno.set(null);
    this.dialogPaso.set('detalle');
  }

  protected onAbrirDecisionTurno(accion: AccionTurno): void {
    this.accionSeleccionada.set(accion);
    this.justificacionAprobacion.set('');
    this.dialogPaso.set('justificacion');
  }

  protected onAbrirAprobacionRetiro(): void {
    this.accionSeleccionada.set('aprobar');
    this.justificacionAprobacion.set('');
    this.dialogPaso.set('justificacion');
  }

  protected onCancelarAprobacion(): void {
    this.dialogPaso.set('detalle');
  }

  protected onCerrarDialog(): void {
    this.dialogPaso.set('cerrado');
    this.detalleTurno.set(null);
    this.detalleRetiro.set(null);
    this.accionSeleccionada.set(null);
  }

  protected onDialogClosed(): void {
    if (this.dialogPaso() === 'justificacion') {
      this.onCancelarAprobacion();
    } else {
      this.onCerrarDialog();
    }
  }

  protected onEnviarDecision(): void {
    const justificacion = this.justificacionAprobacion().trim();
    if (!justificacion || this.aprobando()) {
      return;
    }
    this.aprobando.set(true);

    if (this.tipo() === 'retiros') {
      const retiro = this.detalleRetiro();
      if (!retiro) {
        this.aprobando.set(false);
        return;
      }
      this.casosService.aprobarRetiro(retiro.id, justificacion).subscribe({
        next: () => {
          this.aprobando.set(false);
          this.snackbar.success('Solicitud de baja aprobada correctamente.');
          this.onCerrarDialog();
          this.cargarRetiros();
        },
        error: (err: ApiError) => {
          this.aprobando.set(false);
          this.snackbar.error(
            err?.message ?? 'No se pudo aprobar la solicitud de baja. Intenta nuevamente.',
          );
        },
      });
      return;
    }

    const turno = this.detalleTurno();
    if (!turno) {
      this.aprobando.set(false);
      return;
    }

    const esRechazo = this.accionSeleccionada() === 'rechazar';
    const request$ = esRechazo
      ? this.casosService.rechazarTurno(turno.id, justificacion)
      : this.casosService.aprobarTurno(turno.id, justificacion);

    request$.subscribe({
      next: () => {
        this.aprobando.set(false);
        this.snackbar.success(
          esRechazo ? 'Solicitud rechazada correctamente.' : 'Solicitud aprobada correctamente.',
        );
        this.onCerrarDialog();
        this.cargarTurnos();
      },
      error: (err: ApiError) => {
        this.aprobando.set(false);
        this.snackbar.error(
          err?.message ??
            `No se pudo ${esRechazo ? 'rechazar' : 'aprobar'} la solicitud. Intenta nuevamente.`,
        );
      },
    });
  }

  private cargarTodo(): void {
    this.loading.set(true);
    forkJoin({
      turnosPendientes: this.casosService
        .turnosPendientes()
        .pipe(catchError(() => of<TurnoValidacionResumen[]>([]))),
      turnosAprobados: this.casosService
        .turnosAprobados()
        .pipe(catchError(() => of<TurnoValidacionResumen[]>([]))),
      turnosRechazados: this.casosService
        .turnosRechazados()
        .pipe(catchError(() => of<TurnoValidacionResumen[]>([]))),
      retirosPendientes: this.casosService
        .retirosPendientes()
        .pipe(catchError(() => of<RetiroResumen[]>([]))),
      retirosAprobados: this.casosService
        .retirosAprobados()
        .pipe(catchError(() => of<RetiroResumen[]>([]))),
    }).subscribe((resultado) => {
      this.turnosPendientes.set(resultado.turnosPendientes);
      this.turnosAprobados.set(resultado.turnosAprobados);
      this.turnosRechazados.set(resultado.turnosRechazados);
      this.retirosPendientes.set(resultado.retirosPendientes);
      this.retirosAprobados.set(resultado.retirosAprobados);
      this.loading.set(false);
    });
  }

  private cargarTurnos(): void {
    this.casosService.turnosPendientes().subscribe({
      next: (data) => this.turnosPendientes.set(data),
      error: () => this.snackbar.error('No se pudo cargar los turnos pendientes por validar.'),
    });
    this.casosService.turnosAprobados().subscribe({
      next: (data) => this.turnosAprobados.set(data),
      error: () => this.snackbar.error('No se pudo cargar el histórico de turnos aprobados.'),
    });
    this.casosService.turnosRechazados().subscribe({
      next: (data) => this.turnosRechazados.set(data),
      error: () => this.snackbar.error('No se pudo cargar el histórico de turnos rechazados.'),
    });
  }

  private cargarRetiros(): void {
    this.casosService.retirosPendientes().subscribe({
      next: (data) => this.retirosPendientes.set(data),
      error: () => this.snackbar.error('No se pudo cargar las solicitudes de baja pendientes.'),
    });
    this.casosService.retirosAprobados().subscribe({
      next: (data) => this.retirosAprobados.set(data),
      error: () => this.snackbar.error('No se pudo cargar el histórico de bajas aprobadas.'),
    });
  }
}
