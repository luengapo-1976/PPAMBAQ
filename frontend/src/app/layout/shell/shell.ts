import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { SnackbarHost } from '../../shared/ui/snackbar/snackbar-host';
import { AuthService } from '../../core/auth.service';

const DESKTOP_BREAKPOINT = 1024;

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Header, SnackbarHost],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly userName = computed(() => this.authService.currentSession()?.login ?? 'Usuario PPAM');

  protected readonly isDesktopViewport = signal(this.isDesktop());
  protected readonly sidebarExpanded = signal(this.isDesktop());
  protected readonly mobileOpen = signal(false);

  protected readonly sidebarCollapsed = computed(
    () => this.isDesktopViewport() && !this.sidebarExpanded(),
  );

  protected readonly sidebarLayoutWidth = computed(() => {
    if (!this.isDesktopViewport()) {
      return '0px';
    }
    return this.sidebarCollapsed() ? 'var(--ppam-sidebar-width-collapsed)' : 'var(--ppam-sidebar-width-expanded)';
  });

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.resolveTitle()),
    ),
    { initialValue: '' },
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.mobileOpen.set(false));
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.isDesktopViewport.set(this.isDesktop());
  }

  protected onToggleSidebar(): void {
    if (this.isDesktopViewport()) {
      this.sidebarExpanded.update((value) => !value);
    } else {
      this.mobileOpen.update((value) => !value);
    }
  }

  protected closeMobileMenu(): void {
    this.mobileOpen.set(false);
  }

  protected onLogout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  private resolveTitle(): string {
    let route = this.activatedRoute.firstChild;
    while (route?.firstChild) {
      route = route.firstChild;
    }
    return (route?.snapshot?.data?.['title'] as string) ?? '';
  }

  private isDesktop(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT;
  }
}
