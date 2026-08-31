import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../shared/models/nav-item.model';
import { NAV_ITEMS } from '../nav-items';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly authService = inject(AuthService);

  readonly collapsed = input(false);
  readonly logout = output<void>();

  protected readonly mainItems = computed(() => {
    const isAdmin = this.authService.isAdmin();
    return NAV_ITEMS.filter((item) => !item.action && (!item.adminOnly || isAdmin));
  });
  protected readonly actionItems = NAV_ITEMS.filter((item) => item.action);

  /** Etiquetas de los grupos actualmente colapsados. Cada grupo se colapsa de forma
   * independiente (no es un acordeón): puede haber varios abiertos o cerrados a la vez. */
  private readonly collapsedGroups = signal<Set<string>>(new Set());

  protected onItemClick(item: NavItem): void {
    if (item.action === 'logout') {
      this.logout.emit();
    }
  }

  protected isGroupExpanded(label: string): boolean {
    return !this.collapsedGroups().has(label);
  }

  protected toggleGroup(label: string): void {
    this.collapsedGroups.update((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }
}
