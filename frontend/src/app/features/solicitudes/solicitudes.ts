import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { EstadoSummary } from './components/estado-summary/estado-summary';
import { PublicadoresTable } from './components/publicadores-table/publicadores-table';
import { PublicadorFormDialog } from './components/publicador-form-dialog/publicador-form-dialog';
import { EnviarMensajePanel } from './components/enviar-mensaje-panel/enviar-mensaje-panel';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { PublicadoresService } from './data/publicadores.service';
import { LookupsService } from './data/lookups.service';
import { Congregacion, Departamento, Municipio, Publicador } from './data/models';
import {
  CardKey,
  CumpleSubOption,
  matchesCumple,
  matchesPendiente1,
  matchesPendiente2,
  Pendiente1SubOption,
  Pendiente2SubOption,
} from './data/estado-summary.util';

@Component({
  selector: 'app-solicitudes',
  imports: [EstadoSummary, PublicadoresTable, PublicadorFormDialog, EnviarMensajePanel],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.scss',
})
export class Solicitudes {
  private readonly publicadoresService = inject(PublicadoresService);
  private readonly lookupsService = inject(LookupsService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly publicadores = signal<Publicador[]>([]);
  protected readonly loading = signal(true);

  protected readonly departamentos = toSignal(
    this.lookupsService.getDepartamentos().pipe(
      tap((data) => {
        if (data.length === 0) {
          this.snackbar.show('El catálogo de departamentos está vacío en Supabase.', 'info');
        }
      }),
      catchError(() => {
        this.snackbar.error('No se pudo cargar el catálogo de departamentos.');
        return of<Departamento[]>([]);
      }),
    ),
    { initialValue: [] },
  );
  protected readonly municipios = toSignal(
    this.lookupsService.getMunicipios().pipe(
      catchError(() => {
        this.snackbar.error('No se pudo cargar el catálogo de municipios.');
        return of<Municipio[]>([]);
      }),
    ),
    { initialValue: [] },
  );
  protected readonly congregaciones = toSignal(
    this.lookupsService.getCongregaciones().pipe(
      catchError(() => {
        this.snackbar.error('No se pudo cargar el catálogo de congregaciones.');
        return of<Congregacion[]>([]);
      }),
    ),
    { initialValue: [] },
  );

  protected readonly activeCards = signal<ReadonlySet<CardKey>>(new Set());
  protected readonly subOptionPendiente1 = signal<Pendiente1SubOption>('todos');
  protected readonly subOptionPendiente2 = signal<Pendiente2SubOption>('todos');
  protected readonly subOptionCumple = signal<CumpleSubOption>('todos');

  protected readonly filteredPublicadores = computed(() => {
    const active = this.activeCards();
    const all = this.publicadores();
    if (active.size === 0) {
      return all;
    }
    if (active.has('total')) {
      return all;
    }
    const sub1 = this.subOptionPendiente1();
    const sub2 = this.subOptionPendiente2();
    const subC = this.subOptionCumple();
    return all.filter(
      (p) =>
        (active.has('pendiente1') && matchesPendiente1(p, sub1)) ||
        (active.has('pendiente2') && matchesPendiente2(p, sub2)) ||
        (active.has('cumple') && matchesCumple(p, subC)),
    );
  });

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingRecord = signal<Publicador | null>(null);

  protected readonly sendMessagePanelOpen = signal(false);
  protected readonly sendMessageSelectedIds = signal<string[]>([]);

  constructor() {
    this.loadPublicadores();
  }

  protected toggleCard(card: CardKey): void {
    this.activeCards.update((prev) => (prev.has(card) ? new Set() : new Set([card])));
  }

  protected onNewRecord(): void {
    this.dialogMode.set('create');
    this.editingRecord.set(null);
    this.dialogOpen.set(true);
  }

  protected onEditRecord(record: Publicador): void {
    this.dialogMode.set('edit');
    this.editingRecord.set(record);
    this.dialogOpen.set(true);
  }

  protected onDialogClosed(): void {
    this.dialogOpen.set(false);
  }

  protected onSaved(): void {
    this.loadPublicadores();
  }

  protected onSendMessage(selectedIds: string[]): void {
    if (selectedIds.length === 0) {
      return;
    }
    this.sendMessageSelectedIds.set(selectedIds);
    this.sendMessagePanelOpen.set(true);
  }

  protected onSendMessagePanelClosed(): void {
    this.sendMessagePanelOpen.set(false);
  }

  private loadPublicadores(): void {
    this.loading.set(true);
    this.publicadoresService.list().subscribe({
      next: (data) => {
        this.publicadores.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar el listado de solicitudes.');
      },
    });
  }
}
