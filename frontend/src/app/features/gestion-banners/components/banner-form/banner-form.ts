import { Component, inject, input, output, signal } from '@angular/core';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../shared/ui/button/button';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../core/error.interceptor';
import { BannersService } from '../../data/banners.service';

const MAX_IMAGEN_SIZE_BYTES = 10 * 1024 * 1024;
const ANCHO_REQUERIDO_PX = 1892;
const ALTO_REQUERIDO_PX = 720;
const RATIO_REQUERIDO = ANCHO_REQUERIDO_PX / ALTO_REQUERIDO_PX;

@Component({
  selector: 'app-banner-form',
  imports: [Dialog, Button],
  templateUrl: './banner-form.html',
  styleUrl: './banner-form.scss',
})
export class BannerForm {
  private readonly bannersService = inject(BannersService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly anchoRequerido = ANCHO_REQUERIDO_PX;
  protected readonly altoRequerido = ALTO_REQUERIDO_PX;

  protected readonly uploading = signal(false);
  protected readonly saving = signal(false);
  protected readonly previewUrl = signal<string | null>(null);
  private pendingUpload: { url: string; path: string; width: number; height: number } | null = null;

  protected onCancel(): void {
    this.reset();
    this.closed.emit();
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) {
      return;
    }

    if (file.size > MAX_IMAGEN_SIZE_BYTES) {
      this.snackbar.error('La imagen no puede superar los 10 MB.');
      return;
    }

    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      this.snackbar.error('El archivo seleccionado no es una imagen válida.');
      return;
    }

    let archivoASubir: File;
    try {
      archivoASubir = await this.ajustarADimensionRequerida(bitmap, file);
    } catch {
      bitmap.close();
      this.snackbar.error('No se pudo procesar la imagen.');
      return;
    }
    bitmap.close();

    this.uploading.set(true);
    this.bannersService.uploadImagen(archivoASubir).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.pendingUpload = result;
        this.previewUrl.set(result.url);
        this.snackbar.success('Imagen cargada correctamente.');
      },
      error: (err: ApiError) => {
        this.uploading.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo subir la imagen.');
      },
    });
  }

  protected onQuitarImagen(): void {
    this.pendingUpload = null;
    this.previewUrl.set(null);
  }

  protected onGuardar(): void {
    if (!this.pendingUpload || this.saving() || this.uploading()) {
      return;
    }

    this.saving.set(true);
    this.bannersService
      .create({
        imagen_url: this.pendingUpload.url,
        storage_path: this.pendingUpload.path,
        ancho_px: this.pendingUpload.width,
        alto_px: this.pendingUpload.height,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbar.success('Banner agregado correctamente.');
          this.reset();
          this.saved.emit();
          this.closed.emit();
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.snackbar.error(err?.message ?? 'No se pudo guardar el banner.');
        },
      });
  }

  /** Ajusta cualquier imagen a 1900x415 igual que CSS "object-fit: cover": recorta
   * el sobrante de un solo eje (alto o ancho, el que sobre) y escala el resto de
   * forma uniforme — nunca estira ni deforma, sin importar la proporción de origen. */
  private ajustarADimensionRequerida(bitmap: ImageBitmap, original: File): Promise<File> {
    const canvas = document.createElement('canvas');
    canvas.width = ANCHO_REQUERIDO_PX;
    canvas.height = ALTO_REQUERIDO_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return Promise.reject(new Error('Canvas 2D no disponible.'));
    }

    const ratioOriginal = bitmap.width / bitmap.height;
    let recorteAncho = bitmap.width;
    let recorteAlto = bitmap.height;

    if (ratioOriginal > RATIO_REQUERIDO) {
      // Más ancha que lo requerido: recorta los costados, conserva el alto completo.
      recorteAncho = bitmap.height * RATIO_REQUERIDO;
    } else {
      // Más alta que lo requerido: recorta arriba/abajo, conserva el ancho completo.
      recorteAlto = bitmap.width / RATIO_REQUERIDO;
    }

    const origenX = (bitmap.width - recorteAncho) / 2;
    const origenY = (bitmap.height - recorteAlto) / 2;

    ctx.drawImage(
      bitmap,
      origenX,
      origenY,
      recorteAncho,
      recorteAlto,
      0,
      0,
      ANCHO_REQUERIDO_PX,
      ALTO_REQUERIDO_PX,
    );

    const tipo = original.type === 'image/png' ? 'image/png' : 'image/jpeg';
    return new Promise<File>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('No se pudo generar la imagen ajustada.'));
            return;
          }
          resolve(new File([blob], original.name, { type: tipo }));
        },
        tipo,
        0.92,
      );
    });
  }

  private reset(): void {
    this.pendingUpload = null;
    this.previewUrl.set(null);
  }
}
