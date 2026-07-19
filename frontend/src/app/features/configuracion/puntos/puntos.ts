import { Component, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ConfigTable, ConfigTableColumn } from '../../../shared/ui/config-table/config-table';
import { PuntoFormDialog } from './components/punto-form-dialog/punto-form-dialog';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { ReferenceDataService } from '../data/reference-data.service';
import { LookupsService } from '../../solicitudes/data/lookups.service';
import { Departamento, Municipio, Punto } from '../data/models';
import { formatDateShort } from '../../../shared/utils/format.util';

@Component({
  selector: 'app-puntos',
  imports: [ConfigTable, PuntoFormDialog],
  templateUrl: './puntos.html',
  styleUrl: './puntos.scss',
})
export class Puntos {
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly lookupsService = inject(LookupsService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly puntos = signal<Punto[]>([]);
  protected readonly departamentos = signal<Departamento[]>([]);
  protected readonly municipios = signal<Municipio[]>([]);
  protected readonly loading = signal(true);

  protected readonly nombreDepartamento = (codigo: string): string =>
    this.departamentos().find((d) => d.codigo_departamento === codigo)?.nombre_departamento ?? codigo;

  protected readonly nombreMunicipio = (codigo: string): string =>
    this.municipios().find((m) => m.codigo_municipio === codigo)?.nombre_municipio ?? codigo;

  protected readonly columns = computed<ConfigTableColumn<Punto>[]>(() => [
    { key: 'codigo_punto', label: 'Código', value: (row) => row.codigo_punto },
    { key: 'nombre_punto', label: 'Nombre', value: (row) => row.nombre_punto },
    { key: 'direccion', label: 'Dirección', value: (row) => row.direccion ?? '—' },
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
    { key: 'encargado', label: 'Encargado', value: (row) => row.encargado ?? '—' },
    { key: 'movil', label: 'Móvil', value: (row) => row.movil ?? '—' },
    { key: 'estado', label: 'Estado', value: (row) => row.estado },
    { key: 'usuario_registra', label: 'Usuario registra', value: (row) => row.usuario_registra ?? '—' },
    { key: 'fecha_registro', label: 'Fecha registro', value: (row) => formatDateShort(row.fecha_registro) },
    { key: 'usuario_modifica', label: 'Usuario modifica', value: (row) => row.usuario_modifica ?? '—' },
    { key: 'fecha_modificacion', label: 'Fecha modificación', value: (row) => formatDateShort(row.fecha_modificacion) },
  ]);

  protected readonly rowId = (row: Punto) => String(row.codigo_punto);

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingRecord = signal<Punto | null>(null);

  constructor() {
    this.loadAll();
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
    this.loadAll();
    this.lookupsService.refreshPuntos();
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
    this.referenceDataService
      .listPuntos()
      .pipe(
        catchError(() => {
          this.snackbar.error('No se pudo cargar el listado de puntos.');
          return of<Punto[]>([]);
        }),
      )
      .subscribe((data) => {
        this.puntos.set(data);
        this.loading.set(false);
      });
  }
}
