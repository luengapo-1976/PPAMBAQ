import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { RoleSwitch, RoleSwitchValue } from '../../shared/ui/role-switch/role-switch';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { PARTICIPANTE_MENU_ITEMS } from './data/menu-items';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, RoleSwitch, Avatar],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly nombre = computed(
    () => this.authService.currentSession()?.publicador?.nombre_completo || this.authService.currentSession()?.login || 'Publicador',
  );
  protected readonly mainItems = PARTICIPANTE_MENU_ITEMS.filter((item) => !item.sensitive);
  protected readonly bajaItem = PARTICIPANTE_MENU_ITEMS.find((item) => item.sensitive)!;

  protected readonly showRoleSwitch = this.authService.puedeAlternarVista;
  protected readonly vistaActiva = this.authService.vistaActiva;

  protected onSwitchVista(vista: RoleSwitchValue): void {
    this.authService.setVista(vista);
    this.router.navigateByUrl(vista === 'usuario' ? '/dashboard' : '/inicio');
  }

  protected onLogout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
