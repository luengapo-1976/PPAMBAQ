import { Component, inject, signal } from '@angular/core';
import { MensajeForm } from './components/mensaje-form/mensaje-form';
import { MensajesTable } from './components/mensajes-table/mensajes-table';
import { Button } from '../../shared/ui/button/button';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { MensajesService } from './data/mensajes.service';
import { Mensaje } from './data/models';

@Component({
  selector: 'app-mensajes',
  imports: [MensajeForm, MensajesTable, Button],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.scss',
})
export class Mensajes {
  private readonly mensajesService = inject(MensajesService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly editingRecord = signal<Mensaje | null>(null);

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');

  constructor() {
    this.loadMensajes();
  }

  protected onNewRecord(): void {
    this.dialogMode.set('create');
    this.editingRecord.set(null);
    this.dialogOpen.set(true);
  }

  protected onEditRecord(record: Mensaje): void {
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
    this.loadMensajes();
  }

  private loadMensajes(): void {
    this.mensajesService.list().subscribe({
      next: (data) => this.mensajes.set(data),
      error: () => this.snackbar.error('No se pudo cargar el listado de mensajes.'),
    });
  }
}
