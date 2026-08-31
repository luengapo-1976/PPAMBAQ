import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../shared/ui/button/button';
import { Badge } from '../../../../shared/ui/badge/badge';
import {
  SearchSelect,
  SearchSelectOption,
} from '../../../../shared/ui/search-select/search-select';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../core/error.interceptor';
import { MensajesService } from '../../data/mensajes.service';
import { Mensaje } from '../../data/models';
import {
  MENSAJE_TOKENS,
  MENSAJE_TOKENS_CON_HERMANO,
  MensajeToken,
} from '../../data/mensaje-tokens';

const MAX_ADJUNTO_SIZE_BYTES = 10 * 1024 * 1024;
const MENTION_MENU_WIDTH = 300;
const MENTION_MENU_MAX_HEIGHT = 260;

function fileNameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.substring(decoded.lastIndexOf('/') + 1);
  } catch {
    return url;
  }
}

/** Busca hacia atrás desde el cursor una "/" que dispare el menú de campos:
 * debe estar al inicio del texto o precedida de un espacio/salto de línea, y
 * no debe haber espacios entre ella y el cursor (si los hay, ya no es una
 * mención activa sino texto normal). */
function findActiveMention(value: string, cursor: number): { start: number; query: string } | null {
  let i = cursor - 1;
  while (i >= 0) {
    const ch = value[i];
    if (ch === '/') {
      const before = i === 0 ? '' : value[i - 1];
      return i === 0 || /\s/.test(before) ? { start: i, query: value.slice(i + 1, cursor) } : null;
    }
    if (/\s/.test(ch)) {
      return null;
    }
    i--;
  }
  return null;
}

/** Coordenadas (viewport) del cursor dentro de un <textarea>, calculadas con
 * un <div> espejo que replica su tipografía/paddings — técnica estándar para
 * ubicar overlays (menús de menciones, etc.) junto al caret de un textarea,
 * que no expone esa posición de forma nativa. */
function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
): { top: number; left: number; height: number } {
  const mirror = document.createElement('div');
  const style = getComputedStyle(textarea);
  const mirroredProps: (keyof CSSStyleDeclaration)[] = [
    'boxSizing',
    'width',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'letterSpacing',
    'lineHeight',
    'textTransform',
    'wordSpacing',
    'whiteSpace',
    'overflowWrap',
  ];
  for (const prop of mirroredProps) {
    (mirror.style as unknown as Record<string, string>)[prop as string] = style[prop] as string;
  }
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';

  mirror.textContent = textarea.value.substring(0, position);
  const marker = document.createElement('span');
  marker.textContent = textarea.value.substring(position) || '.';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const textareaRect = textarea.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();

  const coords = {
    top: textareaRect.top + (markerRect.top - mirrorRect.top) - textarea.scrollTop,
    left: textareaRect.left + (markerRect.left - mirrorRect.left) - textarea.scrollLeft,
    height: markerRect.height,
  };

  document.body.removeChild(mirror);
  return coords;
}

