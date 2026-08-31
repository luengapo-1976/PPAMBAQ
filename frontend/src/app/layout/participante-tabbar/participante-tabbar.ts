import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PARTICIPANTE_NAV_ITEMS } from '../participante-nav-items';

@Component({
  selector: 'app-participante-tabbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './participante-tabbar.html',
  styleUrl: './participante-tabbar.scss',
})
export class ParticipanteTabbar {
  private readonly authService = inject(AuthService);

  /** Mientras haya una actualización de datos obligatoria pendiente, el resto del
   * menú queda oculto: solo "Mis datos" sigue disponible hasta que se guarde ahí. */
  protected readonly items = computed(() =>
    this.authService.requiereActualizacionDatos()
      ? PARTICIPANTE_NAV_ITEMS.filter((item) => item.id === 'mis-datos')
      : PARTICIPANTE_NAV_ITEMS,
  );
}
