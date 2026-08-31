import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select, SelectOption } from '../../shared/ui/select/select';
import { SearchSelect } from '../../shared/ui/search-select/search-select';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../core/error.interceptor';
import { formatHoraAmPm } from '../../shared/utils/format.util';
import { TurnosService } from '../solicitar-turno/data/turnos.service';
import { publicadorSearchOptions } from '../solicitar-turno/data/publicador-picker.util';
import {
  MOTIVOS_DEVOLUCION,
  MiTurnoResumen,
  MotivoDevolucion,
} from '../solicitar-turno/data/models';
import { PublicadoresService } from '../solicitudes/data/publicadores.service';
import { Publicador } from '../solicitudes/data/models';
import { nombreCompleto } from '../solicitudes/data/publicador.utils';

type DialogState = 'closed' | 'form' | 'resultado';

const MOTIVO_OPTIONS: SelectOption[] = MOTIVOS_DEVOLUCION.map((motivo) => ({
  value: motivo,
  label: motivo,
}));

@Component({
  selector: 'app-admin-retirar-turno',
  imports: [FormsModule, Select, SearchSelect, Dialog, Button],
  templateUrl: './admin-retirar-turno.html',
  styleUrl: './admin-retirar-turno.scss',
})
export class AdminRetirarTurno {
  private readonly turnosService = inject(TurnosService);
  private readonly publicadoresService = inject(PublicadoresService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly formatHora = formatHoraAmPm;
  protected readonly motivoOptions = MOTIVO_OPTIONS;
  protected readonly nombreCompleto = nombreCompleto;

  protected readonly publicadores = signal<Publicador[]>([]);
  protected readonly publicadorOptions = computed(() =>
    publicadorSearchOptions(this.publicadores()),
  );
  protected readonly selectedPublicadorId = signal<string | null>(null);
  protected readonly selectedPublicador = computed<Publicador | null>(
    () => this.publicadores().find((p) => p.id === this.selectedPublicadorId()) ?? null,
  );

  protected readonly misTurnos = signal<MiTurnoResumen[]>([]);
  protected readonly loading = signal(false);

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
    this.dialogState() === 'form' ? 'Retirar turno' : 'Turno retirado',
  );

  protected readonly primaryLabel = computed(() => {
    if (this.dialogState() === 'form') {
      return this.enviando() ? 'Enviando…' : 'Retirar turno';
    }
    return 'Entendido';
  });

  protected readonly primaryDisabled = computed(
    () => this.dialogState() === 'form' && (!this.motivoValido() || this.enviando()),
  );

  constructor() {
    this.publicadoresService.list().subscribe({
      next: (data) => this.publicadores.set(data),
      error: () => this.snackbar.error('No se pudo cargar el listado de publicadores.'),
    });
  }

  protected onSeleccionarPublicador(id: string | null): void {
    this.selectedPublicadorId.set(id);
    this.misTurnos.set([]);
    if (id) {
      this.cargarTurnosPublicador(id);
    }
  }

  private cargarTurnosPublicador(idPublicador: string): void {
    this.loading.set(true);
    this.turnosService.contarSolicitados(idPublicador).subscribe({
      next: (conteo) => {
        this.misTurnos.set(conteo.turnos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar el listado de turnos asignados a este publicador.');
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
    const idPublicador = this.selectedPublicadorId();
    if (!turno || !motivo || !idPublicador || !this.motivoValido() || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.turnosService
      .devolver(
        turno.id,
        {
          motivo,
          motivoOtro: motivo === 'Otro' ? this.motivoOtro().trim() : undefined,
          observaciones: this.observaciones().trim() || undefined,
        },
        idPublicador,
      )
      .subscribe({
        next: (resultado) => {
          this.enviando.set(false);
          this.dialogMensaje.set(resultado.mensaje);
          this.dialogState.set('resultado');
        },
        error: (err: ApiError) => {
          this.enviando.set(false);
          this.snackbar.error(
            err?.message ?? 'No se pudo procesar el retiro del turno. Intenta nuevamente.',
          );
        },
      });
  }

  private onCerrarResultado(): void {
    this.dialogState.set('closed');
    this.turnoSeleccionado.set(null);
    const idPublicador = this.selectedPublicadorId();
    if (idPublicador) {
      this.cargarTurnosPublicador(idPublicador);
    }
  }
}
