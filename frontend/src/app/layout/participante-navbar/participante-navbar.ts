import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { RoleSwitch, RoleSwitchValue } from '../../shared/ui/role-switch/role-switch';
import { Avatar } from '../../shared/ui/avatar/avatar';

/** Barra superior estilo iOS de dos filas (solo visible en móvil vía CSS):
 * identidad (logo, cambio de vista, avatar, salir) y, debajo, el título de la
 * pantalla activa con el botón de pantalla completa. Vive en el shell porque debe
 * verse igual en todas las pantallas de participante, no solo en Inicio. */
@Component({
  selector: 'app-participante-navbar',
  imports: [RouterLink, RoleSwitch, Avatar],
  templateUrl: './participante-navbar.html',
  styleUrl: './participante-navbar.scss',
})
export class ParticipanteNavbar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly title = input.required<string>();

  protected readonly nombre = computed(
    () =>
      this.authService.currentSession()?.publicador?.nombre_completo ||
      this.authService.currentSession()?.login ||
      'Publicador',
  );
  protected readonly showRoleSwitch = this.authService.puedeAlternarVista;
  protected readonly vistaActiva = this.authService.vistaActiva;

  protected readonly isFullscreen = signal(this.checkFullscreen());
  protected readonly fullscreenSupported = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;

  protected onSwitchVista(vista: RoleSwitchValue): void {
    this.authService.setVista(vista);
    this.router.navigateByUrl(vista === 'usuario' ? '/dashboard' : '/inicio');
  }

  protected onLogout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected async onToggleFullscreen(): Promise<void> {
    try {
      if (this.checkFullscreen()) {
        await document.exitFullscreen?.();
      } else {
        await document.documentElement.requestFullscreen?.();
      }
    } catch {
      // La API de pantalla completa puede no estar disponible (ej. iOS Safari); se ignora
      // en silencio, el botón simplemente no tendrá efecto visible en esos navegadores.
    }
    this.isFullscreen.set(this.checkFullscreen());
  }

  private checkFullscreen(): boolean {
    return typeof document !== 'undefined' && !!document.fullscreenElement;
  }
}
