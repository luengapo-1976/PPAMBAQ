import { Component, DestroyRef, ElementRef, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

@Component({
  selector: 'app-search-select',
  templateUrl: './search-select.html',
  styleUrl: './search-select.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchSelect),
      multi: true,
    },
  ],
})
export class SearchSelect implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly options = input.required<SearchSelectOption[]>();
  readonly placeholder = input('Buscar…');
  readonly disabled = input(false);
  readonly emptyMessage = input('Sin resultados');
  /** Si es true, el texto escrito que no coincida con ninguna opción se guarda tal cual
   * al perder el foco o presionar Enter (combobox editable, ej. "Tipo de mensaje"). */
  readonly allowCustomValue = input(false);
  readonly maxLength = input<number | null>(null);

  protected readonly isOpen = signal(false);
  protected readonly query = signal('');
  protected readonly highlightedIndex = signal(0);
  protected readonly value = signal<string | null>(null);
  protected readonly isDisabled = signal(false);
  /** Posición calculada en viewport para que la lista se dibuje con position:fixed
   * y no quede recortada por el overflow:auto de contenedores como el body del Dialog. */
  protected readonly dropdownPosition = signal<DropdownPosition | null>(null);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private readonly onWindowScrollOrResize = () => this.close();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.detachDismissListeners());
  }

  protected readonly selectedLabel = computed(() => {
    const match = this.options().find((option) => option.value === this.value());
    if (match) {
      return match.label;
    }
    return this.allowCustomValue() ? (this.value() ?? '') : '';
  });

  protected readonly filteredOptions = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) {
      return this.options();
    }
    return this.options().filter((option) => option.label.toLowerCase().includes(q));
  });

  writeValue(value: string | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected isFieldDisabled(): boolean {
    return this.disabled() || this.isDisabled();
  }

  protected onFocus(): void {
    if (this.isFieldDisabled()) {
      return;
    }
    this.query.set('');
    this.open();
    this.highlightedIndex.set(0);
  }

  protected onInput(text: string): void {
    this.query.set(text);
    this.open();
    this.highlightedIndex.set(0);
  }

  protected onFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.host.nativeElement.contains(related)) {
      return;
    }
    if (this.allowCustomValue() && this.isOpen()) {
      this.commitCustomQuery();
    }
    this.close();
  }

  protected selectOption(option: SearchSelectOption): void {
    this.value.set(option.value);
    this.onChange(this.value());
    this.onTouched();
    this.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.filteredOptions();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open();
      this.highlightedIndex.update((i) => Math.min(i + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = items[this.highlightedIndex()];
      if (option) {
        this.selectOption(option);
      } else if (this.allowCustomValue()) {
        this.commitCustomQuery();
        this.close();
      }
    } else if (event.key === 'Escape') {
      this.close();
    }
  }

  private commitCustomQuery(): void {
    const trimmed = this.query().trim();
    if (!trimmed) {
      return;
    }
    const matched = this.options().find((option) => option.label.toLowerCase() === trimmed.toLowerCase());
    const newValue = matched ? matched.value : trimmed;
    if (newValue !== this.value()) {
      this.value.set(newValue);
      this.onChange(newValue);
    }
  }

  private open(): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    this.dropdownPosition.set({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    this.isOpen.set(true);
    // Se difiere un tick para no capturar el scroll que a veces dispara el propio
    // navegador al enfocar el campo (lo cual cerraría el desplegable recién abierto).
    setTimeout(() => {
      if (this.isOpen()) {
        this.attachDismissListeners();
      }
    });
  }

  private close(): void {
    this.isOpen.set(false);
    this.onTouched();
    this.detachDismissListeners();
  }

  /** Cierra el desplegable si el usuario hace scroll (en la ventana o en cualquier
   * contenedor con scroll propio) o cambia el tamaño de la ventana, ya que al usar
   * position:fixed la lista dejaría de estar alineada con el campo. */
  private attachDismissListeners(): void {
    window.addEventListener('scroll', this.onWindowScrollOrResize, true);
    window.addEventListener('resize', this.onWindowScrollOrResize);
  }

  private detachDismissListeners(): void {
    window.removeEventListener('scroll', this.onWindowScrollOrResize, true);
    window.removeEventListener('resize', this.onWindowScrollOrResize);
  }
}
