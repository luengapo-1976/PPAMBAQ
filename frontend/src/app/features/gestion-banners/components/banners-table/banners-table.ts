import { Component, input, output } from '@angular/core';
import { Switch } from '../../../../shared/ui/switch/switch';
import { Banner } from '../../data/models';

@Component({
  selector: 'app-banners-table',
  imports: [Switch],
  templateUrl: './banners-table.html',
  styleUrl: './banners-table.scss',
})
export class BannersTable {
  readonly rows = input.required<Banner[]>();

  readonly toggleActivo = output<{ banner: Banner; activo: boolean }>();
  readonly moveUp = output<Banner>();
  readonly moveDown = output<Banner>();
  readonly deleteRecord = output<Banner>();

  protected onToggleActivo(banner: Banner, activo: boolean): void {
    this.toggleActivo.emit({ banner, activo });
  }

  protected onDelete(banner: Banner): void {
    if (window.confirm('¿Eliminar este banner? Esta acción no se puede deshacer.')) {
      this.deleteRecord.emit(banner);
    }
  }
}
