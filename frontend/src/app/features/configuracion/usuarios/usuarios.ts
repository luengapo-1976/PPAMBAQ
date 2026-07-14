import { Component, inject, signal } from '@angular/core';
import { ConfigTable, ConfigTableColumn } from '../../../shared/ui/config-table/config-table';
import { UsuarioFormDialog } from './components/usuario-form-dialog/usuario-form-dialog';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { ReferenceDataService } from '../data/reference-data.service';
import { Usuario } from '../data/models';

const COLUMNS: ConfigTableColumn<Usuario>[] = [
  { key: 'login', label: 'Login', value: (row) => row.login },
  { key: 'rol', label: 'Rol', value: (row) => row.rol ?? '—' },
  { key: 'correo', label: 'Correo electrónico', value: (row) => row.correo ?? '—' },
  { key: 'movil', label: 'Móvil', value: (row) => row.movil ?? '—' },
];

@Component({
  selector: 'app-usuarios',
  imports: [ConfigTable, UsuarioFormDialog],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly columns = COLUMNS;
  protected readonly rowId = (row: Usuario) => row.login;

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly loading = signal(true);

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingRecord = signal<Usuario | null>(null);

  constructor() {
    this.loadUsuarios();
  }

  protected onNewRecord(): void {
    this.dialogMode.set('create');
    this.editingRecord.set(null);
    this.dialogOpen.set(true);
  }

  protected onEditRecord(record: Usuario): void {
    this.dialogMode.set('edit');
    this.editingRecord.set(record);
    this.dialogOpen.set(true);
  }

  protected onDialogClosed(): void {
    this.dialogOpen.set(false);
  }

  protected onSaved(): void {
    this.loadUsuarios();
  }

  private loadUsuarios(): void {
    this.loading.set(true);
    this.referenceDataService.listUsuarios().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar el listado de usuarios.');
      },
    });
  }
}
