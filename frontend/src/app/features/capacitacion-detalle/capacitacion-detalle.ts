import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CapacitacionesService } from '../gestion-capacitaciones/data/capacitaciones.service';
import { Capacitacion } from '../gestion-capacitaciones/data/models';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { getEmbedUrl } from '../../shared/utils/video-embed.util';
import { ParticipanteDesktopHeader } from '../../layout/participante-desktop-header/participante-desktop-header';
import { ZoomImage } from '../../shared/ui/zoom-image/zoom-image';

@Component({
  selector: 'app-capacitacion-detalle',
  imports: [ParticipanteDesktopHeader, ZoomImage],
  templateUrl: './capacitacion-detalle.html',
  styleUrl: './capacitacion-detalle.scss',
})
export class CapacitacionDetalle {
  private readonly route = inject(ActivatedRoute);
  private readonly capacitacionesService = inject(CapacitacionesService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly snackbar = inject(SnackbarService);

  protected readonly loading = signal(true);
  protected readonly capacitacion = signal<Capacitacion | null>(null);

  protected readonly embedUrl = computed<SafeResourceUrl | null>(() => {
    const url = getEmbedUrl(this.capacitacion()?.video_url);
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.capacitacionesService.findById(id).subscribe({
      next: (data) => {
        this.capacitacion.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar el elemento de capacitación.');
      },
    });
  }
}
