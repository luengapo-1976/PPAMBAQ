import { Component, inject, signal } from '@angular/core';
import { ConfigTable, ConfigTableColumn } from '../../../shared/ui/config-table/config-table';
import { CircuitoFormDialog } from './components/circuito-form-dialog/circuito-form-dialog';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { ReferenceDataService } from '../data/reference-data.service';
import { Circuito } from '../data/models';
import { formatDateShort } from '../../../shared/utils/format.util';

const COLUMNS: ConfigTableColumn<Circuito>[] = [
  { key: 'codigo_circuito', label: 'Código', value: (row) => row.codigo_circuito },
  { key: 'nombre_viajante', label: 'Nombre del viajante', value: (row) => row.nombre_viajante ?? '—' },
  { key: 'movil', label: 'Móvil', value: (row) => row.movil ?? '—' },
  { key: 'correo_electronico', label: 'Correo electrónico', value: (row) => row.correo_electronico ?? '—' },
  { key: 'usuario_registra', label: 'Usuario registra', value: (row) => row.usuario_registra ?? '—' },
  { key: 'fecha_registro', label: 'Fecha registro', value: (row) => formatDateShort(row.fecha_registro) },
  { key: 'usuario_modifica', label: 'Usuario modifica', value: (row) => row.usuario_modifica ?? '—' },
  { key: 'fecha_modificacion', label: 'Fecha modificación', value: (row) => formatDateShort(row.fecha_modificacion) },
];

@Component({
  selector: 'app-circuitos',
  imports: [ConfigTable, CircuitoFormDialog],
  templateUrl: './circuitos.html',
  styleUrl: './circuitos.scss',
})
export class Circuitos {
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly columns = COLUMNS;
  protected readonly rowId = (row: Circuito) => row.codigo_circuito;

  protected readonly circuitos = signal<Circuito[]>([]);
  protected readonly loading = signal(true);

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingRecord = signal<Circuito | null>(null);

  constructor() {
    this.loadCircuitos();
  }

  protected onNewRecord(): void {
    this.dialogMode.set('create');
    this.editingRecord.set(null);
    this.dialogOpen.set(true);
  }

  protected onEditRecord(record: Circuito): void {
    this.dialogMode.set('edit');
    this.editingRecord.set(record);
    this.dialogOpen.set(true);
  }

  protected onDialogClosed(): void {
    this.dialogOpen.set(false);
  }

  protected onSaved(): void {
    this.loadCircuitos();
  }

  private loadCircuitos(): void {
    this.loading.set(true);
    this.referenceDataService.listCircuitos().subscribe({
      next: (data) => {
        this.circuitos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar el listado de circuitos.');
      },
    });
  }
}
