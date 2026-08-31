import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { SiNoToggle, RespuestaSiNo } from '../../shared/ui/si-no-toggle/si-no-toggle';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../core/error.interceptor';
import { AuthService } from '../../core/auth.service';
import { formatHoraAmPm, todayIsoDateBogota } from '../../shared/utils/format.util';
import { TurnosService } from '../solicitar-turno/data/turnos.service';
import { ActividadHistorialItem, MiTurnoResumen } from '../solicitar-turno/data/models';
import { ParticipanteDesktopHeader } from '../../layout/participante-desktop-header/participante-desktop-header';

type DialogState = 'closed' | 'form' | 'resultado';
type Vista = 'grid' | 'historial';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Nombre del día de la semana de una fecha 'YYYY-MM-DD', leído en UTC para no
 * correr un día por la zona horaria (mismo criterio que formatDateShort). */
function nombreDiaSemana(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return DIAS_SEMANA[fecha.getUTCDay()];
}

function formatFechaLarga(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(fecha);
}

@Component({
  selector: 'app-reportar-actividad',
  imports: [FormsModule, Dialog, Button, SiNoToggle, ParticipanteDesktopHeader],
  templateUrl: './reportar-actividad.html',
  styleUrl: './reportar-actividad.scss',
})
export class ReportarActividad {
  private readonly turnosService = inject(TurnosService);
  private readonly snackbar = inject(SnackbarService);
  private readonly authService = inject(AuthService);

  protected readonly formatHora = formatHoraAmPm;
  protected readonly formatFecha = formatFechaLarga;
  protected readonly maxFecha = todayIsoDateBogota();

  protected readonly primerNombre = computed(
    () => this.authService.currentSession()?.publicador?.primer_nombre?.trim() || 'Publicador',
  );

  protected readonly misTurnos = signal<MiTurnoResumen[]>([]);
  protected readonly loading = signal(true);

  protected readonly vista = signal<Vista>('grid');
  protected readonly historialTurno = signal<MiTurnoResumen | null>(null);
  protected readonly historial = signal<ActividadHistorialItem[]>([]);
  protected readonly cargandoHistorial = signal(false);

  protected readonly dialogState = signal<DialogState>('closed');
  protected readonly dialogMensaje = signal('');
  protected readonly turnoSeleccionado = signal<MiTurnoResumen | null>(null);

  protected readonly fechaActividad = signal('');
  protected readonly fechaError = signal<string | null>(null);
  protected readonly verificandoFecha = signal(false);

  protected readonly cumplioTurno = signal<RespuestaSiNo | null>(null);
  protected readonly inicioConversacion = signal<RespuestaSiNo | null>(null);
  protected readonly arreglosCurso = signal<RespuestaSiNo | null>(null);
  protected readonly observaciones = signal('');
  protected readonly enviando = signal(false);

  protected readonly mostrarInicioConversacion = computed(() => this.cumplioTurno() === 'SI');
  protected readonly mostrarArreglosCurso = computed(
    () => this.cumplioTurno() === 'SI' && this.inicioConversacion() === 'SI',
  );

  protected readonly fechaValida = computed(
    () => this.fechaActividad().length > 0 && !this.fechaError() && !this.verificandoFecha(),
  );

  protected readonly formularioValido = computed(() => {
    if (!this.fechaValida() || !this.cumplioTurno()) {
      return false;
    }
    if (this.mostrarInicioConversacion() && !this.inicioConversacion()) {
      return false;
    }
    if (this.mostrarArreglosCurso() && !this.arreglosCurso()) {
      return false;
    }
    return true;
  });

  protected readonly dialogTitulo = computed(() =>
    this.dialogState() === 'form' ? 'Reportar actividad' : 'Reporte enviado',
  );

  protected readonly primaryLabel = computed(() => {
    if (this.dialogState() === 'form') {
      return this.enviando() ? 'Enviando…' : 'Enviar reporte';
    }
    return 'Entendido';
  });

  protected readonly primaryDisabled = computed(
    () => this.dialogState() === 'form' && (!this.formularioValido() || this.enviando()),
  );

  constructor() {
    this.cargarMisTurnos();
  }

  private cargarMisTurnos(): void {
    this.loading.set(true);
    this.turnosService.contarSolicitados().subscribe({
      next: (conteo) => {
        /** Un turno inactivo sigue contando para el límite de 3 (por eso no se filtra
         * en el conteo en sí), pero no admite nuevos reportes de actividad mientras
         * esté inactivo: se excluye de esta lista (Devolver turno sí lo sigue
         * mostrando, para poder liberarlo igual). */
        this.misTurnos.set(conteo.turnos.filter((turno) => turno.estadoTurno !== 'INACTIVO'));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar el listado de tus turnos asignados.');
      },
    });
  }

