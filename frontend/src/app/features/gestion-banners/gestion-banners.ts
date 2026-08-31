import { Component, inject, signal } from '@angular/core';
import { BannerForm } from './components/banner-form/banner-form';
import { BannersTable } from './components/banners-table/banners-table';
import { Button } from '../../shared/ui/button/button';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { BannersService } from './data/banners.service';
import { Banner } from './data/models';
import { ApiError } from '../../core/error.interceptor';

@Component({
  selector: 'app-gestion-banners',
  imports: [BannerForm, BannersTable, Button],
  templateUrl: './gestion-banners.html',
  styleUrl: './gestion-banners.scss',
})
export class GestionBanners {
  private readonly bannersService = inject(BannersService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly banners = signal<Banner[]>([]);
  protected readonly dialogOpen = signal(false);

  constructor() {
    this.loadBanners();
  }

  protected onNewRecord(): void {
    this.dialogOpen.set(true);
  }

  protected onDialogClosed(): void {
    this.dialogOpen.set(false);
  }

  protected onSaved(): void {
    this.dialogOpen.set(false);
    this.loadBanners();
  }

  protected onToggleActivo(event: { banner: Banner; activo: boolean }): void {
    this.bannersService.setActivo(event.banner.id, event.activo).subscribe({
      next: () => this.loadBanners(),
      error: (err: ApiError) =>
        this.snackbar.error(err?.message ?? 'No se pudo actualizar la visibilidad del banner.'),
    });
  }

  protected onMoveUp(banner: Banner): void {
    this.bannersService.mover(banner.id, 'arriba').subscribe({
      next: () => this.loadBanners(),
      error: (err: ApiError) => this.snackbar.error(err?.message ?? 'No se pudo mover el banner.'),
    });
  }

  protected onMoveDown(banner: Banner): void {
    this.bannersService.mover(banner.id, 'abajo').subscribe({
      next: () => this.loadBanners(),
      error: (err: ApiError) => this.snackbar.error(err?.message ?? 'No se pudo mover el banner.'),
    });
  }

  protected onDeleteRecord(banner: Banner): void {
    this.bannersService.delete(banner.id).subscribe({
      next: () => {
        this.snackbar.success('Banner eliminado correctamente.');
        this.loadBanners();
      },
      error: (err: ApiError) =>
        this.snackbar.error(err?.message ?? 'No se pudo eliminar el banner.'),
    });
  }

  private loadBanners(): void {
    this.bannersService.listAll().subscribe({
      next: (data) => this.banners.set(data),
      error: () => this.snackbar.error('No se pudo cargar el listado de banners.'),
    });
  }
}
