import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchSelect, SearchSelectOption } from '../../../../shared/ui/search-select/search-select';
import { Button } from '../../../../shared/ui/button/button';
import { Departamento, Municipio } from '../../../solicitudes/data/models';
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

  protected readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(
      f.codigoDepartamento ||
      f.codigoMunicipio ||
      f.codigoCircuito ||
      f.fechaSolicitudDesde ||
      f.fechaSolicitudHasta
    );
  });

  protected onDepartamentoChange(value: string | null): void {
    const current = this.filters();
    const stillValid = value
      ? this.municipios().some((m) => m.codigo_municipio === current.codigoMunicipio && m.codigo_departamento === value)
      : true;
    this.filtersChange.emit({
      ...current,
      codigoDepartamento: value,
      codigoMunicipio: stillValid ? current.codigoMunicipio : null,
    });
  }

  protected onMunicipioChange(value: string | null): void {
    this.filtersChange.emit({ ...this.filters(), codigoMunicipio: value });
  }

  protected onCircuitoChange(value: string | null): void {
    this.filtersChange.emit({ ...this.filters(), codigoCircuito: value });
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
}
