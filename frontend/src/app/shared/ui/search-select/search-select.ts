import {
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const DROPDOWN_DEFAULT_MAX_HEIGHT = 320;
const DROPDOWN_MIN_HEIGHT = 120;
const DROPDOWN_VIEWPORT_MARGIN = 8;

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
  /** Referencia a la lista desplegable, para distinguir su propio scroll interno
   * (que NO debe cerrarla) del scroll de la página o de un contenedor ancestro
   * (que sí debe cerrarla, porque desalinearía la lista de su campo anclado). */
  @ViewChild('dropdownList') private readonly dropdownListRef?: ElementRef<HTMLElement>;

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
  /** Distingue "recién abierto, sin escribir todavía" de "el usuario ya está escribiendo",
   * para poder seguir mostrando el valor seleccionado en el input mientras la lista
   * completa está abierta, en lugar de vaciarlo apenas se abre. */
  protected readonly hasTyped = signal(false);
  protected readonly highlightedIndex = signal(0);
  protected readonly value = signal<string | null>(null);
  protected readonly isDisabled = signal(false);
  /** Posición calculada en viewport para que la lista se dibuje con position:fixed
   * y no quede recortada por el overflow:auto de contenedores como el body del Dialog. */
  protected readonly dropdownPosition = signal<DropdownPosition | null>(null);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  /** El listener de scroll se registra en fase de captura para detectar el
   * scroll de cualquier contenedor ancestro (ver attachDismissListeners), pero
   * eso también intercepta el scroll interno de la propia lista desplegable
   * (el evento 'scroll' no burbujea, pero sí se captura al viajar hacia el
   * destino). Hay que ignorarlo explícitamente o la lista se cierra apenas el
   * usuario intenta desplazarla para ver más opciones. */
  private readonly onWindowScrollOrResize = (event: Event) => {
    const list = this.dropdownListRef?.nativeElement;
    if (list && event.target instanceof Node && list.contains(event.target)) {
      return;
    }
    this.close();
  };

  constructor() {
    inject(DestroyRef).onDestroy(() => this.detachDismissListeners());
  }

  protected readonly displayValue = computed(() => {
    if (!this.isOpen()) {
      return this.selectedLabel();
    }
    return this.hasTyped() ? this.query() : this.selectedLabel();
  });

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
    this.activate();
  }

  /** Reabre la lista en un segundo clic aunque el input nunca haya perdido el foco
   * tras una selección previa (el navegador no vuelve a disparar 'focus' en ese caso). */
  protected onMouseDown(): void {
    this.activate();
  }

  protected onInput(text: string): void {
    this.hasTyped.set(true);
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

  private activate(): void {
    if (this.isFieldDisabled() || this.isOpen()) {
      return;
    }
    this.hasTyped.set(false);
    this.query.set('');
    this.open();
    this.highlightedIndex.set(0);
  }

  private open(): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    /** Si el campo queda muy pegado al borde derecho (p. ej. junto a un panel
     * angosto anclado a la derecha), se recorre la lista hacia la izquierda para
     * que quede completa dentro del viewport y su scrollbar vertical sea visible. */
    const viewportWidth = document.documentElement.clientWidth;
    const left = Math.max(DROPDOWN_VIEWPORT_MARGIN, Math.min(rect.left, viewportWidth - rect.width - DROPDOWN_VIEWPORT_MARGIN));
    const top = rect.bottom + 4;
    /** Si no hay 320px libres hasta el borde inferior de la pantalla, se reduce la
     * altura máxima de la lista para que quede completa dentro del viewport y su
     * scroll interno (con la barra de desplazamiento) sea siempre alcanzable. */
    const viewportHeight = document.documentElement.clientHeight;
    const maxHeight = Math.max(
      DROPDOWN_MIN_HEIGHT,
      Math.min(DROPDOWN_DEFAULT_MAX_HEIGHT, viewportHeight - top - DROPDOWN_VIEWPORT_MARGIN),
    );
    this.dropdownPosition.set({ top, left, width: rect.width, maxHeight });
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
