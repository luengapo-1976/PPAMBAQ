import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PARTICIPANTE_NAV_ITEMS } from '../participante-nav-items';

@Component({
  selector: 'app-participante-tabbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './participante-tabbar.html',
  styleUrl: './participante-tabbar.scss',
})
export class ParticipanteTabbar {
  protected readonly items = PARTICIPANTE_NAV_ITEMS;
}
