import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { RoleSwitch, RoleSwitchValue } from '../../shared/ui/role-switch/role-switch';
import { ChangePasswordDialog } from './components/change-password-dialog/change-password-dialog';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-header',
  imports: [Avatar, RoleSwitch, ChangePasswordDialog],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly pageTitle = input('');
  readonly sidebarExpanded = input(true);
  readonly userName = input('Usuario PPAM');
  readonly toggleSidebar = output<void>();
  readonly logout = output<void>();

  protected readonly menuOpen = signal(false);
  protected readonly changePasswordOpen = signal(false);

  protected readonly showRoleSwitch = this.authService.puedeAlternarVista;
  protected readonly vistaActiva = this.authService.vistaActiva;

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
    this.logout.emit();
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
