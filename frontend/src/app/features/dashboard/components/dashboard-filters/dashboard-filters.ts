import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchSelect, SearchSelectOption } from '../../../../shared/ui/search-select/search-select';
import { Button } from '../../../../shared/ui/button/button';
import { Congregacion, Departamento, Municipio } from '../../../solicitudes/data/models';
import { Circuito } from '../../../configuracion/data/models';
import { DashboardFilters, EMPTY_DASHBOARD_FILTERS } from '../../data/dashboard-metrics.util';

@Component({
  selector: 'app-dashboard-filters',
  imports: [FormsModule, SearchSelect, Button],
  templateUrl: './dashboard-filters.html',
  styleUrl: './dashboard-filters.scss',
})
export class DashboardFiltersComponent {
  readonly departamentos = input.required<Departamento[]>();
  readonly municipios = input.required<Municipio[]>();
  readonly circuitos = input.required<Circuito[]>();
  readonly congregaciones = input.required<Congregacion[]>();
  readonly filters = input.required<DashboardFilters>();

  readonly filtersChange = output<DashboardFilters>();

  protected readonly departamentoOptions = computed<SearchSelectOption[]>(() =>
    this.departamentos().map((d) => ({
      value: d.codigo_departamento,
      label: `${d.codigo_departamento} - ${d.nombre_departamento}`,
    })),
  );

  protected readonly municipioOptions = computed<SearchSelectOption[]>(() => {
    const depto = this.filters().codigoDepartamento;
    return this.municipios()
      .filter((m) => !depto || m.codigo_departamento === depto)
      .map((m) => ({ value: m.codigo_municipio, label: `${m.codigo_municipio} - ${m.nombre_municipio}` }));
  });

  protected readonly circuitoOptions = computed<SearchSelectOption[]>(() =>
    this.circuitos().map((c) => ({
      value: c.codigo_circuito,
      label: c.nombre_viajante ? `${c.codigo_circuito} - ${c.nombre_viajante}` : c.codigo_circuito,
    })),
  );

  /** La congregación se acota por todos los demás filtros ya seleccionados
   * (departamento, municipio, circuito), ya que las tres son propiedades
   * independientes de cada congregación en el esquema. */
  protected readonly congregacionOptions = computed<SearchSelectOption[]>(() => {
    const f = this.filters();
    return this.congregaciones()
      .filter((c) => !f.codigoDepartamento || c.codigo_departamento === f.codigoDepartamento)
      .filter((c) => !f.codigoMunicipio || c.codigo_municipio === f.codigoMunicipio)
      .filter((c) => !f.codigoCircuito || c.codigo_circuito === f.codigoCircuito)
      .map((c) => ({
        value: String(c.codigo_congregacion),
        label: `${c.codigo_congregacion} - ${c.nombre_congregacion}`,
      }));
  });

  /** SearchSelect trabaja con valores string; el filtro guarda el código de
   * congregación como number, así que se expone ya convertido para el template. */
  protected readonly selectedCongregacionValue = computed(() => {
    const codigo = this.filters().codigoCongregacion;
    return codigo == null ? null : String(codigo);
  });

  protected readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(
      f.codigoDepartamento ||
      f.codigoMunicipio ||
      f.codigoCircuito ||
      f.codigoCongregacion != null ||
      f.fechaSolicitudDesde ||
      f.fechaSolicitudHasta
    );
  });

  protected onDepartamentoChange(value: string | null): void {
    const current = this.filters();
    const municipioStillValid = value
      ? this.municipios().some((m) => m.codigo_municipio === current.codigoMunicipio && m.codigo_departamento === value)
      : true;
    const nextMunicipio = municipioStillValid ? current.codigoMunicipio : null;
    this.filtersChange.emit({
      ...current,
      codigoDepartamento: value,
      codigoMunicipio: nextMunicipio,
      codigoCongregacion: this.congregacionStillValid(current.codigoCongregacion, {
        codigoDepartamento: value,
        codigoMunicipio: nextMunicipio,
      })
        ? current.codigoCongregacion
        : null,
    });
  }

  protected onMunicipioChange(value: string | null): void {
    const current = this.filters();
    this.filtersChange.emit({
      ...current,
      codigoMunicipio: value,
      codigoCongregacion: this.congregacionStillValid(current.codigoCongregacion, { codigoMunicipio: value })
        ? current.codigoCongregacion
        : null,
    });
  }

  protected onCircuitoChange(value: string | null): void {
    const current = this.filters();
    this.filtersChange.emit({
      ...current,
      codigoCircuito: value,
      codigoCongregacion: this.congregacionStillValid(current.codigoCongregacion, { codigoCircuito: value })
        ? current.codigoCongregacion
        : null,
    });
  }

  protected onCongregacionChange(value: string | null): void {
    this.filtersChange.emit({ ...this.filters(), codigoCongregacion: value ? Number(value) : null });
  }

  protected onFechaDesdeChange(value: string): void {
    this.filtersChange.emit({ ...this.filters(), fechaSolicitudDesde: value || null });
  }

  protected onFechaHastaChange(value: string): void {
    this.filtersChange.emit({ ...this.filters(), fechaSolicitudHasta: value || null });
  }

  protected onClear(): void {
    this.filtersChange.emit(EMPTY_DASHBOARD_FILTERS);
  }

  private congregacionStillValid(
    codigoCongregacion: number | null,
    overrides: Partial<Pick<DashboardFilters, 'codigoDepartamento' | 'codigoMunicipio' | 'codigoCircuito'>>,
  ): boolean {
    if (codigoCongregacion == null) {
      return true;
    }
    const congregacion = this.congregaciones().find((c) => c.codigo_congregacion === codigoCongregacion);
    if (!congregacion) {
      return false;
    }
    const f = { ...this.filters(), ...overrides };
    return (
      (!f.codigoDepartamento || congregacion.codigo_departamento === f.codigoDepartamento) &&
      (!f.codigoMunicipio || congregacion.codigo_municipio === f.codigoMunicipio) &&
      (!f.codigoCircuito || congregacion.codigo_circuito === f.codigoCircuito)
    );
  }
}
