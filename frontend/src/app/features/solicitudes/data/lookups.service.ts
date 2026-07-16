import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { Congregacion, Departamento, Municipio } from './models';
import { Circuito, Punto } from '../../configuracion/data/models';

@Injectable({ providedIn: 'root' })
export class LookupsService {
  private readonly api = inject(ApiService);

  private readonly departamentos$ = this.api
    .get<Departamento[]>('departamentos')
    .pipe(shareReplay(1));

  private readonly municipios$ = this.api.get<Municipio[]>('municipios').pipe(shareReplay(1));

  private readonly congregaciones$ = this.api
    .get<Congregacion[]>('congregaciones')
    .pipe(shareReplay(1));

  private readonly circuitos$ = this.api.get<Circuito[]>('circuitos').pipe(shareReplay(1));

  private readonly puntos$ = this.api.get<Punto[]>('puntos').pipe(shareReplay(1));

  getDepartamentos(): Observable<Departamento[]> {
    return this.departamentos$;
  }

  getMunicipios(): Observable<Municipio[]> {
    return this.municipios$;
  }

  getCongregaciones(): Observable<Congregacion[]> {
    return this.congregaciones$;
  }

  getCircuitos(): Observable<Circuito[]> {
    return this.circuitos$;
  }

  getPuntos(): Observable<Punto[]> {
    return this.puntos$;
  }
}
