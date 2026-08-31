import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/** Único tipo de texto legal que existe por ahora; ver el mismo símbolo en el backend
 * (aceptaciones-legales.service.ts) para agregar más a futuro sin cambios de esquema. */
export const TIPO_TRATAMIENTO_DATOS = 'TRATAMIENTO_DATOS_PERSONALES';

@Injectable({ providedIn: 'root' })
export class AceptacionesLegalesService {
  private readonly api = inject(ApiService);

  aceptar(tipo: string): Observable<{ mensaje: string }> {
    return this.api.post<{ mensaje: string }>(`aceptaciones-legales/${tipo}`, {});
  }
}
