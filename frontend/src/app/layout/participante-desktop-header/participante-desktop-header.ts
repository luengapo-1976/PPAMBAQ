import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { RoleSwitch, RoleSwitchValue } from '../../shared/ui/role-switch/role-switch';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { ChangePasswordDialog } from '../header/components/change-password-dialog/change-password-dialog';
import { PARTICIPANTE_NAV_ITEMS } from '../participante-nav-items';

/** Cabecera compartida de las pantallas de participante en tablet/desktop (móvil
 * sigue usando exclusivamente ParticipanteNavbar, sin cambios): mismo logo +
 * "PPAM BAQ" e ícono de cuenta que ya tiene Inicio, más el título de la página
 * actual centrado en la barra. Cada página solo necesita incluir
 * `<app-participante-desktop-header />`; el título se resuelve solo desde los
 * datos de su propia ruta (`data.title`), sin necesidad de pasarlo por input. */
@Component({
  selector: 'app-participante-desktop-header',
  imports: [RouterLink, RouterLinkActive, RoleSwitch, Avatar, ChangePasswordDialog],
  templateUrl: './participante-desktop-header.html',
  styleUrl: './participante-desktop-header.scss',
})
export class ParticipanteDesktopHeader {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly title = (this.route.snapshot.data['title'] as string) ?? '';
  protected readonly navItems = PARTICIPANTE_NAV_ITEMS;

  protected readonly nombre = computed(
    () =>
      this.authService.currentSession()?.publicador?.nombre_completo ||
      this.authService.currentSession()?.login ||
      'Publicador',
  );
  protected readonly showRoleSwitch = this.authService.puedeAlternarVista;
  protected readonly vistaActiva = this.authService.vistaActiva;

  protected readonly menuOpen = signal(false);
  protected readonly changePasswordOpen = signal(false);

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
}
