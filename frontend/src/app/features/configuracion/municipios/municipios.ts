import { Component, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ConfigTable, ConfigTableColumn } from '../../../shared/ui/config-table/config-table';
import { MunicipioFormDialog } from './components/municipio-form-dialog/municipio-form-dialog';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { ReferenceDataService } from '../data/reference-data.service';
import { LookupsService } from '../../solicitudes/data/lookups.service';
import { Departamento, Municipio } from '../data/models';

@Component({
  selector: 'app-municipios',
  imports: [ConfigTable, MunicipioFormDialog],
  templateUrl: './municipios.html',
  styleUrl: './municipios.scss',
})
export class Municipios {
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly lookupsService = inject(LookupsService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly municipios = signal<Municipio[]>([]);
  protected readonly departamentos = signal<Departamento[]>([]);
  protected readonly loading = signal(true);

  protected readonly nombreDepartamento = (codigo: string): string =>
    this.departamentos().find((d) => d.codigo_departamento === codigo)?.nombre_departamento ?? codigo;

  protected readonly columns = computed<ConfigTableColumn<Municipio>[]>(() => [
    { key: 'codigo_municipio', label: 'Código', value: (row) => row.codigo_municipio },
    { key: 'nombre_municipio', label: 'Nombre', value: (row) => row.nombre_municipio },
    {
      key: 'codigo_departamento',
      label: 'Departamento',
      value: (row) => this.nombreDepartamento(row.codigo_departamento),
    },
  ]);

  protected readonly rowId = (row: Municipio) => row.codigo_municipio;

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingRecord = signal<Municipio | null>(null);

  constructor() {
    this.loadAll();
  }

  protected onNewRecord(): void {
    this.dialogMode.set('create');
    this.editingRecord.set(null);
    this.dialogOpen.set(true);
  }

  protected onEditRecord(record: Municipio): void {
    this.dialogMode.set('edit');
    this.editingRecord.set(record);
    this.dialogOpen.set(true);
  }

  protected onDialogClosed(): void {
    this.dialogOpen.set(false);
  }

  protected onSaved(): void {
    this.loadAll();
    this.lookupsService.refreshMunicipios();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.referenceDataService.listDepartamentos().subscribe({
      next: (data) => this.departamentos.set(data),
      error: () => this.snackbar.error('No se pudo cargar el catálogo de departamentos.'),
    });
    this.referenceDataService
      .listMunicipios()
      .pipe(
        catchError(() => {
          this.snackbar.error('No se pudo cargar el listado de municipios.');
          return of<Municipio[]>([]);
        }),
      )
      .subscribe((data) => {
        this.municipios.set(data);
        this.loading.set(false);
      });
  }
}
