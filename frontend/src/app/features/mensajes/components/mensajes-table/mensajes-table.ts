import { Component, input, output } from '@angular/core';
import { Mensaje } from '../../data/models';

@Component({
  selector: 'app-mensajes-table',
  templateUrl: './mensajes-table.html',
  styleUrl: './mensajes-table.scss',
})
export class MensajesTable {
  readonly rows = input.required<Mensaje[]>();
  readonly editRecord = output<Mensaje>();
}
