import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { Congregacion, Departamento, Municipio, Publicador } from '../../solicitudes/data/models';
import { Circuito } from '../../configuracion/data/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  listPublicadores(): Observable<Publicador[]> {
    return this.api.get<Publicador[]>('publicadores');
  }

  listDepartamentos(): Observable<Departamento[]> {
    return this.api.get<Departamento[]>('departamentos');
  }

  listMunicipios(): Observable<Municipio[]> {
    return this.api.get<Municipio[]>('municipios');
  }

  listCongregaciones(): Observable<Congregacion[]> {
    return this.api.get<Congregacion[]>('congregaciones');
  }

  listCircuitos(): Observable<Circuito[]> {
    return this.api.get<Circuito[]>('circuitos');
  }
}
