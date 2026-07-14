import { Component, input, output } from '@angular/core';
import { Avatar } from '../../shared/ui/avatar/avatar';

@Component({
  selector: 'app-header',
  imports: [Avatar],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  readonly pageTitle = input('');
  readonly sidebarExpanded = input(true);
  readonly userName = input('Usuario PPAM');
  readonly toggleSidebar = output<void>();
}
