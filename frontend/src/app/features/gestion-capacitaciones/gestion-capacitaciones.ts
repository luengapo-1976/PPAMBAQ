import { Component, inject, signal } from '@angular/core';
import { CapacitacionForm } from './components/capacitacion-form/capacitacion-form';
import { CapacitacionesTable } from './components/capacitaciones-table/capacitaciones-table';
import { Button } from '../../shared/ui/button/button';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { CapacitacionesService } from './data/capacitaciones.service';
import { Capacitacion } from './data/models';
import { ApiError } from '../../core/error.interceptor';

@Component({
  selector: 'app-gestion-capacitaciones',
  imports: [CapacitacionForm, CapacitacionesTable, Button],
  templateUrl: './gestion-capacitaciones.html',
  styleUrl: './gestion-capacitaciones.scss',
})
export class GestionCapacitaciones {
  private readonly capacitacionesService = inject(CapacitacionesService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly capacitaciones = signal<Capacitacion[]>([]);
  protected readonly editingRecord = signal<Capacitacion | null>(null);

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');

  constructor() {
    this.loadCapacitaciones();
  }

  protected onNewRecord(): void {
    this.dialogMode.set('create');
    this.editingRecord.set(null);
    this.dialogOpen.set(true);
  }

  protected onEditRecord(record: Capacitacion): void {
    this.dialogMode.set('edit');
    this.editingRecord.set(record);
    this.dialogOpen.set(true);
  }

  protected onDialogClosed(): void {
    this.dialogOpen.set(false);
  }

  protected onSaved(): void {
    this.dialogOpen.set(false);
    this.editingRecord.set(null);
    this.loadCapacitaciones();
  }

  protected onToggleActivo(event: { capacitacion: Capacitacion; activo: boolean }): void {
    this.capacitacionesService.setActivo(event.capacitacion.id, event.activo).subscribe({
      next: () => this.loadCapacitaciones(),
      error: (err: ApiError) =>
        this.snackbar.error(err?.message ?? 'No se pudo actualizar la visibilidad.'),
    });
  }

  protected onMoveUp(capacitacion: Capacitacion): void {
    this.capacitacionesService.mover(capacitacion.id, 'arriba').subscribe({
      next: () => this.loadCapacitaciones(),
      error: (err: ApiError) =>
        this.snackbar.error(err?.message ?? 'No se pudo mover el elemento.'),
    });
  }

  protected onMoveDown(capacitacion: Capacitacion): void {
    this.capacitacionesService.mover(capacitacion.id, 'abajo').subscribe({
      next: () => this.loadCapacitaciones(),
      error: (err: ApiError) =>
        this.snackbar.error(err?.message ?? 'No se pudo mover el elemento.'),
    });
  }

  protected onDeleteRecord(capacitacion: Capacitacion): void {
    this.capacitacionesService.delete(capacitacion.id).subscribe({
      next: () => {
        this.snackbar.success('Elemento eliminado correctamente.');
        this.loadCapacitaciones();
      },
      error: (err: ApiError) =>
        this.snackbar.error(err?.message ?? 'No se pudo eliminar el elemento.'),
    });
  }

  private loadCapacitaciones(): void {
    this.capacitacionesService.listAll().subscribe({
      next: (data) => this.capacitaciones.set(data),
      error: () => this.snackbar.error('No se pudo cargar el listado de capacitación.'),
    });
  }
}
