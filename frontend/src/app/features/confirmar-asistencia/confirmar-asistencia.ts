import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Select, SelectOption } from '../../shared/ui/select/select';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { AuthService } from '../../core/auth.service';
import { PublicadoresService } from '../solicitudes/data/publicadores.service';
import { LookupsService } from '../solicitudes/data/lookups.service';
import { Publicador } from '../solicitudes/data/models';
import { Punto } from '../configuracion/data/models';
import {
  TipoEntrenamientoFiltro,
  applyEntrenamientoFiltro,
  lugaresDisponibles,
} from '../solicitudes/data/entrenamiento-filter.util';
import {
  formatDateShort,
  nombreCompleto,
  todayIsoDate,
} from '../solicitudes/data/publicador.utils';

@Component({
  selector: 'app-confirmar-asistencia',
  imports: [FormsModule, Select],
  templateUrl: './confirmar-asistencia.html',
  styleUrl: './confirmar-asistencia.scss',
})
export class ConfirmarAsistencia {
  private readonly publicadoresService = inject(PublicadoresService);
  private readonly lookupsService = inject(LookupsService);
  private readonly snackbar = inject(SnackbarService);
  private readonly authService = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly publicadores = signal<Publicador[]>([]);
  protected readonly puntos = toSignal(
    this.lookupsService.getPuntos().pipe(
      catchError(() => {
        this.snackbar.error('No se pudo cargar el catálogo de puntos.');
        return of<Punto[]>([]);
      }),
    ),
    { initialValue: [] },
  );

  protected readonly selectedFecha = signal<string | null>(null);
  protected readonly selectedTipo = signal<TipoEntrenamientoFiltro | null>(null);
  protected readonly selectedCodigoPunto = signal<number | null>(null);

  protected readonly confirmingIds = signal<ReadonlySet<string>>(new Set());

  protected readonly fechaOptions = computed<SelectOption[]>(() => {
    const today = todayIsoDate();
    const fechas = new Set<string>();
    for (const row of this.publicadores()) {
      if (row.fecha_primera_capacitacion && row.fecha_primera_capacitacion >= today) {
        fechas.add(row.fecha_primera_capacitacion);
      }
      if (row.fecha_segunda_capacitacion && row.fecha_segunda_capacitacion >= today) {
        fechas.add(row.fecha_segunda_capacitacion);
      }
    }
    return [...fechas].sort().map((fecha) => ({ value: fecha, label: formatDateShort(fecha) }));
  });

  protected readonly tipoOptions = computed<SelectOption[]>(() => {
    const fecha = this.selectedFecha();
    if (!fecha) {
      return [];
    }
    const rows = this.publicadores();
    const options: SelectOption[] = [];
    if (rows.some((row) => row.fecha_primera_capacitacion === fecha)) {
      options.push({ value: 'Primer entrenamiento', label: 'Primer entrenamiento' });
    }
    if (rows.some((row) => row.fecha_segunda_capacitacion === fecha)) {
      options.push({ value: 'Segundo entrenamiento', label: 'Segundo entrenamiento' });
    }
    return options;
  });

  protected readonly lugarOptions = computed<SelectOption[]>(() => {
    const fecha = this.selectedFecha();
    const tipo = this.selectedTipo();
    if (!fecha || !tipo) {
      return [];
    }
    const codigos = lugaresDisponibles(this.publicadores(), tipo, fecha);
    const puntosPorCodigo = new Map(this.puntos().map((punto) => [punto.codigo_punto, punto]));
    return codigos
      .map((codigo) => ({ codigo, punto: puntosPorCodigo.get(codigo) }))
      .sort((a, b) => (a.punto?.nombre_punto ?? '').localeCompare(b.punto?.nombre_punto ?? ''))
      .map(({ codigo, punto }) => ({
        value: String(codigo),
        label: punto
          ? `${punto.nombre_punto} - ${punto.direccion ?? 'Sin dirección'} - Encargado: ${punto.encargado ?? '-'}${punto.movil ? ' (' + punto.movil + ')' : ''}`
          : `Punto ${codigo}`,
      }));
  });

