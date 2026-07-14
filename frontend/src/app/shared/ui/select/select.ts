import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Select),
      multi: true,
    },
  ],
})
export class Select implements ControlValueAccessor {
  readonly options = input.required<SelectOption[]>();
  readonly placeholder = input('Seleccionar…');
  readonly disabled = input(false);
  readonly inputId = input<string | null>(null);

  protected readonly value = signal<string | null>(null);
  protected readonly isDisabled = signal(false);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

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

  protected onSelectChange(newValue: string): void {
    const next = newValue === '' ? null : newValue;
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
