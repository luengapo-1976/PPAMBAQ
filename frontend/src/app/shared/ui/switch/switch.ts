import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-switch',
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
})
export class Switch {
  readonly checked = input(false);
  readonly labelOn = input('Activo');
  readonly labelOff = input('Inactivo');
  readonly disabled = input(false);
  readonly changed = output<boolean>();

  protected onToggle(): void {
    if (this.disabled()) {
      return;
    }
    this.changed.emit(!this.checked());
  }
}
