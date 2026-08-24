import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { EstadoSummary } from './components/estado-summary/estado-summary';
import { PublicadoresTable } from './components/publicadores-table/publicadores-table';
import { PublicadorFormDialog } from './components/publicador-form-dialog/publicador-form-dialog';
import { EnviarMensajePanel } from './components/enviar-mensaje-panel/enviar-mensaje-panel';
import { AccionesBar } from './components/acciones-bar/acciones-bar';
import { AsignarLugarPanel } from './components/asignar-lugar-panel/asignar-lugar-panel';
import { EntrenamientoFilter } from './components/entrenamiento-filter/entrenamiento-filter';
import { Button } from '../../shared/ui/button/button';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { PublicadoresService } from './data/publicadores.service';
import { LookupsService } from './data/lookups.service';
import { Congregacion, Departamento, Municipio, Publicador } from './data/models';
import { Punto } from '../configuracion/data/models';
import {
  CardKey,
  CumpleSubOption,
  matchesCumple,
  matchesPendiente1,
  matchesPendiente2,
  Pendiente1SubOption,
  Pendiente2SubOption,
} from './data/estado-summary.util';
import { EMPTY_ENTRENAMIENTO_FILTRO, EntrenamientoFiltro, applyEntrenamientoFiltro } from './data/entrenamiento-filter.util';

@Component({
  selector: 'app-solicitudes',
  imports: [
    EstadoSummary,
    PublicadoresTable,
    PublicadorFormDialog,
    EnviarMensajePanel,
    AccionesBar,
    AsignarLugarPanel,
    EntrenamientoFilter,
    Button,
  ],
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
  protected readonly puntos = toSignal(
    this.lookupsService.getPuntos().pipe(
      catchError(() => {
        this.snackbar.error('No se pudo cargar el catálogo de puntos.');
        return of<Punto[]>([]);
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

  protected readonly entrenamientoFiltro = signal<EntrenamientoFiltro>(EMPTY_ENTRENAMIENTO_FILTRO);
  /** Solo uno de los dos puede estar visible a la vez: esta sección y el filtro
   * de fecha de aprobación (dentro de la tarjeta "Cumple requisitos") son excluyentes. */
  protected readonly entrenamientoFilterVisible = signal(false);

  protected readonly gridRows = computed(() =>
    applyEntrenamientoFiltro(this.filteredPublicadores(), this.entrenamientoFiltro()),
  );

  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<'create' | 'edit'>('create');
  protected readonly editingRecord = signal<Publicador | null>(null);

  protected readonly accionesBarCollapsed = signal(true);
  protected readonly accionesSelectedIds = signal<string[]>([]);
  protected readonly activeAccion = signal<'asignar-lugar' | 'enviar-mensaje' | null>(null);

  /** Selección viva de la grilla, compartida entre la tabla y la barra de acciones. */
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  /** Filas actualmente mostradas en la grilla (tras filtros/orden), usadas al exportar. */
  protected readonly displayedRows = signal<Publicador[]>([]);

  /** Ancho actual de la barra de acciones; los paneles abiertos desde ella se
   * insertan a su izquierda usando este mismo valor como rightOffset. Sin
   * selección la barra se oculta por completo (ver acciones-bar.scss), así que
   * tampoco debe reservarse espacio para ella. */
  protected readonly accionesBarWidth = computed(() => {
    if (this.selectedIds().size === 0) {
      return '0px';
    }
    return this.accionesBarCollapsed() ? '72px' : '360px';
  });

  constructor() {
    this.loadPublicadores();
    effect(() => {
      if (!this.entrenamientoFilterVisible()) {
        this.entrenamientoFiltro.set(EMPTY_ENTRENAMIENTO_FILTRO);
      }
    });
  }

  protected toggleCard(card: CardKey): void {
    const next = this.activeCards().has(card) ? new Set<CardKey>() : new Set<CardKey>([card]);
    this.activeCards.set(next);
    if (next.has('cumple')) {
      this.entrenamientoFilterVisible.set(false);
    }
  }

  protected onToggleEntrenamientoFilter(): void {
    const next = !this.entrenamientoFilterVisible();
    this.entrenamientoFilterVisible.set(next);
    if (next && this.activeCards().has('cumple')) {
      this.activeCards.set(new Set());
    }
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

  protected onSelectAsignarLugar(): void {
    this.accionesSelectedIds.set([...this.selectedIds()]);
    this.activeAccion.set('asignar-lugar');
  }

  protected onSelectEnviarMensaje(): void {
    this.accionesSelectedIds.set([...this.selectedIds()]);
    this.activeAccion.set('enviar-mensaje');
  }

  /** Cierra solo el formulario activo; la barra de acciones permanece siempre visible. */
  protected onAccionPanelClosed(): void {
    this.activeAccion.set(null);
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
