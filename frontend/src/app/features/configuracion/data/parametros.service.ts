import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';

export interface Parametro {
  id: string;
  clave: string;
  valor: string | null;
  activo: boolean;
  descripcion: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
}

export interface UpdateParametroPayload {
  valor: string | null;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ParametrosService {
  private readonly api = inject(ApiService);

  list(): Observable<Parametro[]> {
    return this.api.get<Parametro[]>('parametros');
  }

  update(clave: string, payload: UpdateParametroPayload): Observable<Parametro> {
    return this.api.put<Parametro>(`parametros/${clave}`, payload);
  }
}
