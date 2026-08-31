import { Component, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ConfigTable, ConfigTableColumn } from '../../../shared/ui/config-table/config-table';
import { CongregacionFormDialog } from './components/congregacion-form-dialog/congregacion-form-dialog';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { ReferenceDataService } from '../data/reference-data.service';
import { LookupsService } from '../../solicitudes/data/lookups.service';
import { Circuito, Congregacion, Departamento, Municipio } from '../data/models';
import { formatDateShort } from '../../../shared/utils/format.util';

@Component({
  selector: 'app-congregaciones',
  imports: [ConfigTable, CongregacionFormDialog],
  templateUrl: './congregaciones.html',
  styleUrl: './congregaciones.scss',
})
export class Congregaciones {
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly lookupsService = inject(LookupsService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly congregaciones = signal<Congregacion[]>([]);
  protected readonly departamentos = signal<Departamento[]>([]);
  protected readonly municipios = signal<Municipio[]>([]);
  protected readonly circuitos = signal<Circuito[]>([]);
  protected readonly loading = signal(true);

  protected readonly nombreDepartamento = (codigo: string): string =>
    this.departamentos().find((d) => d.codigo_departamento === codigo)?.nombre_departamento ??
    codigo;

  protected readonly nombreMunicipio = (codigo: string): string =>
    this.municipios().find((m) => m.codigo_municipio === codigo)?.nombre_municipio ?? codigo;

  protected readonly columns = computed<ConfigTableColumn<Congregacion>[]>(() => [
    { key: 'codigo_congregacion', label: 'Código', value: (row) => row.codigo_congregacion },
    { key: 'nombre_congregacion', label: 'Nombre', value: (row) => row.nombre_congregacion },
    {
      key: 'codigo_municipio',
      label: 'Municipio',
      value: (row) => this.nombreMunicipio(row.codigo_municipio),
    },
    {
      key: 'codigo_departamento',
      label: 'Departamento',
      value: (row) => this.nombreDepartamento(row.codigo_departamento),
    },
    { key: 'codigo_circuito', label: 'Circuito', value: (row) => row.codigo_circuito ?? '-' },
    { key: 'correo_congregacion', label: 'Correo', value: (row) => row.correo_congregacion ?? '-' },
    {
      key: 'usuario_registra',
      label: 'Usuario registra',
      value: (row) => row.usuario_registra ?? '-',
    },
    {
      key: 'fecha_registro',
      label: 'Fecha registro',
      value: (row) => formatDateShort(row.fecha_registro),
    },
    {
      key: 'usuario_modifica',
      label: 'Usuario modifica',
      value: (row) => row.usuario_modifica ?? '-',
    },
    {
      key: 'fecha_modificacion',
      label: 'Fecha modificación',
      value: (row) => formatDateShort(row.fecha_modificacion),
    },
  ]);

  protected readonly rowId = (row: Congregacion) => String(row.codigo_congregacion);

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingRecord = signal<Congregacion | null>(null);

  constructor() {
    this.loadAll();
  }

  protected onNewRecord(): void {
    this.dialogMode.set('create');
    this.editingRecord.set(null);
    this.dialogOpen.set(true);
  }

  protected onEditRecord(record: Congregacion): void {
    this.dialogMode.set('edit');
    this.editingRecord.set(record);
    this.dialogOpen.set(true);
  }

  protected onDialogClosed(): void {
    this.dialogOpen.set(false);
  }

  protected onSaved(): void {
    this.loadAll();
    this.lookupsService.refreshCongregaciones();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.referenceDataService.listDepartamentos().subscribe({
      next: (data) => this.departamentos.set(data),
      error: () => this.snackbar.error('No se pudo cargar el catálogo de departamentos.'),
    });
    this.referenceDataService.listMunicipios().subscribe({
      next: (data) => this.municipios.set(data),
      error: () => this.snackbar.error('No se pudo cargar el catálogo de municipios.'),
    });
    this.referenceDataService.listCircuitos().subscribe({
      next: (data) => this.circuitos.set(data),
      error: () => this.snackbar.error('No se pudo cargar el catálogo de circuitos.'),
    });
    this.referenceDataService
      .listCongregaciones()
      .pipe(
        catchError(() => {
          this.snackbar.error('No se pudo cargar el listado de congregaciones.');
          return of<Congregacion[]>([]);
        }),
      )
      .subscribe((data) => {
        this.congregaciones.set(data);
        this.loading.set(false);
      });
  }
}