@Component({
  selector: 'app-mensaje-form',
  imports: [ReactiveFormsModule, Dialog, Button, Badge, SearchSelect, FormField],
  templateUrl: './mensaje-form.html',
  styleUrl: './mensaje-form.scss',
})
export class MensajeForm {
  private readonly fb = inject(FormBuilder);
  private readonly mensajesService = inject(MensajesService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly tipos = input<string[]>([]);
  readonly record = input<Mensaje | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly adjuntoFileName = signal<string | null>(null);
  private readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('mensajeTextarea');
  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('adjuntoInput');

  protected readonly dialogTitle = computed(() =>
    this.mode() === 'create' ? 'Nuevo mensaje' : 'Editar mensaje',
  );

  protected readonly tipoOptions = computed<SearchSelectOption[]>(() =>
    this.tipos().map((tipo) => ({ value: tipo, label: tipo })),
  );

  protected readonly helpOpen = signal(false);
  protected readonly mensajeTokens = MENSAJE_TOKENS;
  protected readonly tokensConHermano = MENSAJE_TOKENS_CON_HERMANO;

  protected readonly mentionOpen = signal(false);
  protected readonly mentionQuery = signal('');
  protected readonly mentionHighlight = signal(0);
  protected readonly mentionPosition = signal<{ top: number; left: number } | null>(null);
  private mentionStart: number | null = null;

  protected readonly filteredMentionTokens = computed<MensajeToken[]>(() => {
    const query = this.mentionQuery().trim().toLowerCase();
    return query ? MENSAJE_TOKENS.filter((t) => t.token.includes(query)) : MENSAJE_TOKENS;
  });

  protected readonly form = this.fb.group({
    tipo: ['', [Validators.required, Validators.maxLength(50)]],
    mensaje: ['', [Validators.required, Validators.maxLength(2000)]],
    adjunto_asociado: [null as string | null],
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (!isOpen) {
        return;
      }
      this.closeMention();
      this.helpOpen.set(false);
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
    this.adjuntoFileName.set(null);
    this.closeMention();
    this.closed.emit();
  }

  protected onClear(): void {
    this.form.reset();
    this.adjuntoFileName.set(null);
    this.closeMention();
  }

  /** Detecta si el usuario está escribiendo una mención "/campo" y, de ser
   * así, abre el menú de campos filtrado y lo posiciona junto al cursor. */
  protected onMensajeInput(): void {
    const textarea = this.textareaRef()?.nativeElement;
    if (!textarea) {
      return;
    }
    const cursor = textarea.selectionStart;
    const mention = findActiveMention(textarea.value, cursor);
    if (!mention) {
      this.closeMention();
      return;
    }
    this.mentionStart = mention.start;
    this.mentionQuery.set(mention.query);
    this.mentionHighlight.set(0);
    this.mentionOpen.set(true);
    this.positionMentionMenu(textarea, mention.start);
  }

  /** Navegación por teclado del menú de campos; solo actúa mientras está abierto. */
  protected onMensajeKeydown(event: KeyboardEvent): void {
    if (!this.mentionOpen()) {
      return;
    }
    const items = this.filteredMentionTokens();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.mentionHighlight.update((i) => Math.min(i + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.mentionHighlight.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      const item = items[this.mentionHighlight()];
      if (item) {
        event.preventDefault();
        this.onSelectMentionToken(item);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMention();
    }
  }

  /** Inserta <token> en el lugar del "/campo" que el usuario estaba escribiendo. */
  protected onSelectMentionToken(item: MensajeToken): void {
    const textarea = this.textareaRef()?.nativeElement;
    if (!textarea || this.mentionStart === null) {
      return;
    }
    const cursor = textarea.selectionStart;
    const value = this.form.controls.mensaje.value ?? '';
    const insertText = `<${item.token}>`;
    const start = this.mentionStart;
    const newValue = value.slice(0, start) + insertText + value.slice(cursor);

    this.form.controls.mensaje.setValue(newValue);
    this.form.controls.mensaje.markAsDirty();
    this.closeMention();

    const newCursor = start + insertText.length;
    queueMicrotask(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
    });
  }

  private positionMentionMenu(textarea: HTMLTextAreaElement, caretIndex: number): void {
    const caret = getCaretCoordinates(textarea, caretIndex);
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const left = Math.min(Math.max(caret.left, 8), viewportWidth - MENTION_MENU_WIDTH - 8);
    const top = Math.min(
      caret.top + caret.height + 4,
      viewportHeight - MENTION_MENU_MAX_HEIGHT - 8,
    );
    this.mentionPosition.set({ top, left });
  }

  protected closeMention(): void {
    this.mentionOpen.set(false);
    this.mentionQuery.set('');
    this.mentionHighlight.set(0);
    this.mentionPosition.set(null);
    this.mentionStart = null;
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

    const editing = this.record();
    this.saving.set(true);
    const request$ = editing
      ? this.mensajesService.update(editing.id, payload)
      : this.mensajesService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success(
          editing ? 'Mensaje actualizado correctamente.' : 'Mensaje guardado correctamente.',
        );
        this.form.reset();
        this.adjuntoFileName.set(null);
        this.saved.emit();
        this.closed.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar el mensaje.');
      },
    });
  }

  private applyCreateDefaults(): void {
    this.form.reset();
    this.adjuntoFileName.set(null);
  }

  private populateForm(record: Mensaje): void {
    this.form.patchValue({
      tipo: record.tipo,
      mensaje: record.mensaje,
      adjunto_asociado: record.adjunto_asociado,
    });
    this.adjuntoFileName.set(
      record.adjunto_asociado ? fileNameFromUrl(record.adjunto_asociado) : null,
    );
  }
}
