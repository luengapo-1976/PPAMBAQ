import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from '../button/button';

export interface ConfigTableColumn<T> {
  key: string;
  label: string;
  value: (row: T) => string | number;
}

@Component({
  selector: 'app-config-table',
  imports: [FormsModule, Button],
  templateUrl: './config-table.html',
  styleUrl: './config-table.scss',
})
export class ConfigTable<T> {
  readonly rows = input.required<T[]>();
  readonly columns = input.required<ConfigTableColumn<T>[]>();
  readonly rowId = input.required<(row: T) => string>();
  readonly searchPlaceholder = input('Buscar…');
  readonly newRecordLabel = input('Nuevo registro');
  readonly emptyMessage = input('No hay registros que coincidan con el filtro actual.');

  readonly newRecord = output<void>();
  readonly editRecord = output<T>();

  protected readonly searchText = signal('');
  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected readonly filteredRows = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    const cols = this.columns();
    const base = this.rows();
    if (!query) {
      return base;
    }
    return base.filter((row) =>
      cols.some((col) => String(col.value(row) ?? '').toLowerCase().includes(query)),
    );
  });

  protected readonly sortedRows = computed(() => {
    const key = this.sortKey();
    const rows = this.filteredRows();
    if (!key) {
      return rows;
    }
    const col = this.columns().find((c) => c.key === key);
    if (!col) {
      return rows;
    }
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const valueA = col.value(a);
      const valueB = col.value(b);
      if (valueA < valueB) return -1 * dir;
      if (valueA > valueB) return 1 * dir;
      return 0;
    });
  });

  protected onSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }
}
