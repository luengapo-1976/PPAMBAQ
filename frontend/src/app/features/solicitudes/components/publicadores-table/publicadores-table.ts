import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from '../../../../shared/ui/button/button';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Publicador } from '../../data/models';
import { ESTADO_CONFIG } from '../../data/estado.config';
import { formatDateShort, nombreCompleto } from '../../data/publicador.utils';
import { exportPublicadoresToCsv, exportPublicadoresToExcel } from '../../data/export.util';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';

type SortKey =
  | 'fecha_solicitud'
  | 'nombre'
  | 'sexo'
  | 'estado_civil'
  | 'nombre_conyuge'
  | 'movil'
  | 'correo_electronico'
  | 'nombre_congregacion'
  | 'codigo_circuito'
  | 'entrenamiento_requerido'
  | 'estado';

interface ColumnDef {
  key: SortKey;
  label: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'fecha_solicitud', label: 'Fecha solicitud' },
  { key: 'nombre', label: 'Nombre completo' },
  { key: 'sexo', label: 'Sexo' },
  { key: 'estado_civil', label: 'Estado civil' },
  { key: 'nombre_conyuge', label: 'Cónyuge' },
  { key: 'movil', label: 'Móvil' },
  { key: 'correo_electronico', label: 'Correo electrónico' },
  { key: 'nombre_congregacion', label: 'Congregación' },
  { key: 'codigo_circuito', label: 'Circuito' },
  { key: 'entrenamiento_requerido', label: 'Entrenamiento requerido' },
  { key: 'estado', label: 'Estado' },
];

function extract(row: Publicador, key: SortKey): string | number {
  switch (key) {
    case 'nombre':
      return nombreCompleto(row);
    case 'nombre_congregacion':
      return row.nombre_congregacion ?? '';
    case 'codigo_circuito':
      return row.codigo_circuito ?? '';
    case 'nombre_conyuge':
      return row.nombre_conyuge ?? '';
    default:
      return (row[key] as string) ?? '';
  }
}

@Component({
  selector: 'app-publicadores-table',
  imports: [FormsModule, Button, Badge],
  templateUrl: './publicadores-table.html',
  styleUrl: './publicadores-table.scss',
})
export class PublicadoresTable {
  private readonly snackbar = inject(SnackbarService);

  readonly rows = input.required<Publicador[]>();
  /** true cuando la tarjeta de resumen "Cumple requisitos" está activa como filtro. */
  readonly cumpleRequisitosActive = input(false);

  readonly newRecord = output<void>();
  readonly editRecord = output<Publicador>();
  readonly viewActions = output<string[]>();

  protected readonly columns = COLUMNS;
  protected readonly estadoConfig = ESTADO_CONFIG;
  protected readonly formatDateShort = formatDateShort;
  protected readonly nombreCompleto = nombreCompleto;

  protected readonly searchText = signal('');
  protected readonly sortKey = signal<SortKey>('fecha_solicitud');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());

  protected readonly fechaAprobacionDesde = signal('');
  protected readonly fechaAprobacionHasta = signal('');
  /** Valores realmente aplicados al filtro: solo cambian al presionar "Filtrar",
   * para que escribir/seleccionar una fecha no filtre la grilla en cada tecleo. */
  protected readonly appliedFechaAprobacionDesde = signal('');
  protected readonly appliedFechaAprobacionHasta = signal('');

  constructor() {
    effect(() => {
      if (!this.cumpleRequisitosActive()) {
        this.fechaAprobacionDesde.set('');
        this.fechaAprobacionHasta.set('');
        this.appliedFechaAprobacionDesde.set('');
        this.appliedFechaAprobacionHasta.set('');
      }
    });
  }

  protected onFiltrarFechaAprobacion(): void {
    this.appliedFechaAprobacionDesde.set(this.fechaAprobacionDesde());
    this.appliedFechaAprobacionHasta.set(this.fechaAprobacionHasta());
  }

  protected readonly filteredRows = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    const base = this.rows();
    let result = !query
      ? base
      : base.filter((row) =>
          [nombreCompleto(row), row.correo_electronico, row.movil, row.nombre_congregacion ?? '', row.estado_civil]
            .join(' ')
            .toLowerCase()
            .includes(query),
        );

    if (this.cumpleRequisitosActive()) {
      const desde = this.appliedFechaAprobacionDesde();
      const hasta = this.appliedFechaAprobacionHasta();
      if (desde || hasta) {
        result = result.filter((row) => {
          // Se filtra por fecha_cumple_requisitos; si está nula, se usa fecha_aprobacion
          // como respaldo para no perder registros aprobados que aún no tengan esa fecha.
          const fecha = row.fecha_cumple_requisitos ?? row.fecha_aprobacion;
          if (!fecha) {
            return false;
          }
          if (desde && fecha < desde) {
            return false;
          }
          if (hasta && fecha > hasta) {
            return false;
          }
          return true;
        });
      }
    }

    return result;
  });

  protected readonly sortedRows = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...this.filteredRows()].sort((a, b) => {
      const valueA = extract(a, key);
      const valueB = extract(b, key);
      if (valueA < valueB) return -1 * dir;
      if (valueA > valueB) return 1 * dir;
      return 0;
    });
  });

  protected readonly allVisibleSelected = computed(() => {
    const rows = this.sortedRows();
    return rows.length > 0 && rows.every((row) => this.selectedIds().has(row.id));
  });

  protected readonly someVisibleSelected = computed(
    () => !this.allVisibleSelected() && this.sortedRows().some((row) => this.selectedIds().has(row.id)),
  );

  protected onSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  protected toggleRow(id: string, checked: boolean): void {
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  protected toggleAll(checked: boolean): void {
    const visibleIds = this.sortedRows().map((row) => row.id);
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  }

  protected onViewActions(): void {
    this.viewActions.emit([...this.selectedIds()]);
  }

  protected readonly exportingExcel = signal(false);

  protected async onExportExcel(): Promise<void> {
    const rows = this.sortedRows();
    if (rows.length === 0) {
      this.snackbar.show('No hay registros para exportar con el filtro actual.', 'info');
      return;
    }
    this.exportingExcel.set(true);
    try {
      await exportPublicadoresToExcel(rows);
    } catch {
      this.snackbar.error('No se pudo generar el archivo de Excel.');
    } finally {
      this.exportingExcel.set(false);
    }
  }

  protected onExportCsv(): void {
    const rows = this.sortedRows();
    if (rows.length === 0) {
      this.snackbar.show('No hay registros para exportar con el filtro actual.', 'info');
      return;
    }
    try {
      exportPublicadoresToCsv(rows);
    } catch {
      this.snackbar.error('No se pudo generar el archivo CSV.');
    }
  }
}
