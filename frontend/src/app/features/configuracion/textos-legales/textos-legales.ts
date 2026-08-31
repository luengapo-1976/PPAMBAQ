import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from '../../../shared/ui/button/button';
import { Switch } from '../../../shared/ui/switch/switch';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../core/error.interceptor';
import { formatDateShort } from '../../../shared/utils/format.util';
import { TextosLegalesService, TextoLegal } from '../data/textos-legales.service';

/** Único tipo de texto legal que existe por ahora; la tabla admite agregar más a
 * futuro (términos y condiciones, política de cookies, etc.) sin cambios de esquema. */
const TIPO_TRATAMIENTO_DATOS = 'TRATAMIENTO_DATOS_PERSONALES';

@Component({
  selector: 'app-textos-legales',
  imports: [FormsModule, Button, Switch],
  templateUrl: './textos-legales.html',
  styleUrl: './textos-legales.scss',
})
export class TextosLegales {
  private readonly textosLegalesService = inject(TextosLegalesService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly actualizandoEstado = signal(false);
  protected readonly contenido = signal('');
  protected readonly historial = signal<TextoLegal[]>([]);
  /** Estado de publicación de la versión cargada. Cambiarlo actualiza de inmediato la
   * columna "activo" en la base de datos (sin crear una versión nueva); también decide
   * con qué estado queda una versión nueva si se guarda mientras está en esta posición. */
  protected readonly publicar = signal(false);
  /** Versión cargada en el textarea: la activa si existe, o la más reciente (que puede
   * seguir sin publicar) cuando todavía no hay ninguna activa. Se usa para no repetirla
   * en "Versiones anteriores". */
  protected readonly versionCargada = signal<TextoLegal | null>(null);
  protected readonly formatDateShort = formatDateShort;

  protected readonly puedeGuardar = computed(() => this.contenido().trim().length > 0);

  constructor() {
    this.cargar();
  }

  protected onGuardar(): void {
    if (!this.puedeGuardar() || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.textosLegalesService
      .crearVersion(TIPO_TRATAMIENTO_DATOS, this.contenido().trim(), this.publicar())
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbar.success(
            this.publicar()
              ? 'Se publicó una nueva versión del texto legal.'
              : 'Se guardó una nueva versión como borrador, sin publicar.',
          );
          this.cargar();
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.snackbar.error(err?.message ?? 'No se pudo guardar el texto legal.');
        },
      });
  }

  /** Publica o despublica la versión cargada de inmediato (update directo de la
   * columna "activo", sin crear una versión nueva ni tocar el contenido del textarea
   * — así no se pierde un borrador que se esté editando y aún no se haya guardado). */
  protected onPublicarChange(value: boolean): void {
    const version = this.versionCargada();
    if (!version || this.actualizandoEstado()) {
      return;
    }
    this.actualizandoEstado.set(true);
    this.textosLegalesService.actualizarEstado(version.id, value).subscribe({
      next: (actualizado) => {
        this.actualizandoEstado.set(false);
        this.publicar.set(actualizado.activo);
        this.versionCargada.set(actualizado);
        this.historial.update((lista) =>
          lista.map((item) => {
            if (item.id === actualizado.id) {
              return actualizado;
            }
            return value ? { ...item, activo: false } : item;
          }),
        );
        this.snackbar.success(value ? 'Versión publicada.' : 'Versión despublicada.');
      },
      error: (err: ApiError) => {
        this.actualizandoEstado.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo actualizar el estado del texto legal.');
      },
    });
  }

  private cargar(): void {
    this.loading.set(true);
    this.textosLegalesService.listar(TIPO_TRATAMIENTO_DATOS).subscribe({
      next: (versiones) => {
        this.historial.set(versiones);
        const activo = versiones.find((v) => v.activo);
        const masReciente = activo ?? versiones[0] ?? null;
        this.contenido.set(masReciente?.contenido ?? '');
        this.versionCargada.set(masReciente);
        this.publicar.set(masReciente?.activo ?? false);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackbar.error('No se pudo cargar el historial de textos legales.');
      },
    });
  }
}