  protected readonly rows = computed<Publicador[]>(() => {
    const fecha = this.selectedFecha();
    const tipo = this.selectedTipo();
    const codigoPunto = this.selectedCodigoPunto();
    if (!fecha || !tipo || codigoPunto == null) {
      return [];
    }
    return [...applyEntrenamientoFiltro(this.publicadores(), { tipo, fecha, codigoPunto })].sort(
      (a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)),
    );
  });

  protected readonly asistieronCount = computed(
    () => this.rows().filter((row) => this.isAsistio(row)).length,
  );

  protected readonly selectedLugarValue = computed(() => {
    const codigo = this.selectedCodigoPunto();
    return codigo == null ? null : String(codigo);
  });

  protected readonly formatDateShort = formatDateShort;
  protected readonly nombreCompleto = nombreCompleto;

  constructor() {
    this.load();
  }

  protected onFechaChange(value: string | null): void {
    this.selectedFecha.set(value);
    const rows = this.publicadores();
    const hasPrimero = !!value && rows.some((row) => row.fecha_primera_capacitacion === value);
    const hasSegundo = !!value && rows.some((row) => row.fecha_segunda_capacitacion === value);
    if (hasPrimero && !hasSegundo) {
      this.selectedTipo.set('Primer entrenamiento');
    } else if (hasSegundo && !hasPrimero) {
      this.selectedTipo.set('Segundo entrenamiento');
    } else {
      this.selectedTipo.set(null);
    }
    this.selectedCodigoPunto.set(null);
  }

  protected onTipoChange(value: string | null): void {
    this.selectedTipo.set(value as TipoEntrenamientoFiltro | null);
    this.selectedCodigoPunto.set(null);
  }

  protected onLugarChange(value: string | null): void {
    this.selectedCodigoPunto.set(value ? Number(value) : null);
  }

  protected isAsistio(row: Publicador): boolean {
    return this.selectedTipo() === 'Primer entrenamiento'
      ? row.asistio_primera_capacitacion === 'SI'
      : row.asistio_segunda_capacitacion === 'SI';
  }

  protected isConfirming(row: Publicador): boolean {
    return this.confirmingIds().has(row.id);
  }

  /** Solo quien confirmó la asistencia (usuario_modifica actual del registro) puede desmarcarla. */
  protected canRevertir(row: Publicador): boolean {
    const login = this.authService.currentSession()?.login;
    return !!login && row.usuario_modifica === login;
  }

  protected onToggleAsistencia(row: Publicador): void {
    const tipo = this.selectedTipo();
    if (!tipo || this.isConfirming(row)) {
      return;
    }
    if (this.isAsistio(row)) {
      if (!this.canRevertir(row)) {
        return;
      }
      this.revertirAsistencia(row, tipo);
    } else {
      this.confirmarAsistencia(row, tipo);
    }
  }

  private confirmarAsistencia(row: Publicador, tipo: TipoEntrenamientoFiltro): void {
    this.confirmingIds.update((ids) => new Set(ids).add(row.id));
    this.publicadoresService.confirmarAsistencia([row.id], tipo).subscribe({
      next: () => {
        this.stopConfirming(row.id);
        this.publicadores.update((rows) =>
          rows.map((r) => (r.id === row.id ? this.applyAsistencia(r, tipo) : r)),
        );
        this.snackbar.success(`Asistencia confirmada: ${nombreCompleto(row)}.`);
      },
      error: () => {
        this.stopConfirming(row.id);
        this.snackbar.error('No se pudo confirmar la asistencia. Intenta nuevamente.');
      },
    });
  }

  private revertirAsistencia(row: Publicador, tipo: TipoEntrenamientoFiltro): void {
    this.confirmingIds.update((ids) => new Set(ids).add(row.id));
    this.publicadoresService.revertirAsistencia([row.id], tipo).subscribe({
      next: ({ actualizados }) => {
        this.stopConfirming(row.id);
        if (actualizados === 0) {
          this.snackbar.error('Solo el usuario que confirmó la asistencia puede desmarcarla.');
          return;
        }
        this.publicadores.update((rows) =>
          rows.map((r) => (r.id === row.id ? this.applyRevertir(r, tipo) : r)),
        );
        this.snackbar.success(`Se desmarcó la asistencia de ${nombreCompleto(row)}.`);
      },
      error: () => {
        this.stopConfirming(row.id);
        this.snackbar.error('No se pudo desmarcar la asistencia. Intenta nuevamente.');
      },
    });
  }

  private stopConfirming(id: string): void {
    this.confirmingIds.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }

  private applyAsistencia(row: Publicador, tipo: TipoEntrenamientoFiltro): Publicador {
    const today = todayIsoDate();
    const login = this.authService.currentSession()?.login ?? null;
    const audit = { usuario_modifica: login, fecha_modificacion: today };
    if (tipo === 'Primer entrenamiento') {
      return {
        ...row,
        asistio_primera_capacitacion: 'SI',
        entrenamiento_requerido: 'Segundo entrenamiento',
        ...audit,
      };
    }
    return {
      ...row,
      asistio_segunda_capacitacion: 'SI',
      entrenamiento_requerido: 'Entrenamiento completado',
      estado: 'CUMPLE REQUISITOS',
      fecha_cumple_requisitos: row.fecha_cumple_requisitos ?? today,
      fecha_aprobacion: row.fecha_aprobacion ?? today,
      ...audit,
    };
  }

  private applyRevertir(row: Publicador, tipo: TipoEntrenamientoFiltro): Publicador {
    const login = this.authService.currentSession()?.login ?? null;
    const audit = { usuario_modifica: login, fecha_modificacion: todayIsoDate() };
    if (tipo === 'Primer entrenamiento') {
      return {
        ...row,
        asistio_primera_capacitacion: 'NO',
        entrenamiento_requerido: 'Primer entrenamiento',
        ...audit,
      };
    }
    return {
      ...row,
      asistio_segunda_capacitacion: 'NO',
      entrenamiento_requerido: 'Segundo entrenamiento',
      estado: 'NOTIFICADO SEGUNDO ENTRENAMIENTO',
      ...audit,
    };
  }

  private load(): void {
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