  protected onVerHistorial(turno: MiTurnoResumen): void {
    this.historialTurno.set(turno);
    this.vista.set('historial');
    this.cargandoHistorial.set(true);
    this.turnosService.historialActividad(turno.id).subscribe({
      next: (items) => {
        this.historial.set(items);
        this.cargandoHistorial.set(false);
      },
      error: () => {
        this.cargandoHistorial.set(false);
        this.snackbar.error('No se pudo cargar el histórico de actividad de este turno.');
      },
    });
  }

  protected onVolverAGrid(): void {
    this.vista.set('grid');
    this.historialTurno.set(null);
    this.historial.set([]);
  }

  protected onAbrirReporte(turno: MiTurnoResumen): void {
    this.turnoSeleccionado.set(turno);
    this.fechaActividad.set('');
    this.fechaError.set(null);
    this.cumplioTurno.set(null);
    this.inicioConversacion.set(null);
    this.arreglosCurso.set(null);
    this.observaciones.set('');
    this.dialogState.set('form');
  }

  protected onFechaChange(value: string): void {
    this.fechaActividad.set(value);
    this.fechaError.set(null);
    if (!value) {
      return;
    }

    const turno = this.turnoSeleccionado();
    if (!turno) {
      return;
    }

    if (value > this.maxFecha) {
      this.fechaError.set('La fecha de la actividad no puede ser una fecha futura.');
      return;
    }

    const diaSeleccionado = nombreDiaSemana(value);
    if (diaSeleccionado.toLowerCase() !== turno.diaNombre.trim().toLowerCase()) {
      this.fechaError.set(
        `Esa fecha cae en ${diaSeleccionado}. Elige una fecha que sea ${turno.diaNombre}.`,
      );
      return;
    }

    this.verificandoFecha.set(true);
    this.turnosService.verificarDisponibilidadActividad(turno.id, value).subscribe({
      next: (resultado) => {
        this.verificandoFecha.set(false);
        if (!resultado.disponible) {
          this.fechaError.set(resultado.mensaje ?? 'La actividad de esta fecha ya fue reportada.');
        }
      },
      error: () => {
        this.verificandoFecha.set(false);
        this.fechaError.set(
          'No se pudo verificar la disponibilidad de esta fecha. Intenta nuevamente.',
        );
      },
    });
  }

  protected onCumplioTurnoChange(valor: RespuestaSiNo): void {
    this.cumplioTurno.set(valor);
    this.inicioConversacion.set(null);
    this.arreglosCurso.set(null);
  }

  protected onInicioConversacionChange(valor: RespuestaSiNo): void {
    this.inicioConversacion.set(valor);
    this.arreglosCurso.set(null);
  }

  protected onArreglosCursoChange(valor: RespuestaSiNo): void {
    this.arreglosCurso.set(valor);
  }

  protected onPrimaryAction(): void {
    if (this.dialogState() === 'form') {
      this.onEnviarReporte();
    } else {
      this.onCerrarResultado();
    }
  }

  protected onCancelarDialog(): void {
    this.dialogState.set('closed');
    this.turnoSeleccionado.set(null);
  }

  protected onDialogClosed(): void {
    if (this.dialogState() === 'resultado') {
      this.onCerrarResultado();
    } else {
      this.onCancelarDialog();
    }
  }

  private onEnviarReporte(): void {
    const turno = this.turnoSeleccionado();
    const cumplioTurno = this.cumplioTurno();
    if (!turno || !cumplioTurno || !this.formularioValido() || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.turnosService
      .reportarActividad(turno.id, {
        fechaActividad: this.fechaActividad(),
        cumplioTurno,
        inicioConversacion: this.mostrarInicioConversacion()
          ? (this.inicioConversacion() ?? undefined)
          : undefined,
        arreglosCurso: this.mostrarArreglosCurso()
          ? (this.arreglosCurso() ?? undefined)
          : undefined,
        observaciones: this.observaciones().trim() || undefined,
      })
      .subscribe({
        next: (resultado) => {
          this.enviando.set(false);
          this.dialogMensaje.set(resultado.mensaje);
          this.dialogState.set('resultado');
        },
        error: (err: ApiError) => {
          this.enviando.set(false);
          this.snackbar.error(
            err?.message ?? 'No se pudo enviar el reporte de actividad. Intenta nuevamente.',
          );
        },
      });
  }

  private onCerrarResultado(): void {
    this.dialogState.set('closed');
    this.turnoSeleccionado.set(null);
    this.cargarMisTurnos();
  }
}
