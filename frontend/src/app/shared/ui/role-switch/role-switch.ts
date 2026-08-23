import { Component, input, output } from '@angular/core';

export type RoleSwitchValue = 'usuario' | 'participante';

@Component({
  selector: 'app-role-switch',
  templateUrl: './role-switch.html',
  styleUrl: './role-switch.scss',
})
export class RoleSwitch {
  readonly active = input.required<RoleSwitchValue>();
  readonly changed = output<RoleSwitchValue>();

  protected onToggle(): void {
    this.changed.emit(this.active() === 'usuario' ? 'participante' : 'usuario');
  }
}
