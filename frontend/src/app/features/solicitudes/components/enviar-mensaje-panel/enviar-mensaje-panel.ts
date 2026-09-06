import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../shared/ui/button/button';
import { SearchSelect, SearchSelectOption } from '../../../../shared/ui/search-select/search-select';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';
import { MensajesService } from '../../../mensajes/data/mensajes.service';
import { Mensaje } from '../../../mensajes/data/models';
import { MENSAJE_RELACIONADO_CON_OPTIONS, MensajeRelacionadoCon, Publicador } from '../../data/models';
import { PublicadoresService } from '../../data/publicadores.service';
import { nombreCompleto } from '../../data/publicador.utils';
import { buildWhatsAppLink, substitutePlaceholders } from '../../data/mensaje-placeholder.util';
import { Punto } from '../../../configuracion/data/models';

interface RecipientLink {
  publicador: Publicador;
  link: string;
  opened: boolean;
}

@Component({
  selector: 'app-enviar-mensaje-panel',
  imports: [ReactiveFormsModule, Dialog, Button, SearchSelect],
  templateUrl: './enviar-mensaje-panel.html',
  styleUrl: './enviar-mensaje-panel.scss',
})
export class EnviarMensajePanel {
  private readonly mensajesService = inject(MensajesService);
  private readonly publicadoresService = inject(PublicadoresService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly selectedPublicadorIds = input<string[]>([]);
  readonly publicadores = input<Publicador[]>([]);
  readonly puntos = input<Punto[]>([]);
  /** Separación desde el borde derecho, para dejar espacio a la barra de acciones cuando se abre desde ahí. */
  readonly rightOffset = input('0px');
  readonly closed = output<void>();
  readonly sent = output<void>();

  protected readonly nombreCompleto = nombreCompleto;
  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly mensajeText = signal('');
  protected readonly recipientLinks = signal<RecipientLink[] | null>(null);
  protected readonly sending = signal(false);

  protected readonly tipoControl = new FormControl<string | null>(null);
  protected readonly mensajeControl = new FormControl<string | null>(null);
  protected readonly mensajeRelacionadoControl = new FormControl<MensajeRelacionadoCon | null>(null);

  protected readonly mensajeRelacionadoOptions: SearchSelectOption[] = MENSAJE_RELACIONADO_CON_OPTIONS.map((v) => ({
    value: v,
    label: v === 'otro' ? 'Otro' : v,
  }));

  private readonly selectedTipo = toSignal(this.tipoControl.valueChanges, { initialValue: null });
  private readonly selectedMensajeId = toSignal(this.mensajeControl.valueChanges, { initialValue: null });
  private readonly selectedMensajeRelacionado = toSignal(this.mensajeRelacionadoControl.valueChanges, {
    initialValue: null,
  });

  /** Solo se ofrecen mensajes de categoría ENTRENAMIENTO: los de "RESPUESTA CASOS" son
   * exclusivos del flujo de aprobación/rechazo en Casos por validar. */
  protected readonly mensajesEntrenamiento = computed(() =>
    this.mensajes().filter((m) => m.categoria === 'ENTRENAMIENTO'),
  );

  protected readonly tipoOptions = computed<SearchSelectOption[]>(() => {
    const tipos = [...new Set(this.mensajesEntrenamiento().map((m) => m.tipo))].sort();
    return tipos.map((t) => ({ value: t, label: t }));
  });

  protected readonly mensajeOptions = computed<SearchSelectOption[]>(() => {
    const tipo = this.selectedTipo();
    return this.mensajesEntrenamiento()
      .filter((m) => m.tipo === tipo)
      .map((m) => ({ value: m.id, label: truncate(m.mensaje) }));
  });

  protected readonly selectedMensaje = computed(
    () => this.mensajesEntrenamiento().find((m) => m.id === this.selectedMensajeId()) ?? null,
  );

  protected readonly adjuntoNombre = computed(() => {
    const url = this.selectedMensaje()?.adjunto_asociado;
    return url ? fileNameFromUrl(url) : null;
  });

  protected readonly selectedPublicadores = computed(() => {
    const ids = new Set(this.selectedPublicadorIds());
    return this.publicadores().filter((p) => ids.has(p.id));
  });

  protected readonly recipientsWithoutMovil = computed(() => this.selectedPublicadores().filter((p) => !p.movil));

  protected readonly canSend = computed(
    () =>
      !!this.selectedTipo() &&
      !!this.selectedMensajeId() &&
      !!this.selectedMensajeRelacionado() &&
      this.mensajeText().trim().length > 0,
  );

  constructor() {
    effect(() => {
      if (this.open()) {
        this.loadMensajes();
        this.tipoControl.reset(null, { emitEvent: false });
        this.mensajeControl.reset(null, { emitEvent: false });
        this.mensajeRelacionadoControl.reset(null, { emitEvent: false });
        this.mensajeText.set('');
        this.recipientLinks.set(null);
      }
    });

    effect(() => {
      // Si cambia el tipo y el mensaje elegido ya no pertenece a ese tipo, se limpia.
      const options = this.mensajeOptions();
      const current = this.mensajeControl.value;
      if (current && !options.some((o) => o.value === current)) {
        this.mensajeControl.setValue(null);
      }
    });

    effect(() => {
      // Solo sincroniza el texto cuando se elige una plantilla real; no se toca
      // recipientLinks aquí para que la lista de enlaces generados sobreviva
      // a la limpieza de campos que ocurre después de un envío exitoso.
      const mensaje = this.selectedMensaje();
      if (mensaje) {
        this.mensajeText.set(mensaje.mensaje);
      }
    });
  }

  protected onEnviar(): void {
    if (!this.canSend() || this.sending()) {
      return;
    }
    const mensaje = this.selectedMensaje()!;
    const recipients = this.selectedPublicadores();
    if (recipients.length === 0) {
      this.snackbar.error('No hay destinatarios seleccionados.');
      return;
    }

    const adjuntoUrl = mensaje.adjunto_asociado;
    const links: RecipientLink[] = recipients
      .filter((p) => !!p.movil)
      .map((p) => {
        let final = substitutePlaceholders(this.mensajeText(), p, this.puntos());
        if (adjuntoUrl) {
          final += `\n\n📎 Archivo adjunto: ${adjuntoUrl}`;
        }
        return {
          publicador: p,
          link: buildWhatsAppLink(p.movil, final),
          opened: false,
        };
      });

    if (links.length === 0) {
      this.snackbar.error('Ninguno de los destinatarios seleccionados tiene un número de móvil registrado.');
      return;
    }

    this.recipientLinks.set(links);

    if (links.length === 1) {
      window.open(links[0].link, '_blank', 'noopener');
      this.markOpened(links[0].publicador.id);
    } else {
      this.snackbar.show(
        `Se generaron ${links.length} enlaces de WhatsApp. Haz clic en cada uno para abrir y enviar el mensaje.`,
        'info',
      );
    }

    this.sending.set(true);
    this.publicadoresService
      .notificarEntrenamiento(
        links.map((l) => l.publicador.id),
        this.selectedMensajeRelacionado()!,
      )
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.tipoControl.reset(null);
          this.mensajeControl.reset(null);
          this.mensajeRelacionadoControl.reset(null);
          this.mensajeText.set('');
          this.sent.emit();
        },
        error: () => {
          this.sending.set(false);
          this.snackbar.error('Los enlaces se generaron, pero no se pudo actualizar el estado de las solicitudes.');
        },
      });
  }

  protected markOpened(publicadorId: string): void {
    this.recipientLinks.update((links) =>
      links ? links.map((l) => (l.publicador.id === publicadorId ? { ...l, opened: true } : l)) : links,
    );
  }

  protected onClose(): void {
    this.closed.emit();
  }

  private loadMensajes(): void {
    this.mensajesService.list().subscribe({
      next: (data) => this.mensajes.set(data),
      error: () => this.snackbar.error('No se pudo cargar el catálogo de mensajes.'),
    });
  }
}

function truncate(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean;
}

function fileNameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.substring(decoded.lastIndexOf('/') + 1);
  } catch {
    return url;
  }
}
