import { Component, input, output } from '@angular/core';

export type RespuestaSiNo = 'SI' | 'NO';

@Component({
  selector: 'app-si-no-toggle',
  templateUrl: './si-no-toggle.html',
  styleUrl: './si-no-toggle.scss',
})
export class SiNoToggle {
  readonly label = input.required<string>();
  readonly value = input<RespuestaSiNo | null>(null);
  readonly valueChange = output<RespuestaSiNo>();

  protected onSelect(respuesta: RespuestaSiNo): void {
    this.valueChange.emit(respuesta);
  }
}
