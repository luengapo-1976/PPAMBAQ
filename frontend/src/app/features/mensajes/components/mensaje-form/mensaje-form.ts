import { Component, ElementRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../../../shared/ui/button/button';
import { SearchSelect, SearchSelectOption } from '../../../../shared/ui/search-select/search-select';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../core/error.interceptor';
import { MensajesService } from '../../data/mensajes.service';
import { Mensaje } from '../../data/models';

const MAX_ADJUNTO_SIZE_BYTES = 10 * 1024 * 1024;

function fileNameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.substring(decoded.lastIndexOf('/') + 1);
  } catch {
    return url;
  }
}

@Component({
  selector: 'app-mensaje-form',
  imports: [ReactiveFormsModule, Button, SearchSelect, FormField],
  templateUrl: './mensaje-form.html',
  styleUrl: './mensaje-form.scss',
})
export class MensajeForm {
  private readonly fb = inject(FormBuilder);
  private readonly mensajesService = inject(MensajesService);
  private readonly snackbar = inject(SnackbarService);

  readonly tipos = input<string[]>([]);
  readonly editingRecord = input<Mensaje | null>(null);
  readonly saved = output<void>();
  readonly cancelEdit = output<void>();

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly adjuntoFileName = signal<string | null>(null);
  private readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('mensajeTextarea');
  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('adjuntoInput');

  protected readonly tipoOptions = computed<SearchSelectOption[]>(() =>
    this.tipos().map((tipo) => ({ value: tipo, label: tipo })),
  );

  protected readonly form = this.fb.group({
    tipo: ['', [Validators.required, Validators.maxLength(50)]],
    mensaje: ['', [Validators.required, Validators.maxLength(2000)]],
    adjunto_asociado: [null as string | null],
  });

  protected readonly isEditing = computed(() => this.editingRecord() !== null);

  constructor() {
    effect(() => {
      const record = this.editingRecord();
      if (record) {
        this.form.patchValue({
          tipo: record.tipo,
          mensaje: record.mensaje,
          adjunto_asociado: record.adjunto_asociado,
        });
        this.adjuntoFileName.set(record.adjunto_asociado ? fileNameFromUrl(record.adjunto_asociado) : null);
      } else {
        this.form.reset();
        this.adjuntoFileName.set(null);
      }
    });
  }

  protected onNewMensaje(): void {
    this.cancelEdit.emit();
    this.form.reset();
    this.adjuntoFileName.set(null);
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
    if (file.size > MAX_ADJUNTO_SIZE_BYTES) {
      this.snackbar.error('El archivo adjunto no puede superar los 10 MB.');
      return;
    }

    this.uploading.set(true);
    this.mensajesService.uploadAdjunto(file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.form.controls.adjunto_asociado.setValue(result.url);
        this.form.controls.adjunto_asociado.markAsDirty();
        this.adjuntoFileName.set(file.name);
        this.snackbar.success('Archivo adjunto cargado correctamente.');
      },
      error: (err: ApiError) => {
        this.uploading.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo subir el archivo adjunto.');
      },
    });
  }

  protected onRemoveAdjunto(): void {
    this.form.controls.adjunto_asociado.setValue(null);
    this.form.controls.adjunto_asociado.markAsDirty();
    this.adjuntoFileName.set(null);
  }

  protected applyStyle(marker: string): void {
    const textarea = this.textareaRef()?.nativeElement;
    if (!textarea) {
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = this.form.controls.mensaje.value ?? '';
    const before = current.slice(0, start);
    const selected = current.slice(start, end);
    const after = current.slice(end);
    const newText = `${before}${marker}${selected}${marker}${after}`;

    this.form.controls.mensaje.setValue(newText);
    this.form.controls.mensaje.markAsDirty();

    queueMicrotask(() => {
      textarea.focus();
      const cursorStart = start + marker.length;
      const cursorEnd = cursorStart + selected.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  protected onBold(): void {
    this.applyStyle('*');
  }

  protected onItalic(): void {
    this.applyStyle('_');
  }

  protected onSave(): void {
    if (this.form.invalid || this.saving() || this.uploading()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      tipo: this.form.controls.tipo.value!,
      mensaje: this.form.controls.mensaje.value!,
      adjunto_asociado: this.form.controls.adjunto_asociado.value,
    };

    const editing = this.editingRecord();
    this.saving.set(true);
    const request$ = editing ? this.mensajesService.update(editing.id, payload) : this.mensajesService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success(editing ? 'Mensaje actualizado correctamente.' : 'Mensaje guardado correctamente.');
        this.form.reset();
        this.adjuntoFileName.set(null);
        this.saved.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar el mensaje.');
      },
    });
  }
}
