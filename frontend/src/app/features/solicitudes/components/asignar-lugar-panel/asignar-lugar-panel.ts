import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../shared/ui/button/button';
import { Select, SelectOption } from '../../../../shared/ui/select/select';
import { SearchSelect, SearchSelectOption } from '../../../../shared/ui/search-select/search-select';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../core/error.interceptor';
import { PublicadoresService } from '../../data/publicadores.service';
import { ReferenceDataService } from '../../../configuracion/data/reference-data.service';
import { Punto } from '../../../configuracion/data/models';

type TipoEntrenamiento = 'Primer entrenamiento' | 'Segundo entrenamiento';

const TIPO_ENTRENAMIENTO_OPTIONS: SelectOption[] = [
  { value: 'Primer entrenamiento', label: 'Primer entrenamiento' },
  { value: 'Segundo entrenamiento', label: 'Segundo entrenamiento' },
];

@Component({
  selector: 'app-asignar-lugar-panel',
  imports: [ReactiveFormsModule, Dialog, Button, Select, SearchSelect],
  templateUrl: './asignar-lugar-panel.html',
  styleUrl: './asignar-lugar-panel.scss',
})
export class AsignarLugarPanel {
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly publicadoresService = inject(PublicadoresService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly selectedPublicadorIds = input<string[]>([]);
  /** Separación desde el borde derecho, para dejar espacio a la barra de acciones. */
  readonly rightOffset = input('0px');

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);
  protected readonly puntos = signal<Punto[]>([]);
  protected readonly tipoEntrenamientoOptions = TIPO_ENTRENAMIENTO_OPTIONS;

  protected readonly puntoControl = new FormControl<string | null>(null);
  protected readonly tipoControl = new FormControl<TipoEntrenamiento | null>(null);
  protected readonly fechaControl = new FormControl<string | null>(null);

  private readonly selectedCodigoPunto = toSignal(this.puntoControl.valueChanges, { initialValue: null });
  private readonly selectedTipo = toSignal(this.tipoControl.valueChanges, { initialValue: null });
  private readonly selectedFecha = toSignal(this.fechaControl.valueChanges, { initialValue: null });

  protected readonly puntoOptions = computed<SearchSelectOption[]>(() =>
    this.puntos().map((p) => ({ value: String(p.codigo_punto), label: `${p.codigo_punto} - ${p.nombre_punto}` })),
  );

  protected readonly selectedPunto = computed(
    () => this.puntos().find((p) => String(p.codigo_punto) === this.selectedCodigoPunto()) ?? null,
  );

  protected readonly fechaLabel = computed(() => {
    const tipo = this.selectedTipo();
    if (tipo === 'Primer entrenamiento') return 'Fecha de primer entrenamiento';
    if (tipo === 'Segundo entrenamiento') return 'Fecha de segundo entrenamiento';
    return 'Fecha de entrenamiento';
  });

  protected readonly canSave = computed(
    () => !!this.selectedCodigoPunto() && !!this.selectedTipo() && !!this.selectedFecha(),
  );

  constructor() {
    effect(() => {
      if (this.open()) {
        this.loadPuntos();
        // Sin emitEvent:false: los signals derivados de valueChanges (selectedCodigoPunto,
        // selectedTipo, selectedFecha) deben enterarse del reseteo para que el detalle del
        // punto y canSave() vuelvan a su estado vacío al reabrir el formulario.
        this.puntoControl.reset(null);
        this.tipoControl.reset(null);
        this.fechaControl.reset(null);
      }
    });
  }

  protected onCancel(): void {
    this.closed.emit();
  }

  protected onGuardar(): void {
    if (!this.canSave() || this.saving()) {
      return;
    }
    const ids = this.selectedPublicadorIds();
    if (ids.length === 0) {
      this.snackbar.error('No hay destinatarios seleccionados.');
      return;
    }

    this.saving.set(true);
    this.publicadoresService
      .asignarLugarEntrenamiento(ids, this.selectedTipo()!, this.selectedFecha()!, Number(this.selectedCodigoPunto()))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbar.success('Lugar de entrenamiento asignado correctamente.');
          this.saved.emit();
          this.closed.emit();
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.snackbar.error(err?.message ?? 'No se pudo asignar el lugar de entrenamiento.');
        },
      });
  }

  private loadPuntos(): void {
    this.referenceDataService.listPuntos().subscribe({
      next: (data) => this.puntos.set(data),
      error: () => this.snackbar.error('No se pudo cargar el catálogo de puntos.'),
    });
  }
}
