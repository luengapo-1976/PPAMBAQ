import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { RoleSwitch, RoleSwitchValue } from '../../shared/ui/role-switch/role-switch';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { Button } from '../../shared/ui/button/button';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Carousel } from '../../shared/ui/carousel/carousel';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ChangePasswordDialog } from '../../layout/header/components/change-password-dialog/change-password-dialog';
import { EncargadoPuntoService } from '../../layout/data/encargado-punto.service';
import { NoticiasService } from '../gestion-noticias/data/noticias.service';
import { Noticia } from '../gestion-noticias/data/models';
import { BannersService } from '../gestion-banners/data/banners.service';
import { Banner } from '../gestion-banners/data/models';
import { CapacitacionesService } from '../gestion-capacitaciones/data/capacitaciones.service';
import { Capacitacion } from '../gestion-capacitaciones/data/models';
import { formatDateShort } from '../../shared/utils/format.util';
import { getYoutubeThumbnail } from '../../shared/utils/video-embed.util';
import { PARTICIPANTE_MENU_ITEMS } from './data/menu-items';

const MAX_NOTICIAS_INICIO = 6;

@Component({
  selector: 'app-inicio',
  imports: [
    RouterLink,
    FormsModule,
    RoleSwitch,
    Avatar,
    Button,
    Dialog,
    Carousel,
    ChangePasswordDialog,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly noticiasService = inject(NoticiasService);
  private readonly bannersService = inject(BannersService);
  private readonly capacitacionesService = inject(CapacitacionesService);
  private readonly snackbar = inject(SnackbarService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly encargadoPunto = inject(EncargadoPuntoService);

  protected readonly formatDateShort = formatDateShort;
  protected readonly getYoutubeThumbnail = getYoutubeThumbnail;

  protected readonly nombre = computed(
    () =>
      this.authService.currentSession()?.publicador?.nombre_completo ||
      this.authService.currentSession()?.login ||
      'Publicador',
  );
  /** Solo para el saludo ("Hola, ..."): el avatar sigue usando nombre() completo,
   * ya que necesita nombre + apellido para calcular las dos iniciales. */
  protected readonly primerNombre = computed(
    () => this.authService.currentSession()?.publicador?.primer_nombre?.trim() || this.nombre(),
  );
  protected readonly mainItems = PARTICIPANTE_MENU_ITEMS;

  protected readonly showRoleSwitch = this.authService.puedeAlternarVista;
  protected readonly vistaActiva = this.authService.vistaActiva;

  protected readonly menuOpen = signal(false);
  protected readonly changePasswordOpen = signal(false);

  protected readonly noticias = signal<Noticia[]>([]);
  protected readonly banners = signal<Banner[]>([]);
  protected readonly bannerSlides = computed(() =>
    this.banners().map((banner) => ({
      imagenUrl: banner.imagen_url,
      alt: 'Publicadores de la PPAM',
    })),
  );

  protected readonly capacitaciones = signal<Capacitacion[]>([]);

  protected readonly contactoOpen = signal(false);
  protected readonly contactoMensaje = signal('');
  protected readonly contactoEnviando = signal(false);

  constructor() {
    this.cargarNoticias();
    this.cargarBanners();
    this.cargarCapacitaciones();
  }

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

  protected onAbrirContacto(): void {
    this.contactoMensaje.set('');
    this.contactoOpen.set(true);
  }

  protected onCerrarContacto(): void {
    this.contactoOpen.set(false);
  }

  protected onEnviarContacto(): void {
    const mensaje = this.contactoMensaje().trim();
    if (!mensaje || this.contactoEnviando()) {
      return;
    }
    /** Todavía no está habilitado el envío de correos: por ahora solo se
     * confirma en pantalla, sin persistir ni enviar nada al backend. */
    this.contactoEnviando.set(true);
    this.contactoEnviando.set(false);
    this.contactoOpen.set(false);
    this.snackbar.success('Gracias, hemos recibido tu mensaje. Te contactaremos pronto.');
  }

  protected onScrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private cargarNoticias(): void {
    this.noticiasService.listPublicadas().subscribe({
      next: (data) => this.noticias.set(data.slice(0, MAX_NOTICIAS_INICIO)),
      error: () => this.noticias.set([]),
    });
  }

  private cargarBanners(): void {
    this.bannersService.listVisibles().subscribe({
      next: (data) => this.banners.set(data),
      error: () => this.banners.set([]),
    });
  }

  private cargarCapacitaciones(): void {
    this.capacitacionesService.listVisibles().subscribe({
      next: (data) => this.capacitaciones.set(data),
      error: () => this.capacitaciones.set([]),
    });
  }
}
