import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select, SelectOption } from '../../shared/ui/select/select';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../core/error.interceptor';
import { AuthService } from '../../core/auth.service';
import { formatHoraAmPm } from '../../shared/utils/format.util';
import { TurnosService } from '../solicitar-turno/data/turnos.service';
import {
  MOTIVOS_DEVOLUCION,
  MiTurnoResumen,
  MotivoDevolucion,
} from '../solicitar-turno/data/models';
import { ParticipanteDesktopHeader } from '../../layout/participante-desktop-header/participante-desktop-header';

type DialogState = 'closed' | 'form' | 'resultado';

const MOTIVO_OPTIONS: SelectOption[] = MOTIVOS_DEVOLUCION.map((motivo) => ({
  value: motivo,
  label: motivo,
}));

@Component({
  selector: 'app-devolver-turno',
  imports: [FormsModule, Select, Dialog, Button, ParticipanteDesktopHeader],
  templateUrl: './devolver-turno.html',
  styleUrl: './devolver-turno.scss',
})
export class DevolverTurno {
  private readonly turnosService = inject(TurnosService);
  private readonly snackbar = inject(SnackbarService);
  private readonly authService = inject(AuthService);

  protected readonly formatHora = formatHoraAmPm;
  protected readonly motivoOptions = MOTIVO_OPTIONS;

  protected readonly primerNombre = computed(
    () => this.authService.currentSession()?.publicador?.primer_nombre?.trim() || 'Publicador',
  );

  protected readonly misTurnos = signal<MiTurnoResumen[]>([]);
  protected readonly loading = signal(true);

  protected readonly dialogState = signal<DialogState>('closed');
  protected readonly dialogMensaje = signal('');
  protected readonly turnoSeleccionado = signal<MiTurnoResumen | null>(null);
  protected readonly motivo = signal<MotivoDevolucion | null>(null);
  protected readonly motivoOtro = signal('');
  protected readonly observaciones = signal('');
  protected readonly enviando = signal(false);

  protected readonly motivoValido = computed(() => {
    const seleccionado = this.motivo();
    if (!seleccionado) {
      return false;
    }
    return seleccionado !== 'Otro' || this.motivoOtro().trim().length > 0;
  });

  protected readonly dialogTitulo = computed(() =>
    this.dialogState() === 'form' ? 'Devolver turno' : 'Turno devuelto',
  );

  protected readonly primaryLabel = computed(() => {
    if (this.dialogState() === 'form') {
      return this.enviando() ? 'Enviando…' : 'Devolver turno';
    }
    return 'Entendido';
  });

  protected readonly primaryDisabled = computed(
    () => this.dialogState() === 'form' && (!this.motivoValido() || this.enviando()),
  );

  constructor() {
    this.cargarMisTurnos();
  }

  private cargarMisTurnos(): void {
    this.loading.set(true);
    this.turnosService.contarSolicitados().subscribe({
      next: (conteo) => {
        this.misTurnos.set(conteo.turnos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar el listado de tus turnos asignados.');
      },
    });
  }

  protected onAbrirDevolucion(turno: MiTurnoResumen): void {
    this.turnoSeleccionado.set(turno);
    this.motivo.set(null);
    this.motivoOtro.set('');
    this.observaciones.set('');
    this.dialogState.set('form');
  }

  protected onMotivoChange(value: string | null): void {
    this.motivo.set(value as MotivoDevolucion | null);
    if (value !== 'Otro') {
      this.motivoOtro.set('');
    }
  }

  protected onPrimaryAction(): void {
    if (this.dialogState() === 'form') {
      this.onConfirmarDevolucion();
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

  private onConfirmarDevolucion(): void {
    const turno = this.turnoSeleccionado();
    const motivo = this.motivo();
    if (!turno || !motivo || !this.motivoValido() || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.turnosService
      .devolver(turno.id, {
        motivo,
        motivoOtro: motivo === 'Otro' ? this.motivoOtro().trim() : undefined,
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
            err?.message ?? 'No se pudo procesar la devolución del turno. Intenta nuevamente.',
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
