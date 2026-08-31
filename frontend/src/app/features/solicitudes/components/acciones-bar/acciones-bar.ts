import { Component, inject, input, output, signal } from '@angular/core';
import { Button } from '../../../../shared/ui/button/button';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { Publicador } from '../../data/models';
import { exportPublicadoresToCsv, exportPublicadoresToExcel } from '../../data/export.util';
import { PublicadoresService } from '../../data/publicadores.service';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';

@Component({
  selector: 'app-acciones-bar',
  imports: [Button, Dialog],
  templateUrl: './acciones-bar.html',
  styleUrl: './acciones-bar.scss',
})
export class AccionesBar {
  private readonly snackbar = inject(SnackbarService);
  private readonly publicadoresService = inject(PublicadoresService);

  readonly collapsed = input(false);
  /** Cantidad de registros actualmente seleccionados en la grilla; las acciones
   * de esta barra solo se habilitan cuando hay al menos un registro seleccionado. */
  readonly selectedCount = input(0);
  /** Ids de los registros actualmente seleccionados en la grilla. */
  readonly selectedIds = input<ReadonlySet<string>>(new Set());
  /** Filas actualmente mostradas en la grilla (ya filtradas/ordenadas), usadas para exportar. */
  readonly displayedRows = input<Publicador[]>([]);

  readonly collapsedChange = output<boolean>();
  readonly selectAsignarLugar = output<void>();
  readonly selectEnviarMensaje = output<void>();
  /** Se emite cuando se actualizan registros (p. ej. existe_bd_anterior), para que
   * la página recargue el listado y refleje el cambio en la grilla. */
  readonly updated = output<void>();

  protected readonly exportingExcel = signal(false);
  protected readonly confirmExisteBdAnteriorOpen = signal(false);
  protected readonly markingExisteBdAnterior = signal(false);
  protected readonly pendingMarkIds = signal<string[]>([]);

  protected readonly confirmQuitarLugarOpen = signal(false);
  protected readonly removingLugarEntrenamiento = signal(false);

  protected onToggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed());
  }

  protected onSelectAsignarLugar(): void {
    this.collapse();
    this.selectAsignarLugar.emit();
  }

  protected onSelectEnviarMensaje(): void {
    this.collapse();
    this.selectEnviarMensaje.emit();
  }

  protected async onExportExcel(): Promise<void> {
    this.collapse();
    const rows = this.displayedRows();
    if (rows.length === 0) {
      this.snackbar.show('No hay registros para exportar con el filtro actual.', 'info');
      return;
    }
    this.exportingExcel.set(true);
    try {
      await exportPublicadoresToExcel(rows);
      this.snackbar.success('Exportación de datos exitosa.');
      const ids = [...this.selectedIds()];
      if (ids.length > 0) {
        this.pendingMarkIds.set(ids);
        this.confirmExisteBdAnteriorOpen.set(true);
      }
    } catch {
      this.snackbar.error('No se pudo generar el archivo de Excel.');
    } finally {
      this.exportingExcel.set(false);
    }
  }

  protected onExportCsv(): void {
    this.collapse();
    const rows = this.displayedRows();
    if (rows.length === 0) {
      this.snackbar.show('No hay registros para exportar con el filtro actual.', 'info');
      return;
    }
    try {
      exportPublicadoresToCsv(rows);
    } catch {
      this.snackbar.error('No se pudo generar el archivo CSV.');
    }
  }

  protected onSelectQuitarLugarEntrenamiento(): void {
    this.collapse();
    if (this.selectedCount() === 0) {
      return;
    }
    this.confirmQuitarLugarOpen.set(true);
  }

  protected onCancelQuitarLugarEntrenamiento(): void {
    this.confirmQuitarLugarOpen.set(false);
  }

  protected onConfirmQuitarLugarEntrenamiento(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0 || this.removingLugarEntrenamiento()) {
      return;
    }
    this.removingLugarEntrenamiento.set(true);
    this.publicadoresService.quitarLugarEntrenamiento(ids).subscribe({
      next: ({ actualizados }) => {
        this.removingLugarEntrenamiento.set(false);
        this.confirmQuitarLugarOpen.set(false);
        this.snackbar.success(
          `Se actualizó el lugar de entrenamiento de ${actualizados} registro(s).`,
        );
        this.updated.emit();
      },
      error: () => {
        this.removingLugarEntrenamiento.set(false);
        this.snackbar.error(
          'No se pudo quitar el lugar de entrenamiento de los registros seleccionados.',
        );
      },
    });
  }

  protected onCancelMarkExisteBdAnterior(): void {
    this.confirmExisteBdAnteriorOpen.set(false);
    this.pendingMarkIds.set([]);
  }

  protected onConfirmMarkExisteBdAnterior(): void {
    const ids = this.pendingMarkIds();
    if (ids.length === 0 || this.markingExisteBdAnterior()) {
      return;
    }
    this.markingExisteBdAnterior.set(true);
    this.publicadoresService.marcarExisteBdAnterior(ids).subscribe({
      next: ({ actualizados }) => {
        this.markingExisteBdAnterior.set(false);
        this.confirmExisteBdAnteriorOpen.set(false);
        this.pendingMarkIds.set([]);
        this.snackbar.success(
          `Se actualizaron ${actualizados} registro(s): ya existen en la base de datos anterior.`,
        );
        this.updated.emit();
      },
      error: () => {
        this.markingExisteBdAnterior.set(false);
        this.snackbar.error('No se pudo actualizar los registros seleccionados.');
      },
    });
  }

  /** Contrae la barra automáticamente al usar cualquiera de sus acciones. */
  private collapse(): void {
    if (!this.collapsed()) {
      this.collapsedChange.emit(true);
    }
  }
}
