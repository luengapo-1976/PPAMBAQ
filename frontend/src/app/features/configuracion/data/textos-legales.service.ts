import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api.service';

export interface TextoLegal {
  id: string;
  tipo: string;
  version: string;
  contenido: string;
  activo: boolean;
  usuario_registra: string | null;
  fecha_registro: string | null;
}

@Injectable({ providedIn: 'root' })
export class TextosLegalesService {
  private readonly api = inject(ApiService);

  listar(tipo: string): Observable<TextoLegal[]> {
    return this.api.get<TextoLegal[]>(`textos-legales/${tipo}`);
  }

  obtenerActivo(tipo: string): Observable<TextoLegal | null> {
    return this.api.get<TextoLegal | null>(`textos-legales/${tipo}/activo`);
  }

  crearVersion(tipo: string, contenido: string, activo: boolean): Observable<TextoLegal> {
    return this.api.post<TextoLegal>(`textos-legales/${tipo}`, { contenido, activo });
  }

  /** Publica o despublica una versión ya guardada, sin crear una versión nueva. */
  actualizarEstado(id: string, activo: boolean): Observable<TextoLegal> {
    return this.api.patch<TextoLegal>(`textos-legales/${id}/estado`, { activo });
  }
}
