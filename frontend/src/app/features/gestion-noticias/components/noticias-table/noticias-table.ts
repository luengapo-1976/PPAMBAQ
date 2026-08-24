import { Component, input, output } from '@angular/core';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Noticia } from '../../data/models';
import { formatDateShort } from '../../../solicitudes/data/publicador.utils';

@Component({
  selector: 'app-noticias-table',
  imports: [Badge],
  templateUrl: './noticias-table.html',
  styleUrl: './noticias-table.scss',
})
export class NoticiasTable {
  readonly rows = input.required<Noticia[]>();
  readonly editRecord = output<Noticia>();

  protected readonly formatDateShort = formatDateShort;
}
