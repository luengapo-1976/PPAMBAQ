import { Component, computed, inject, signal } from '@angular/core';
import { MensajeForm } from './components/mensaje-form/mensaje-form';
import { MensajesTable } from './components/mensajes-table/mensajes-table';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { MensajesService } from './data/mensajes.service';
import { Mensaje } from './data/models';

@Component({
  selector: 'app-mensajes',
  imports: [MensajeForm, MensajesTable],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.scss',
})
export class Mensajes {
  private readonly mensajesService = inject(MensajesService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly editingRecord = signal<Mensaje | null>(null);

  protected readonly tipos = computed(() => [...new Set(this.mensajes().map((m) => m.tipo))].sort());

  constructor() {
    this.loadMensajes();
  }

  protected onEditRecord(record: Mensaje): void {
    this.editingRecord.set(record);
  }

  protected onCancelEdit(): void {
    this.editingRecord.set(null);
  }

  protected onSaved(): void {
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
