import { Component, input, output } from '@angular/core';
import { Switch } from '../../../../shared/ui/switch/switch';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Capacitacion } from '../../data/models';
import { formatDateShort, todayIsoDateBogota } from '../../../../shared/utils/format.util';
import { getYoutubeThumbnail } from '../../../../shared/utils/video-embed.util';

@Component({
  selector: 'app-capacitaciones-table',
  imports: [Switch, Badge],
  templateUrl: './capacitaciones-table.html',
  styleUrl: './capacitaciones-table.scss',
})
export class CapacitacionesTable {
  readonly rows = input.required<Capacitacion[]>();

  readonly editRecord = output<Capacitacion>();
  readonly toggleActivo = output<{ capacitacion: Capacitacion; activo: boolean }>();
  readonly moveUp = output<Capacitacion>();
  readonly moveDown = output<Capacitacion>();
  readonly deleteRecord = output<Capacitacion>();

  protected readonly formatDateShort = formatDateShort;
  protected readonly getYoutubeThumbnail = getYoutubeThumbnail;

  protected onToggleActivo(capacitacion: Capacitacion, activo: boolean): void {
    this.toggleActivo.emit({ capacitacion, activo });
  }

  protected onDelete(capacitacion: Capacitacion): void {
    if (window.confirm('¿Eliminar este elemento? Esta acción no se puede deshacer.')) {
      this.deleteRecord.emit(capacitacion);
    }
  }

  protected estaVencida(capacitacion: Capacitacion): boolean {
    return (
      !!capacitacion.fecha_maxima_publicacion &&
      capacitacion.fecha_maxima_publicacion < todayIsoDateBogota()
    );
  }
}
