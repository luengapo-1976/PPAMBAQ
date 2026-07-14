import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import {
  Circuito,
  CircuitoCreatePayload,
  CircuitoUpdatePayload,
  Congregacion,
  CongregacionCreatePayload,
  CongregacionUpdatePayload,
  Departamento,
  DepartamentoCreatePayload,
  DepartamentoUpdatePayload,
  Municipio,
  MunicipioCreatePayload,
  MunicipioUpdatePayload,
  Usuario,
  UsuarioCreatePayload,
  UsuarioUpdatePayload,
} from './models';

@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private readonly api = inject(ApiService);

  listDepartamentos(): Observable<Departamento[]> {
    return this.api.get<Departamento[]>('departamentos');
  }

  createDepartamento(payload: DepartamentoCreatePayload): Observable<Departamento> {
    return this.api.post<Departamento>('departamentos', payload);
  }

  updateDepartamento(codigo: string, payload: DepartamentoUpdatePayload): Observable<Departamento> {
    return this.api.patch<Departamento>(`departamentos/${codigo}`, payload);
  }

  listMunicipios(): Observable<Municipio[]> {
    return this.api.get<Municipio[]>('municipios');
  }

  createMunicipio(payload: MunicipioCreatePayload): Observable<Municipio> {
    return this.api.post<Municipio>('municipios', payload);
  }

  updateMunicipio(codigo: string, payload: MunicipioUpdatePayload): Observable<Municipio> {
    return this.api.patch<Municipio>(`municipios/${codigo}`, payload);
  }

  listCircuitos(): Observable<Circuito[]> {
    return this.api.get<Circuito[]>('circuitos');
  }

  createCircuito(payload: CircuitoCreatePayload): Observable<Circuito> {
    return this.api.post<Circuito>('circuitos', payload);
  }

  updateCircuito(codigo: string, payload: CircuitoUpdatePayload): Observable<Circuito> {
    return this.api.patch<Circuito>(`circuitos/${codigo}`, payload);
  }

  listCongregaciones(): Observable<Congregacion[]> {
    return this.api.get<Congregacion[]>('congregaciones');
  }

  createCongregacion(payload: CongregacionCreatePayload): Observable<Congregacion> {
    return this.api.post<Congregacion>('congregaciones', payload);
  }

  updateCongregacion(codigo: number, payload: CongregacionUpdatePayload): Observable<Congregacion> {
    return this.api.patch<Congregacion>(`congregaciones/${codigo}`, payload);
  }

  listUsuarios(): Observable<Usuario[]> {
    return this.api.get<Usuario[]>('usuarios');
  }

  createUsuario(payload: UsuarioCreatePayload): Observable<Usuario> {
    return this.api.post<Usuario>('usuarios', payload);
  }

  updateUsuario(login: string, payload: UsuarioUpdatePayload): Observable<Usuario> {
    return this.api.patch<Usuario>(`usuarios/${login}`, payload);
  }
}
