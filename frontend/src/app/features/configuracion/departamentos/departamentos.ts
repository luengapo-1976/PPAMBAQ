import { Component, inject, signal } from '@angular/core';
import { ConfigTable, ConfigTableColumn } from '../../../shared/ui/config-table/config-table';
import { DepartamentoFormDialog } from './components/departamento-form-dialog/departamento-form-dialog';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { ReferenceDataService } from '../data/reference-data.service';
import { LookupsService } from '../../solicitudes/data/lookups.service';
import { Departamento } from '../data/models';

const COLUMNS: ConfigTableColumn<Departamento>[] = [
  { key: 'codigo_departamento', label: 'Código', value: (row) => row.codigo_departamento },
  { key: 'nombre_departamento', label: 'Nombre', value: (row) => row.nombre_departamento },
];

@Component({
  selector: 'app-departamentos',
  imports: [ConfigTable, DepartamentoFormDialog],
  templateUrl: './departamentos.html',
  styleUrl: './departamentos.scss',
})
export class Departamentos {
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly lookupsService = inject(LookupsService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly columns = COLUMNS;
  protected readonly rowId = (row: Departamento) => row.codigo_departamento;

  protected readonly departamentos = signal<Departamento[]>([]);
  protected readonly loading = signal(true);

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingRecord = signal<Departamento | null>(null);

  constructor() {
    this.loadDepartamentos();
  }

  protected onNewRecord(): void {
    this.dialogMode.set('create');
    this.editingRecord.set(null);
    this.dialogOpen.set(true);
  }

  protected onEditRecord(record: Departamento): void {
    this.dialogMode.set('edit');
    this.editingRecord.set(record);
    this.dialogOpen.set(true);
  }

  protected onDialogClosed(): void {
    this.dialogOpen.set(false);
  }

  protected onSaved(): void {
    this.loadDepartamentos();
    this.lookupsService.refreshDepartamentos();
  }

  private loadDepartamentos(): void {
    this.loading.set(true);
    this.referenceDataService.listDepartamentos().subscribe({
      next: (data) => {
        this.departamentos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar el listado de departamentos.');
      },
    });
  }
}
