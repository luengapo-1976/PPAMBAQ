import { Component, inject, signal } from '@angular/core';
import { ConfigTable, ConfigTableColumn } from '../../../shared/ui/config-table/config-table';
import { PuntoFormDialog } from './components/punto-form-dialog/punto-form-dialog';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { ReferenceDataService } from '../data/reference-data.service';
import { Punto } from '../data/models';
import { formatDateShort } from '../../../shared/utils/format.util';

const COLUMNS: ConfigTableColumn<Punto>[] = [
  { key: 'codigo_punto', label: 'Código', value: (row) => row.codigo_punto },
  { key: 'nombre_punto', label: 'Nombre', value: (row) => row.nombre_punto },
  { key: 'direccion', label: 'Dirección', value: (row) => row.direccion ?? '—' },
  { key: 'encargado', label: 'Encargado', value: (row) => row.encargado ?? '—' },
  { key: 'movil', label: 'Móvil', value: (row) => row.movil ?? '—' },
  { key: 'estado', label: 'Estado', value: (row) => row.estado },
  { key: 'usuario_registra', label: 'Usuario registra', value: (row) => row.usuario_registra ?? '—' },
  { key: 'fecha_registro', label: 'Fecha registro', value: (row) => formatDateShort(row.fecha_registro) },
  { key: 'usuario_modifica', label: 'Usuario modifica', value: (row) => row.usuario_modifica ?? '—' },
  { key: 'fecha_modificacion', label: 'Fecha modificación', value: (row) => formatDateShort(row.fecha_modificacion) },
];

@Component({
  selector: 'app-puntos',
  imports: [ConfigTable, PuntoFormDialog],
  templateUrl: './puntos.html',
  styleUrl: './puntos.scss',
})
export class Puntos {
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly columns = COLUMNS;
  protected readonly rowId = (row: Punto) => String(row.codigo_punto);

  protected readonly puntos = signal<Punto[]>([]);
  protected readonly loading = signal(true);

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingRecord = signal<Punto | null>(null);

  constructor() {
    this.loadPuntos();
  }

  protected onNewRecord(): void {
    this.dialogMode.set('create');
    this.editingRecord.set(null);
    this.dialogOpen.set(true);
  }

  protected onEditRecord(record: Punto): void {
    this.dialogMode.set('edit');
    this.editingRecord.set(record);
    this.dialogOpen.set(true);
  }

  protected onDialogClosed(): void {
    this.dialogOpen.set(false);
  }

  protected onSaved(): void {
    this.loadPuntos();
  }

  private loadPuntos(): void {
    this.loading.set(true);
    this.referenceDataService.listPuntos().subscribe({
      next: (data) => {
        this.puntos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar el listado de puntos.');
      },
    });
  }
}
