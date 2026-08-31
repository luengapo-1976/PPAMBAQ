import { Component, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ParticipanteNavbar } from '../participante-navbar/participante-navbar';
import { ParticipanteTabbar } from '../participante-tabbar/participante-tabbar';
import { SnackbarHost } from '../../shared/ui/snackbar/snackbar-host';
import { EncargadoPuntoService } from '../data/encargado-punto.service';
import { PuntoCalendarioDialog } from '../../features/configuracion/puntos/components/punto-calendario-dialog/punto-calendario-dialog';

/** Envuelve todas las pantallas del área de participante. En desktop no cambia nada
 * (la navbar y el tabbar están en display:none arriba de 600px, ver sus propios
 * estilos): el <main> queda como un bloque normal. En móvil agrega la navbar
 * superior (identidad + título) y el tabbar inferior fijo en todas las pantallas,
 * incluida Inicio. */
@Component({
  selector: 'app-participante-shell',
  imports: [
    RouterOutlet,
    ParticipanteNavbar,
    ParticipanteTabbar,
    SnackbarHost,
    PuntoCalendarioDialog,
  ],
  templateUrl: './participante-shell.html',
  styleUrl: './participante-shell.scss',
})
export class ParticipanteShell {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  protected readonly encargadoPunto = inject(EncargadoPuntoService);

  protected readonly navTitle = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.resolveTitle()),
    ),
    { initialValue: this.resolveTitle() },
  );

  private resolveTitle(): string {
    let route = this.activatedRoute.firstChild;
    while (route?.firstChild) {
      route = route.firstChild;
    }
    return (route?.snapshot?.data?.['title'] as string) ?? '';
  }

  /** Al cerrar el calendario "mi punto" siempre vuelve a Inicio, sin importar desde
   * qué pantalla se haya abierto (navbar móvil o topbar de escritorio de Inicio). */
  protected onCalendarioEncargadoClosed(): void {
    this.encargadoPunto.cerrar();
    this.router.navigateByUrl('/inicio');
  }
}
