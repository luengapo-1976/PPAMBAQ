import { Component, inject, signal } from '@angular/core';
import { NoticiaForm } from './components/noticia-form/noticia-form';
import { NoticiasTable } from './components/noticias-table/noticias-table';
import { Button } from '../../shared/ui/button/button';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { NoticiasService } from './data/noticias.service';
import { Noticia } from './data/models';
import { ApiError } from '../../core/error.interceptor';

@Component({
  selector: 'app-gestion-noticias',
  imports: [NoticiaForm, NoticiasTable, Button],
  templateUrl: './gestion-noticias.html',
  styleUrl: './gestion-noticias.scss',
})
export class GestionNoticias {
  private readonly noticiasService = inject(NoticiasService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly noticias = signal<Noticia[]>([]);
  protected readonly editingRecord = signal<Noticia | null>(null);

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');

  constructor() {
    this.loadNoticias();
  }

  protected onNewRecord(): void {
    this.dialogMode.set('create');
    this.editingRecord.set(null);
    this.dialogOpen.set(true);
  }

  protected onEditRecord(record: Noticia): void {
    this.dialogMode.set('edit');
    this.editingRecord.set(record);
    this.dialogOpen.set(true);
  }

  protected onDialogClosed(): void {
    this.dialogOpen.set(false);
  }

  protected onSaved(): void {
    this.dialogOpen.set(false);
    this.editingRecord.set(null);
    this.loadNoticias();
  }

  protected onToggleEstado(event: { noticia: Noticia; publicada: boolean }): void {
    this.noticiasService
      .setEstado(event.noticia.id, event.publicada ? 'PUBLICADA' : 'BORRADOR')
      .subscribe({
        next: () => this.loadNoticias(),
        error: (err: ApiError) =>
          this.snackbar.error(err?.message ?? 'No se pudo actualizar la visibilidad.'),
      });
  }

  protected onMoveUp(noticia: Noticia): void {
    this.noticiasService.mover(noticia.id, 'arriba').subscribe({
      next: () => this.loadNoticias(),
      error: (err: ApiError) => this.snackbar.error(err?.message ?? 'No se pudo mover la noticia.'),
    });
  }

  protected onMoveDown(noticia: Noticia): void {
    this.noticiasService.mover(noticia.id, 'abajo').subscribe({
      next: () => this.loadNoticias(),
      error: (err: ApiError) => this.snackbar.error(err?.message ?? 'No se pudo mover la noticia.'),
    });
  }

  protected onDeleteRecord(noticia: Noticia): void {
    this.noticiasService.delete(noticia.id).subscribe({
      next: () => {
        this.snackbar.success('Noticia eliminada correctamente.');
        this.loadNoticias();
      },
      error: (err: ApiError) =>
        this.snackbar.error(err?.message ?? 'No se pudo eliminar la noticia.'),
    });
  }

  private loadNoticias(): void {
    this.noticiasService.listAll().subscribe({
      next: (data) => this.noticias.set(data),
      error: () => this.snackbar.error('No se pudo cargar el listado de noticias.'),
    });
  }
}
