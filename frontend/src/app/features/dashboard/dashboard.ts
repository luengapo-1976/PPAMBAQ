import { Component, computed, inject, signal } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { catchError, of } from 'rxjs';
import { StatCard } from '../../shared/ui/stat-card/stat-card';
import { ChartCanvas } from '../../shared/ui/chart-canvas/chart-canvas';
import { DashboardFiltersComponent } from './components/dashboard-filters/dashboard-filters';
import { RecentActivity } from './components/recent-activity/recent-activity';
import { CircuitoSummaryTable } from './components/circuito-summary-table/circuito-summary-table';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { PublicadoresService } from '../solicitudes/data/publicadores.service';
import { LookupsService } from '../solicitudes/data/lookups.service';
import { cssVar } from '../../shared/utils/theme-colors.util';
import { Congregacion, Departamento, Municipio, Publicador } from '../solicitudes/data/models';
import { Circuito } from '../configuracion/data/models';
import {
  DashboardFilters,
  EMPTY_DASHBOARD_FILTERS,
  applyDashboardFilters,
  computeKpis,
  distributionByEstado,
  distributionByEstadoCivil,
  distributionBySexo,
  monthlyTrend,
  recentActivity,
  topCongregaciones,
} from './data/dashboard-metrics.util';
import { buildCircuitoSummary } from './data/circuito-summary.util';

const EXTRA_WARNING = '#c77f1f';

@Component({
  selector: 'app-dashboard',
  imports: [StatCard, ChartCanvas, DashboardFiltersComponent, RecentActivity, CircuitoSummaryTable],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly publicadoresService = inject(PublicadoresService);
  private readonly lookupsService = inject(LookupsService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly loading = signal(true);
  protected readonly skeletonKpis = [1, 2, 3, 4, 5, 6];
  protected readonly skeletonCharts = [1, 2, 3, 4, 5];
  protected readonly publicadores = signal<Publicador[]>([]);
  protected readonly departamentos = signal<Departamento[]>([]);
  protected readonly municipios = signal<Municipio[]>([]);
  protected readonly circuitos = signal<Circuito[]>([]);
  protected readonly congregaciones = signal<Congregacion[]>([]);

  protected readonly filters = signal<DashboardFilters>(EMPTY_DASHBOARD_FILTERS);

  protected readonly filteredPublicadores = computed(() =>
    applyDashboardFilters(this.publicadores(), this.filters()),
  );

  protected readonly kpis = computed(() => computeKpis(this.filteredPublicadores()));

  protected readonly recentActivityItems = computed(() => recentActivity(this.filteredPublicadores(), 8));

  protected readonly circuitoSummaryRows = computed(() =>
    buildCircuitoSummary(this.filteredPublicadores(), this.circuitos(), this.congregaciones()),
  );

  protected readonly estadoChartData = computed<ChartData<'doughnut'>>(() => {
    const slices = distributionByEstado(this.filteredPublicadores());
    return {
      labels: slices.map((s) => s.label),
      datasets: [
        {
          data: slices.map((s) => s.value),
          backgroundColor: [
            cssVar('--ppam-semantic-info'),
            cssVar('--ppam-semantic-warning'),
            EXTRA_WARNING,
            cssVar('--ppam-semantic-success'),
          ],
          borderWidth: 0,
        },
      ],
    };
  });

  protected readonly sexoChartData = computed<ChartData<'doughnut'>>(() => {
    const slices = distributionBySexo(this.filteredPublicadores());
    return {
      labels: slices.map((s) => s.label),
      datasets: [
        {
          data: slices.map((s) => s.value),
          backgroundColor: [cssVar('--ppam-primary-container'), EXTRA_WARNING],
          borderWidth: 0,
        },
      ],
    };
  });

  protected readonly estadoCivilChartData = computed<ChartData<'bar'>>(() => {
    const slices = distributionByEstadoCivil(this.filteredPublicadores());
    return {
      labels: slices.map((s) => s.label),
      datasets: [
        {
          label: 'Solicitudes',
          data: slices.map((s) => s.value),
          backgroundColor: cssVar('--ppam-primary-container'),
          borderRadius: 6,
        },
      ],
    };
  });

  protected readonly topCongregacionesChartData = computed<ChartData<'bar'>>(() => {
    const slices = topCongregaciones(this.filteredPublicadores(), 8);
    return {
      labels: slices.map((s) => s.label),
      datasets: [
        {
          label: 'Solicitudes',
          data: slices.map((s) => s.value),
          backgroundColor: cssVar('--ppam-semantic-info'),
          borderRadius: 6,
        },
      ],
    };
  });

  protected readonly trendChartData = computed<ChartData<'line'>>(() => {
    const points = monthlyTrend(this.filteredPublicadores(), 12);
    return {
      labels: points.map((p) => p.monthLabel),
      datasets: [
        {
          label: 'Nuevas solicitudes',
          data: points.map((p) => p.solicitudes),
          borderColor: cssVar('--ppam-primary-container'),
          backgroundColor: `color-mix(in srgb, ${cssVar('--ppam-primary-container')} 18%, transparent)`,
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Aprobaciones',
          data: points.map((p) => p.aprobaciones),
          borderColor: cssVar('--ppam-semantic-success'),
          backgroundColor: 'transparent',
          tension: 0.3,
          fill: false,
        },
      ],
    };
  });

  protected readonly horizontalBarOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  protected readonly barOptions: ChartOptions<'bar'> = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  protected readonly donutOptions: ChartOptions<'doughnut'> = {
    plugins: { legend: { position: 'bottom' } },
  };

  protected readonly lineOptions: ChartOptions<'line'> = {
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  constructor() {
    this.loadData();
  }

  protected onFiltersChange(filters: DashboardFilters): void {
    this.filters.set(filters);
  }

  private loadData(): void {
    this.loading.set(true);
    this.publicadoresService
      .list()
      .pipe(
        catchError(() => {
          this.snackbar.error('No se pudo cargar el listado de solicitudes.');
          return of<Publicador[]>([]);
        }),
      )
      .subscribe((data) => {
        this.publicadores.set(data);
        this.loading.set(false);
      });

    this.lookupsService.getDepartamentos().subscribe({
      next: (data) => this.departamentos.set(data),
      error: () => this.snackbar.error('No se pudo cargar el catálogo de departamentos.'),
    });
    this.lookupsService.getMunicipios().subscribe({
      next: (data) => this.municipios.set(data),
      error: () => this.snackbar.error('No se pudo cargar el catálogo de municipios.'),
    });
    this.lookupsService.getCircuitos().subscribe({
      next: (data) => this.circuitos.set(data),
      error: () => this.snackbar.error('No se pudo cargar el catálogo de circuitos.'),
    });
    this.lookupsService.getCongregaciones().subscribe({
      next: (data) => this.congregaciones.set(data),
      error: () => this.snackbar.error('No se pudo cargar el catálogo de congregaciones.'),
    });
  }
}
