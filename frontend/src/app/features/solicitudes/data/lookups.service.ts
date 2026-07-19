import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay, switchMap } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { Congregacion, Departamento, Municipio } from './models';
import { Circuito, Punto } from '../../configuracion/data/models';

interface Catalog<T> {
  data$: Observable<T[]>;
  refresh: () => void;
}

@Injectable({ providedIn: 'root' })
export class LookupsService {
  private readonly api = inject(ApiService);

  private readonly departamentos = this.makeCatalog<Departamento>('departamentos');
  private readonly municipios = this.makeCatalog<Municipio>('municipios');
  private readonly congregaciones = this.makeCatalog<Congregacion>('congregaciones');
  private readonly circuitos = this.makeCatalog<Circuito>('circuitos');
  private readonly puntos = this.makeCatalog<Punto>('puntos');

  getDepartamentos(): Observable<Departamento[]> {
    return this.departamentos.data$;
  }

  getMunicipios(): Observable<Municipio[]> {
    return this.municipios.data$;
  }

  getCongregaciones(): Observable<Congregacion[]> {
    return this.congregaciones.data$;
  }

  getCircuitos(): Observable<Circuito[]> {
    return this.circuitos.data$;
  }

  getPuntos(): Observable<Punto[]> {
    return this.puntos.data$;
  }

  /** Fuerza a que la próxima suscripción (y las ya activas) reciban datos frescos del backend. */
  refreshDepartamentos(): void {
    this.departamentos.refresh();
  }

  refreshMunicipios(): void {
    this.municipios.refresh();
  }

  refreshCongregaciones(): void {
    this.congregaciones.refresh();
  }

  refreshCircuitos(): void {
    this.circuitos.refresh();
  }

  refreshPuntos(): void {
    this.puntos.refresh();
  }

  private makeCatalog<T>(endpoint: string): Catalog<T> {
    const refresh$ = new BehaviorSubject<void>(undefined);
    const data$ = refresh$.pipe(
      switchMap(() => this.api.get<T[]>(endpoint)),
      shareReplay(1),
    );
    return { data$, refresh: () => refresh$.next() };
  }
}
