import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { RoleSwitch, RoleSwitchValue } from '../../shared/ui/role-switch/role-switch';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { EncargadoPuntoService } from '../data/encargado-punto.service';
import { ChangePasswordDialog } from '../header/components/change-password-dialog/change-password-dialog';

/** Barra superior estilo iOS de dos filas (solo visible en móvil vía CSS):
 * identidad (logo, cambio de vista, avatar, salir) y, debajo, el título de la
 * pantalla activa con el botón de pantalla completa. Vive en el shell porque debe
 * verse igual en todas las pantallas de participante, no solo en Inicio. */
@Component({
  selector: 'app-participante-navbar',
  imports: [RouterLink, RoleSwitch, Avatar, ChangePasswordDialog],
  templateUrl: './participante-navbar.html',
  styleUrl: './participante-navbar.scss',
})
export class ParticipanteNavbar {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly encargadoPunto = inject(EncargadoPuntoService);

  readonly title = input.required<string>();

  protected readonly menuOpen = signal(false);
  protected readonly changePasswordOpen = signal(false);

  protected readonly nombre = computed(
    () =>
      this.authService.currentSession()?.publicador?.nombre_completo ||
      this.authService.currentSession()?.login ||
      'Publicador',
  );
  protected readonly showRoleSwitch = this.authService.puedeAlternarVista;
  protected readonly vistaActiva = this.authService.vistaActiva;

  protected readonly isFullscreen = signal(this.checkFullscreen());
  protected readonly fullscreenSupported =
    typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;

  protected onAbrirCalendarioEncargado(): void {
    this.encargadoPunto.abrir();
  }

  protected onSwitchVista(vista: RoleSwitchValue): void {
    this.authService.setVista(vista);
    this.router.navigateByUrl(vista === 'usuario' ? '/dashboard' : '/inicio');
  }

  protected toggleMenu(): void {
    this.menuOpen.update((value) => !value);
  }

  protected onChangePassword(): void {
    this.menuOpen.set(false);
    this.changePasswordOpen.set(true);
  }

  protected onLogout(): void {
    this.menuOpen.set(false);
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.menuOpen.set(false);
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
