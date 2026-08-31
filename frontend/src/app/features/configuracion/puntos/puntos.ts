import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ConfigTable, ConfigTableColumn } from '../../../shared/ui/config-table/config-table';
import { Select, SelectOption } from '../../../shared/ui/select/select';
import { PuntoFormDialog } from './components/punto-form-dialog/punto-form-dialog';
import { PuntoCalendarioDialog } from './components/punto-calendario-dialog/punto-calendario-dialog';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { ReferenceDataService } from '../data/reference-data.service';
import { LookupsService } from '../../solicitudes/data/lookups.service';
import { Departamento, Municipio, Punto, PUNTO_TIPOS } from '../data/models';
import { formatDateShort } from '../../../shared/utils/format.util';

const TIPO_PUNTO_FILTER_OPTIONS: SelectOption[] = [
  { value: 'TODOS', label: 'Todos' },
  ...PUNTO_TIPOS.map((tipo) => ({ value: tipo, label: tipo })),
];

@Component({
  selector: 'app-puntos',
  imports: [FormsModule, ConfigTable, Select, PuntoFormDialog, PuntoCalendarioDialog],
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

  protected readonly tipoPuntoFilterOptions = TIPO_PUNTO_FILTER_OPTIONS;
  protected readonly tipoFiltro = signal<'TODOS' | (typeof PUNTO_TIPOS)[number]>('TODOS');

  protected readonly puntosFiltrados = computed(() => {
    const tipo = this.tipoFiltro();
    const rows = this.puntos();
    return tipo === 'TODOS' ? rows : rows.filter((row) => row.tipo_punto === tipo);
  });

  protected readonly nombreDepartamento = (codigo: string): string =>
    this.departamentos().find((d) => d.codigo_departamento === codigo)?.nombre_departamento ??
    codigo;

  protected readonly nombreMunicipio = (codigo: string): string =>
    this.municipios().find((m) => m.codigo_municipio === codigo)?.nombre_municipio ?? codigo;

  protected readonly columns = computed<ConfigTableColumn<Punto>[]>(() => [
    { key: 'codigo_punto', label: 'Código', value: (row) => row.codigo_punto },
    { key: 'nombre_punto', label: 'Nombre', value: (row) => row.nombre_punto },
    { key: 'tipo_punto', label: 'Tipo', value: (row) => row.tipo_punto },
    { key: 'direccion', label: 'Dirección', value: (row) => row.direccion ?? '-' },
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
    { key: 'encargado', label: 'Encargado', value: (row) => row.encargado ?? '-' },
    { key: 'movil', label: 'Móvil', value: (row) => row.movil ?? '-' },
    { key: 'estado', label: 'Estado', value: (row) => row.estado },
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

  protected readonly rowId = (row: Punto) => String(row.codigo_punto);

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingRecord = signal<Punto | null>(null);

  protected readonly calendarioOpen = signal(false);
  protected readonly calendarioPunto = signal<Punto | null>(null);

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

  protected onVerCalendario(record: Punto): void {
    this.calendarioPunto.set(record);
    this.calendarioOpen.set(true);
  }

  protected onCalendarioClosed(): void {
    this.calendarioOpen.set(false);
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
