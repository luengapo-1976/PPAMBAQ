import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../shared/ui/button/button';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../core/error.interceptor';
import { CapacitacionesService } from '../../data/capacitaciones.service';
import { Capacitacion, TipoCapacitacion } from '../../data/models';

const MAX_IMAGEN_SIZE_BYTES = 10 * 1024 * 1024;
const URL_PATTERN = /^https?:\/\/.+/i;

function fileNameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.substring(decoded.lastIndexOf('/') + 1);
  } catch {
    return url;
  }
}

@Component({
  selector: 'app-capacitacion-form',
  imports: [ReactiveFormsModule, Dialog, Button, FormField],
  templateUrl: './capacitacion-form.html',
  styleUrl: './capacitacion-form.scss',
})
export class CapacitacionForm {
  private readonly fb = inject(FormBuilder);
  private readonly capacitacionesService = inject(CapacitacionesService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly record = input<Capacitacion | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly imagenFileName = signal<string | null>(null);

  protected readonly dialogTitle = computed(() =>
    this.mode() === 'create' ? 'Nuevo elemento de capacitación' : 'Editar elemento de capacitación',
  );

  protected readonly form = this.fb.group({
    tipo: ['IMAGEN' as TipoCapacitacion, [Validators.required]],
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    resumen: ['', [Validators.required, Validators.maxLength(300)]],
    imagen_url: [null as string | null],
    storage_path: [null as string | null],
    video_url: ['', [Validators.pattern(URL_PATTERN)]],
    fecha_maxima_publicacion: [null as string | null],
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (!isOpen) {
        return;
      }
      if (this.mode() === 'create') {
        this.applyCreateDefaults();
      } else {
        const record = this.record();
        if (record) {
          this.populateForm(record);
        }
      }
    });
  }

  protected onSeleccionarTipo(tipo: TipoCapacitacion): void {
    this.form.controls.tipo.setValue(tipo);
    this.form.controls.tipo.markAsDirty();
  }

  protected onFileSelected(event: Event): void {
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

    this.uploading.set(true);
    this.capacitacionesService.uploadImagen(file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.form.controls.imagen_url.setValue(result.url);
        this.form.controls.storage_path.setValue(result.path);
        this.form.controls.imagen_url.markAsDirty();
        this.imagenFileName.set(file.name);
        this.snackbar.success('Imagen cargada correctamente.');
      },
      error: (err: ApiError) => {
        this.uploading.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo subir la imagen.');
      },
    });
  }

  protected onRemoveImagen(): void {
    this.form.controls.imagen_url.setValue(null);
    this.form.controls.storage_path.setValue(null);
    this.form.controls.imagen_url.markAsDirty();
    this.imagenFileName.set(null);
  }

  protected onCancel(): void {
    this.form.reset();
    this.imagenFileName.set(null);
    this.closed.emit();
  }

  protected onGuardar(): void {
    const tipo = this.form.controls.tipo.value!;

    if (tipo === 'IMAGEN' && !this.form.controls.imagen_url.value) {
      this.snackbar.error('Debes cargar una imagen.');
      return;
    }
    if (tipo === 'VIDEO' && !this.form.controls.video_url.value?.trim()) {
      this.snackbar.error('Debes indicar el enlace del video.');
      return;
    }
    if (this.form.invalid || this.saving() || this.uploading()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      tipo,
      titulo: this.form.controls.titulo.value!,
      resumen: this.form.controls.resumen.value!,
      imagen_url: tipo === 'IMAGEN' ? this.form.controls.imagen_url.value : null,
      storage_path: tipo === 'IMAGEN' ? this.form.controls.storage_path.value : null,
      video_url: tipo === 'VIDEO' ? this.form.controls.video_url.value : null,
      fecha_maxima_publicacion: this.form.controls.fecha_maxima_publicacion.value || null,
    };

    const editing = this.record();
    this.saving.set(true);
    const request$ = editing
      ? this.capacitacionesService.update(editing.id, payload)
      : this.capacitacionesService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success(
          editing ? 'Elemento actualizado correctamente.' : 'Elemento guardado correctamente.',
        );
        this.form.reset();
        this.imagenFileName.set(null);
        this.saved.emit();
        this.closed.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar el elemento.');
      },
    });
  }

  private applyCreateDefaults(): void {
    this.form.reset({ tipo: 'IMAGEN' });
    this.imagenFileName.set(null);
  }

  private populateForm(record: Capacitacion): void {
    this.form.patchValue({
      tipo: record.tipo,
      titulo: record.titulo,
      resumen: record.resumen,
      imagen_url: record.imagen_url,
      storage_path: record.storage_path,
      video_url: record.video_url ?? '',
      fecha_maxima_publicacion: record.fecha_maxima_publicacion,
    });
    this.imagenFileName.set(record.imagen_url ? fileNameFromUrl(record.imagen_url) : null);
  }
}
