import { Component, computed, input, output } from '@angular/core';
import {
  CardKey,
  CUMPLE_SUB_OPTIONS,
  CumpleSubOption,
  matchesCumple,
  matchesPendiente1,
  matchesPendiente2,
  Pendiente1SubOption,
  Pendiente2SubOption,
  PENDIENTE_SUB_OPTIONS,
} from '../../data/estado-summary.util';
import { Publicador } from '../../data/models';

@Component({
  selector: 'app-estado-summary',
  templateUrl: './estado-summary.html',
  styleUrl: './estado-summary.scss',
})
export class EstadoSummary {
  readonly publicadores = input.required<Publicador[]>();
  readonly activeCards = input.required<ReadonlySet<CardKey>>();
  readonly subOptionPendiente1 = input.required<Pendiente1SubOption>();
  readonly subOptionPendiente2 = input.required<Pendiente2SubOption>();
  readonly subOptionCumple = input.required<CumpleSubOption>();

  readonly toggleCard = output<CardKey>();
  readonly subOptionPendiente1Change = output<Pendiente1SubOption>();
  readonly subOptionPendiente2Change = output<Pendiente2SubOption>();
  readonly subOptionCumpleChange = output<CumpleSubOption>();

  protected readonly pendienteSubOptions = PENDIENTE_SUB_OPTIONS;
  protected readonly cumpleSubOptions = CUMPLE_SUB_OPTIONS;

  protected readonly countTotal = computed(() => this.publicadores().length);
  protected readonly countPendiente1 = computed(
    () => this.publicadores().filter((p) => matchesPendiente1(p, this.subOptionPendiente1())).length,
  );
  protected readonly countPendiente2 = computed(
    () => this.publicadores().filter((p) => matchesPendiente2(p, this.subOptionPendiente2())).length,
  );
  protected readonly countCumple = computed(
    () => this.publicadores().filter((p) => matchesCumple(p, this.subOptionCumple())).length,
  );
}
