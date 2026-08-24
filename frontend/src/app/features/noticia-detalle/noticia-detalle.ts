import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NoticiasService } from '../gestion-noticias/data/noticias.service';
import { Noticia } from '../gestion-noticias/data/models';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { formatDateShort } from '../../shared/utils/format.util';
import { ParticipanteDesktopHeader } from '../../layout/participante-desktop-header/participante-desktop-header';

@Component({
  selector: 'app-noticia-detalle',
  imports: [ParticipanteDesktopHeader],
  templateUrl: './noticia-detalle.html',
  styleUrl: './noticia-detalle.scss',
})
export class NoticiaDetalle {
  private readonly route = inject(ActivatedRoute);
  private readonly noticiasService = inject(NoticiasService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly formatDateShort = formatDateShort;
  protected readonly loading = signal(true);
  protected readonly noticia = signal<Noticia | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.noticiasService.findById(id).subscribe({
      next: (data) => {
        this.noticia.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar la noticia.');
      },
    });
  }
}
