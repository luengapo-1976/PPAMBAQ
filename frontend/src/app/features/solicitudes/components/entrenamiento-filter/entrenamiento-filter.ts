import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select, SelectOption } from '../../../../shared/ui/select/select';
import { Button } from '../../../../shared/ui/button/button';
import { Publicador } from '../../data/models';
import { Punto } from '../../../configuracion/data/models';
import {
  EMPTY_ENTRENAMIENTO_FILTRO,
  EntrenamientoFiltro,
  TipoEntrenamientoFiltro,
  fechasDisponibles,
  lugaresDisponibles,
} from '../../data/entrenamiento-filter.util';
import { exportEntrenamientoChecklistToPdf } from '../../data/entrenamiento-checklist-pdf.util';
import { formatDateShort } from '../../data/publicador.utils';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';

const TODAS_LAS_FECHAS = '__TODAS__';
const TODOS_LOS_LUGARES = '__TODOS__';

const TIPO_OPTIONS: SelectOption[] = [
  { value: 'Primer entrenamiento', label: 'Primer entrenamiento' },
  { value: 'Segundo entrenamiento', label: 'Segundo entrenamiento' },
];

@Component({
  selector: 'app-entrenamiento-filter',
  imports: [FormsModule, Select, Button],
  templateUrl: './entrenamiento-filter.html',
  styleUrl: './entrenamiento-filter.scss',
})
export class EntrenamientoFilter {
  private readonly snackbar = inject(SnackbarService);

  /** Universo completo (sin filtrar), usado para calcular las opciones de fecha y lugar disponibles. */
  readonly allPublicadores = input.required<Publicador[]>();
  /** Resultado ya filtrado (tipo + fecha + lugar) que se muestra en la grilla y se exporta a PDF. */
  readonly filteredRows = input.required<Publicador[]>();
  readonly puntos = input.required<Punto[]>();
  readonly filtro = input.required<EntrenamientoFiltro>();

  readonly filtroChange = output<EntrenamientoFiltro>();
  readonly closed = output<void>();

  protected readonly exportingPdf = signal(false);
  protected readonly tipoOptions = TIPO_OPTIONS;

  protected readonly isActive = computed(() => this.filtro().tipo != null);

  protected readonly fechaOptions = computed<SelectOption[]>(() => {
    const fechas = fechasDisponibles(this.allPublicadores(), this.filtro().tipo);
    return [
      { value: TODAS_LAS_FECHAS, label: 'Todas las fechas' },
      ...fechas.map((fecha) => ({ value: fecha, label: formatDateShort(fecha) })),
    ];
  });

  protected readonly lugarOptions = computed<SelectOption[]>(() => {
    const { tipo, fecha } = this.filtro();
    const codigos = lugaresDisponibles(this.allPublicadores(), tipo, fecha);
    const puntosPorCodigo = new Map(this.puntos().map((p) => [p.codigo_punto, p]));
    const opciones = codigos
      .map((codigo) => ({ codigo, nombre: puntosPorCodigo.get(codigo)?.nombre_punto ?? `Punto ${codigo}` }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map(({ codigo, nombre }) => ({ value: String(codigo), label: nombre }));
    return [{ value: TODOS_LOS_LUGARES, label: 'Todos los lugares' }, ...opciones];
  });

  protected readonly selectedTipoValue = computed(() => this.filtro().tipo);
  protected readonly selectedFechaValue = computed(() => this.filtro().fecha ?? TODAS_LAS_FECHAS);
  protected readonly selectedLugarValue = computed(() => {
    const codigo = this.filtro().codigoPunto;
    return codigo == null ? TODOS_LOS_LUGARES : String(codigo);
  });

  protected onTipoChange(value: string | null): void {
    this.filtroChange.emit({ tipo: (value as TipoEntrenamientoFiltro) ?? null, fecha: null, codigoPunto: null });
  }

  protected onFechaChange(value: string | null): void {
    const fecha = !value || value === TODAS_LAS_FECHAS ? null : value;
    this.filtroChange.emit({ ...this.filtro(), fecha, codigoPunto: null });
  }

  protected onLugarChange(value: string | null): void {
    const codigoPunto = !value || value === TODOS_LOS_LUGARES ? null : Number(value);
    this.filtroChange.emit({ ...this.filtro(), codigoPunto });
  }

  protected onLimpiar(): void {
    this.filtroChange.emit(EMPTY_ENTRENAMIENTO_FILTRO);
  }

  protected async onExportPdf(): Promise<void> {
    const tipo = this.filtro().tipo;
    if (!tipo) {
      return;
    }
    const rows = this.filteredRows();
    if (rows.length === 0) {
      this.snackbar.show('No hay publicadores asignados para el filtro actual.', 'info');
      return;
    }
    this.exportingPdf.set(true);
    try {
      await exportEntrenamientoChecklistToPdf(rows, tipo, this.puntos());
    } catch {
      this.snackbar.error('No se pudo generar el PDF de la lista de chequeo.');
    } finally {
      this.exportingPdf.set(false);
    }
  }
}
