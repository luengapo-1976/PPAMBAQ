import { Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
})
export class FormField {
  readonly label = input.required<string>();
  readonly required = input(false);
  readonly control = input<AbstractControl | null>(null);
  readonly customError = input<string | null>(null);
  readonly hint = input<string | null>(null);

  /** Se incrementa en cada evento del control (value/status/touched) para forzar
   * que los computed reaccionen: AbstractControl.invalid/touched/dirty son propiedades
   * mutables normales, no señales, así que no disparan recomputación por sí solas. */
  private readonly tick = signal(0);

  constructor() {
    effect((onCleanup) => {
      const control = this.control();
      if (!control) {
        return;
      }
      const subscription = control.events.subscribe(() => this.tick.update((v) => v + 1));
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected readonly showError = computed(() => {
    this.tick();
    const control = this.control();
    return !!control && control.invalid && (control.touched || control.dirty);
  });

  protected readonly errorMessage = computed(() => {
    this.tick();
    if (this.customError()) {
      return this.customError();
    }
    const control = this.control();
    const errors = control?.errors;
    if (!errors) {
      return '';
    }
    if (errors['required']) return 'Este campo es obligatorio.';
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres.`;
    if (errors['pattern']) return 'El formato no es válido.';
    if (errors['email']) return 'Correo electrónico no válido.';
    return 'Valor no válido.';
  });
}
