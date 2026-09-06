import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchSelect } from '../../shared/ui/search-select/search-select';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../core/error.interceptor';
import { publicadorSearchOptions } from '../solicitar-turno/data/publicador-picker.util';
import { PublicadoresService } from '../solicitudes/data/publicadores.service';
import { Publicador } from '../solicitudes/data/models';
import { nombreCompleto } from '../solicitudes/data/publicador.utils';

type DialogPaso = 'cerrado' | 'advertencia' | 'justificacion' | 'confirmacion';

/** Retiro de la PPAM registrado por un administrador en nombre de un publicador elegido
 * por búsqueda. Misma lógica y mismo endpoint (con id explícito) que "Solicitar mi baja
 * de la PPAM" del participante en Mis datos — ver publicadores.service.ts (backend)
 * PublicadoresService.solicitarBajaAdmin. A diferencia de esa, aquí no hay logout al
 * confirmar: quien retira es el administrador, no la persona retirada. */
@Component({
  selector: 'app-admin-retirar-ppam',
  imports: [FormsModule, SearchSelect, Dialog, Button],
  templateUrl: './admin-retirar-ppam.html',
  styleUrl: './admin-retirar-ppam.scss',
})
export class AdminRetirarPpam {
  private readonly publicadoresService = inject(PublicadoresService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly nombreCompleto = nombreCompleto;

  protected readonly publicadores = signal<Publicador[]>([]);
  protected readonly publicadorOptions = computed(() =>
    publicadorSearchOptions(this.publicadores()),
  );
  protected readonly selectedPublicadorId = signal<string | null>(null);
  protected readonly selectedPublicador = computed<Publicador | null>(
    () => this.publicadores().find((p) => p.id === this.selectedPublicadorId()) ?? null,
  );

  protected readonly dialogPaso = signal<DialogPaso>('cerrado');
  protected readonly justificacion = signal('');
  protected readonly enviando = signal(false);
  protected readonly mensajeConfirmacion = signal('');

  protected readonly dialogTitulo = computed(() => {
    switch (this.dialogPaso()) {
      case 'justificacion':
        return 'Motivo del retiro';
      case 'confirmacion':
        return 'Retiro registrado';
      default:
        return 'Esta acción es irreversible';
    }
  });

  protected readonly primaryLabel = computed(() => {
    switch (this.dialogPaso()) {
      case 'justificacion':
        return this.enviando() ? 'Enviando…' : 'Retirar de la PPAM';
      case 'confirmacion':
        return 'Entendido';
      default:
        return 'Entiendo y deseo continuar';
    }
  });

  protected readonly primaryVariant = computed(() =>
    this.dialogPaso() === 'confirmacion' ? 'primary' : 'danger',
  );

  protected readonly primaryDisabled = computed(
    () =>
      this.dialogPaso() === 'justificacion' && (!this.justificacion().trim() || this.enviando()),
  );

  protected readonly muestraCancelar = computed(
    () => this.dialogPaso() === 'advertencia' || this.dialogPaso() === 'justificacion',
  );

  constructor() {
    this.cargarPublicadores();
  }

  protected onSeleccionarPublicador(id: string | null): void {
    this.selectedPublicadorId.set(id);
  }

  protected onAbrirRetiro(): void {
    this.justificacion.set('');
    this.dialogPaso.set('advertencia');
  }

  protected onContinuar(): void {
    this.dialogPaso.set('justificacion');
  }

  protected onCancelarDialog(): void {
    this.dialogPaso.set('cerrado');
  }

  protected onDialogClosed(): void {
    if (this.dialogPaso() === 'confirmacion') {
      this.onCerrarConfirmacion();
    } else {
      this.onCancelarDialog();
    }
  }

  protected onPrimaryAction(): void {
    switch (this.dialogPaso()) {
      case 'advertencia':
        this.onContinuar();
        break;
      case 'justificacion':
        this.onEnviarRetiro();
        break;
      case 'confirmacion':
        this.onCerrarConfirmacion();
        break;
    }
  }

  protected onEnviarRetiro(): void {
    const texto = this.justificacion().trim();
    const id = this.selectedPublicadorId();
    if (!texto || !id || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.publicadoresService.solicitarBaja(id, texto).subscribe({
      next: (resultado) => {
        this.enviando.set(false);
        this.mensajeConfirmacion.set(resultado.mensaje);
        this.dialogPaso.set('confirmacion');
      },
      error: (err: ApiError) => {
        this.enviando.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo registrar el retiro. Intenta nuevamente.');
      },
    });
  }

  private onCerrarConfirmacion(): void {
    this.dialogPaso.set('cerrado');
    this.selectedPublicadorId.set(null);
    this.cargarPublicadores();
  }

  private cargarPublicadores(): void {
    this.publicadoresService.list().subscribe({
      next: (data) => this.publicadores.set(data),
      error: () => this.snackbar.error('No se pudo cargar el listado de publicadores.'),
    });
  }
}
