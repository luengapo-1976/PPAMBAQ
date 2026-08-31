import { Component, input, output } from '@angular/core';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Switch } from '../../../../shared/ui/switch/switch';
import { Noticia } from '../../data/models';
import { formatDateShort } from '../../../solicitudes/data/publicador.utils';
import { todayIsoDateBogota } from '../../../../shared/utils/format.util';

@Component({
  selector: 'app-noticias-table',
  imports: [Badge, Switch],
  templateUrl: './noticias-table.html',
  styleUrl: './noticias-table.scss',
})
export class NoticiasTable {
  readonly rows = input.required<Noticia[]>();

  readonly editRecord = output<Noticia>();
  readonly toggleEstado = output<{ noticia: Noticia; publicada: boolean }>();
  readonly moveUp = output<Noticia>();
  readonly moveDown = output<Noticia>();
  readonly deleteRecord = output<Noticia>();

  protected readonly formatDateShort = formatDateShort;

  protected onToggleEstado(noticia: Noticia, publicada: boolean): void {
    this.toggleEstado.emit({ noticia, publicada });
  }

  protected onDelete(noticia: Noticia): void {
    if (window.confirm('¿Eliminar esta noticia? Esta acción no se puede deshacer.')) {
      this.deleteRecord.emit(noticia);
    }
  }

  protected estaVencida(noticia: Noticia): boolean {
    return (
      !!noticia.fecha_maxima_publicacion && noticia.fecha_maxima_publicacion < todayIsoDateBogota()
    );
  }
}
