import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { ChangePasswordDialog } from './components/change-password-dialog/change-password-dialog';

@Component({
  selector: 'app-header',
  imports: [Avatar, ChangePasswordDialog],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly pageTitle = input('');
  readonly sidebarExpanded = input(true);
  readonly userName = input('Usuario PPAM');
  readonly toggleSidebar = output<void>();
  readonly logout = output<void>();

  protected readonly menuOpen = signal(false);
  protected readonly changePasswordOpen = signal(false);

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
