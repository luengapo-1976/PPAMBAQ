import { Component, ElementRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../shared/ui/button/button';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../core/error.interceptor';
import { NoticiasService } from '../../data/noticias.service';
import { Noticia } from '../../data/models';

const MAX_IMAGEN_SIZE_BYTES = 10 * 1024 * 1024;

function fileNameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.substring(decoded.lastIndexOf('/') + 1);
  } catch {
    return url;
  }
}

@Component({
  selector: 'app-noticia-form',
  imports: [ReactiveFormsModule, Dialog, Button, FormField],
  templateUrl: './noticia-form.html',
  styleUrl: './noticia-form.scss',
})
export class NoticiaForm {
  private readonly fb = inject(FormBuilder);
  private readonly noticiasService = inject(NoticiasService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly record = input<Noticia | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly imagenFileName = signal<string | null>(null);

  private readonly contenidoRef = viewChild<ElementRef<HTMLDivElement>>('contenidoEditor');
  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('imagenInput');

  protected readonly dialogTitle = computed(() => (this.mode() === 'create' ? 'Nueva noticia' : 'Editar noticia'));

  protected readonly estadoActual = computed(() => this.record()?.estado ?? 'BORRADOR');
  protected readonly publicarLabel = computed(() =>
    this.estadoActual() === 'PUBLICADA' ? 'Volver a borrador' : 'Publicar',
  );

  protected readonly form = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    resumen: ['', [Validators.required, Validators.maxLength(300)]],
    contenido: ['', [Validators.required]],
    imagen_url: [null as string | null],
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

  protected onCancel(): void {
    this.form.reset();
    this.imagenFileName.set(null);
    this.closed.emit();
  }

  protected onContenidoInput(): void {
    const html = this.contenidoRef()?.nativeElement.innerHTML ?? '';
    this.form.controls.contenido.setValue(html);
    this.form.controls.contenido.markAsDirty();
    this.form.controls.contenido.markAsTouched();
  }

  protected exec(command: string): void {
    this.contenidoRef()?.nativeElement.focus();
    document.execCommand(command, false);
    this.onContenidoInput();
  }

  protected onInsertLink(): void {
    const url = window.prompt('Ingresa la URL del enlace:');
    if (!url) {
      return;
    }
    this.contenidoRef()?.nativeElement.focus();
    document.execCommand('createLink', false, url);
    this.onContenidoInput();
  }

  protected onExaminar(): void {
    this.fileInputRef()?.nativeElement.click();
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
    this.noticiasService.uploadImagen(file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.form.controls.imagen_url.setValue(result.url);
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
    this.form.controls.imagen_url.markAsDirty();
    this.imagenFileName.set(null);
  }

  protected onGuardar(): void {
    this.guardar();
  }

  protected onPublicarToggle(): void {
    this.guardar(this.estadoActual() === 'PUBLICADA' ? 'BORRADOR' : 'PUBLICADA');
  }

  private guardar(estado?: 'BORRADOR' | 'PUBLICADA'): void {
    if (this.form.invalid || this.saving() || this.uploading()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      titulo: this.form.controls.titulo.value!,
      resumen: this.form.controls.resumen.value!,
      contenido: this.form.controls.contenido.value!,
      imagen_url: this.form.controls.imagen_url.value,
      ...(estado ? { estado } : {}),
    };

    const editing = this.record();
    this.saving.set(true);
    const request$ = editing ? this.noticiasService.update(editing.id, payload) : this.noticiasService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success(
          estado === 'PUBLICADA'
            ? 'Noticia publicada correctamente.'
            : estado === 'BORRADOR'
              ? 'Noticia devuelta a borrador.'
              : editing
                ? 'Noticia actualizada correctamente.'
                : 'Noticia guardada correctamente.',
        );
        this.form.reset();
        this.imagenFileName.set(null);
        this.saved.emit();
        this.closed.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar la noticia.');
      },
    });
  }

  private applyCreateDefaults(): void {
    this.form.reset();
    this.imagenFileName.set(null);
    queueMicrotask(() => {
      const el = this.contenidoRef()?.nativeElement;
      if (el) {
        el.innerHTML = '';
      }
    });
  }

  private populateForm(record: Noticia): void {
    this.form.patchValue({
      titulo: record.titulo,
      resumen: record.resumen,
      contenido: record.contenido,
      imagen_url: record.imagen_url,
    });
    this.imagenFileName.set(record.imagen_url ? fileNameFromUrl(record.imagen_url) : null);
    queueMicrotask(() => {
      const el = this.contenidoRef()?.nativeElement;
      if (el) {
        el.innerHTML = record.contenido ?? '';
      }
    });
  }
}
