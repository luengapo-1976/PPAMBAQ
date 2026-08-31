import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { ReferenceDataService } from '../../features/configuracion/data/reference-data.service';
import { LookupsService } from '../../features/solicitudes/data/lookups.service';
import { Departamento, Municipio, Punto } from '../../features/configuracion/data/models';

/** Estado compartido del calendario "mi punto": lo consultan el navbar móvil y el
 * topbar de escritorio de Inicio (ambos pueden abrir el mismo diálogo, montado una
 * sola vez en el ParticipanteShell) para que un publicador encargado de uno o más
 * puntos pueda ver su propio calendario sin pasar por Datos maestros. */
@Injectable({ providedIn: 'root' })
export class EncargadoPuntoService {
  private readonly authService = inject(AuthService);
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly lookupsService = inject(LookupsService);

  private readonly misPuntos = signal<Punto[]>([]);
  private readonly departamentos = signal<Departamento[]>([]);
  private readonly municipios = signal<Municipio[]>([]);
  private readonly dialogOpen = signal(false);

  readonly puntos = this.misPuntos.asReadonly();
  readonly departamentosCatalogo = this.departamentos.asReadonly();
  readonly municipiosCatalogo = this.municipios.asReadonly();
  readonly open = this.dialogOpen.asReadonly();

  readonly esEncargado = computed(() => this.misPuntos().length > 0);

  constructor() {
    this.lookupsService.getDepartamentos().subscribe((data) => this.departamentos.set(data));
    this.lookupsService.getMunicipios().subscribe((data) => this.municipios.set(data));

    effect(() => {
      if (!this.authService.tienePublicador()) {
        this.misPuntos.set([]);
        return;
      }
      this.referenceDataService.misPuntos().subscribe({
        next: (data) => this.misPuntos.set(data.filter((p) => p.estado === 'Activo')),
        error: () => this.misPuntos.set([]),
      });
    });
  }

  abrir(): void {
    this.dialogOpen.set(true);
  }

  cerrar(): void {
    this.dialogOpen.set(false);
  }
}
