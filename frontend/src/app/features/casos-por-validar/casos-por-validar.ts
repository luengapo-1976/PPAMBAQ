import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';
import { StatCard } from '../../shared/ui/stat-card/stat-card';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { Select, SelectOption } from '../../shared/ui/select/select';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../core/error.interceptor';
import { LookupsService } from '../solicitudes/data/lookups.service';
import { Congregacion } from '../solicitudes/data/models';
import { yearsSince } from '../solicitudes/data/publicador.utils';
import { buildWhatsAppLink } from '../solicitudes/data/mensaje-placeholder.util';
import { MensajesService } from '../mensajes/data/mensajes.service';
import { Mensaje } from '../mensajes/data/models';
import { ParametrosService } from '../configuracion/data/parametros.service';
import { formatDateShort, formatHoraAmPm } from '../../shared/utils/format.util';
import { CasosPorValidarService } from './data/casos-por-validar.service';
import { RetiroResumen, TurnoValidacionResumen } from './data/models';
import { substitutePlaceholdersCaso } from './data/mensaje-respuesta.util';

const CLAVE_MENSAJE_APROBACION = 'MENSAJE_RESPUESTA_APROBACION';
const CLAVE_MENSAJE_RECHAZO = 'MENSAJE_RESPUESTA_RECHAZO';

type Tipo = 'turnos' | 'retiros';
type Estado = 'pendientes' | 'aprobados' | 'rechazados';
type EstadoDecidido = 'aprobados' | 'rechazados';
type DialogPaso = 'cerrado' | 'detalle' | 'justificacion' | 'whatsapp';
type AccionTurno = 'aprobar' | 'rechazar';

function truncate(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean;
}

@Component({
  selector: 'app-casos-por-validar',
  imports: [FormsModule, StatCard, Dialog, Button, Select],
  templateUrl: './casos-por-validar.html',
  styleUrl: './casos-por-validar.scss',
})
export class CasosPorValidar {
  private readonly casosService = inject(CasosPorValidarService);
  private readonly lookupsService = inject(LookupsService);
  private readonly mensajesService = inject(MensajesService);
  private readonly parametrosService = inject(ParametrosService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly formatDateShort = formatDateShort;
  protected readonly formatHoraAmPm = formatHoraAmPm;
  protected readonly yearsSince = yearsSince;

  protected readonly loading = signal(true);

  protected readonly turnosPendientes = signal<TurnoValidacionResumen[]>([]);
  protected readonly turnosAprobados = signal<TurnoValidacionResumen[]>([]);
  protected readonly turnosRechazados = signal<TurnoValidacionResumen[]>([]);
  protected readonly retirosPendientes = signal<RetiroResumen[]>([]);
  protected readonly retirosAprobados = signal<RetiroResumen[]>([]);

  protected readonly congregaciones = toSignal(
    this.lookupsService.getCongregaciones().pipe(catchError(() => of<Congregacion[]>([]))),
    { initialValue: [] },
  );

  /** Catálogo de mensajes de categoría "RESPUESTA CASOS", usados para precargar el
   * WhatsApp de respuesta al aprobar/rechazar un caso. */
  protected readonly mensajesRespuesta = signal<Mensaje[]>([]);
  protected readonly mensajeRespuestaOptions = computed<SelectOption[]>(() =>
    this.mensajesRespuesta().map((m) => ({ value: m.id, label: `${m.tipo}: ${truncate(m.mensaje)}` })),
  );
  /** Mensaje configurado para cada evento (aprobación/rechazo) — null si aún no se ha
   * asociado ninguno. Se guardan como parámetros generales (MENSAJE_RESPUESTA_*). */
  protected readonly mensajeAprobacionId = signal<string | null>(null);
  protected readonly mensajeRechazoId = signal<string | null>(null);

  protected readonly configDialogOpen = signal(false);
  protected readonly configMensajeAprobacionId = signal<string | null>(null);
  protected readonly configMensajeRechazoId = signal<string | null>(null);
  protected readonly savingConfig = signal(false);

  /** Caso recién aprobado/rechazado a la espera de que el administrador confirme el
   * envío del WhatsApp de respuesta (paso dialogPaso === 'whatsapp'). */
  protected readonly pendingWhatsapp = signal<{ estado: EstadoDecidido; turno: TurnoValidacionResumen } | null>(
    null,
  );

  protected readonly tipo = signal<Tipo>('turnos');
  protected readonly estado = signal<Estado>('pendientes');

  protected readonly rowsTurnos = computed(() => {
    switch (this.estado()) {
      case 'aprobados':
        return this.turnosAprobados();
      case 'rechazados':
        return this.turnosRechazados();
      default:
        return this.turnosPendientes();
    }
  });
  protected readonly rowsRetiros = computed(() =>
    this.estado() === 'pendientes' ? this.retirosPendientes() : this.retirosAprobados(),
  );

  /** "Aprobados"/"rechazados" comparten la misma columna extra (quién decidió,
   * cuándo) — solo cambia la etiqueta según el estado que se esté mostrando. */
  protected readonly mostrarColumnaDecision = computed(() => this.estado() !== 'pendientes');
  protected readonly etiquetaDecisionPor = computed(() =>
    this.estado() === 'rechazados' ? 'Rechazado por' : 'Aprobado por',
  );
  protected readonly etiquetaFechaDecision = computed(() =>
    this.estado() === 'rechazados' ? 'Fecha de rechazo' : 'Fecha de aprobación',
  );

  protected readonly dialogPaso = signal<DialogPaso>('cerrado');
  protected readonly detalleTurno = signal<TurnoValidacionResumen | null>(null);
  protected readonly detalleRetiro = signal<RetiroResumen | null>(null);
  protected readonly justificacionAprobacion = signal('');
  protected readonly aprobando = signal(false);
  protected readonly accionSeleccionada = signal<AccionTurno | null>(null);

  protected readonly dialogTitulo = computed(() => {
    if (this.dialogPaso() === 'justificacion') {
      return this.accionSeleccionada() === 'rechazar' ? 'Rechazar solicitud' : 'Aprobar solicitud';
    }
    if (this.dialogPaso() === 'whatsapp') {
      return 'Enviar respuesta por WhatsApp';
    }
    return 'Detalle del caso';
  });

  protected readonly pendingWhatsappNombre = computed(
    () => this.pendingWhatsapp()?.turno.primerNombrePublicador ?? '',
  );

  protected readonly justificacionLabel = computed(() =>
    this.tipo() === 'turnos' ? 'Justificación de respuesta' : 'Observaciones de aprobación',
  );

  protected readonly justificacionPlaceholder = computed(() =>
    this.accionSeleccionada() === 'rechazar'
      ? 'Escribe el motivo del rechazo…'
      : 'Escribe el motivo de la aprobación…',
  );

  protected readonly dialogPrimaryLabel = computed(() => {
    if (this.aprobando()) {
      return 'Enviando…';
    }
    return this.accionSeleccionada() === 'rechazar' ? 'Enviar rechazo' : 'Enviar aprobación';
  });

  protected readonly dialogPrimaryDisabled = computed(
    () => !this.justificacionAprobacion().trim() || this.aprobando(),
  );

  constructor() {
    this.cargarTodo();
    this.cargarMensajesRespuesta();
  }

  protected congregacionNombre(codigo: number | null): string {
    if (codigo == null) {
      return '-';
    }
    const congregacion = this.congregaciones().find((c) => c.codigo_congregacion === codigo);
    return congregacion?.nombre_congregacion ?? '-';
  }

  protected nombreCompletoRetiro(retiro: RetiroResumen): string {
    const nombre = [
      retiro.primer_nombre,
      retiro.segundo_nombre,
      retiro.primer_apellido,
      retiro.segundo_apellido,
    ]
      .filter((parte): parte is string => !!parte && parte.trim().length > 0)
      .join(' ');
    return nombre || 'Publicador';
  }

  protected onSelectCard(tipo: Tipo, estado: Estado): void {
    this.tipo.set(tipo);
    this.estado.set(estado);
  }

  protected onVerDetalleTurno(row: TurnoValidacionResumen): void {
    this.detalleTurno.set(row);
    this.detalleRetiro.set(null);
    this.dialogPaso.set('detalle');
  }

  protected onVerDetalleRetiro(row: RetiroResumen): void {
    this.detalleRetiro.set(row);
    this.detalleTurno.set(null);
    this.dialogPaso.set('detalle');
  }

  protected onAbrirDecisionTurno(accion: AccionTurno): void {
    this.accionSeleccionada.set(accion);
    this.justificacionAprobacion.set('');
    this.dialogPaso.set('justificacion');
  }

  protected onAbrirAprobacionRetiro(): void {
    this.accionSeleccionada.set('aprobar');
    this.justificacionAprobacion.set('');
    this.dialogPaso.set('justificacion');
  }

  protected onCancelarAprobacion(): void {
    this.dialogPaso.set('detalle');
  }

  protected onCerrarDialog(): void {
    this.dialogPaso.set('cerrado');
    this.detalleTurno.set(null);
    this.detalleRetiro.set(null);
    this.accionSeleccionada.set(null);
    this.pendingWhatsapp.set(null);
  }

  protected onDialogClosed(): void {
    if (this.dialogPaso() === 'justificacion') {
      this.onCancelarAprobacion();
    } else {
      this.onCerrarDialog();
    }
  }

  protected onEnviarDecision(): void {
    const justificacion = this.justificacionAprobacion().trim();
    if (!justificacion || this.aprobando()) {
      return;
    }
    this.aprobando.set(true);

    if (this.tipo() === 'retiros') {
      const retiro = this.detalleRetiro();
      if (!retiro) {
        this.aprobando.set(false);
        return;
      }
      this.casosService.aprobarRetiro(retiro.id, justificacion).subscribe({
        next: () => {
          this.aprobando.set(false);
          this.snackbar.success('Solicitud de baja aprobada correctamente.');
          this.onCerrarDialog();
          this.cargarRetiros();
        },
        error: (err: ApiError) => {
          this.aprobando.set(false);
          this.snackbar.error(
            err?.message ?? 'No se pudo aprobar la solicitud de baja. Intenta nuevamente.',
          );
        },
      });
      return;
    }

    const turno = this.detalleTurno();
    if (!turno) {
      this.aprobando.set(false);
      return;
    }

    const esRechazo = this.accionSeleccionada() === 'rechazar';
    const request$ = esRechazo
      ? this.casosService.rechazarTurno(turno.id, justificacion)
      : this.casosService.aprobarTurno(turno.id, justificacion);

    request$.subscribe({
      next: (respuesta) => {
        this.aprobando.set(false);
        this.snackbar.success(
          esRechazo ? 'Solicitud rechazada correctamente.' : 'Solicitud aprobada correctamente.',
        );
        this.cargarTurnos();
        /** El id que identifica el caso para el paso de WhatsApp no es siempre el mismo
         * que turno.id — ver el comentario en TurnosRepository.registrarApRechaz. */
        this.pendingWhatsapp.set({
          estado: esRechazo ? 'rechazados' : 'aprobados',
          turno: { ...turno, id: respuesta.id },
        });
        this.detalleTurno.set(null);
        this.dialogPaso.set('whatsapp');
      },
      error: (err: ApiError) => {
        this.aprobando.set(false);
        this.snackbar.error(
          err?.message ??
            `No se pudo ${esRechazo ? 'rechazar' : 'aprobar'} la solicitud. Intenta nuevamente.`,
        );
      },
    });
  }

  /** Paso final tras aprobar/rechazar: el administrador confirma que quiere enviar ya el
   * WhatsApp de respuesta (precargado con el mensaje configurado para ese evento). Si
   * elige no hacerlo ahora, el ícono de WhatsApp en la grilla histórica le permite
   * retomarlo más tarde — por eso "Ahora no" simplemente cierra sin marcar nada. */
  protected onContinuarWhatsapp(): void {
    const pending = this.pendingWhatsapp();
    if (pending) {
      this.enviarWhatsappRespuesta(pending.estado, pending.turno);
    }
    this.onCerrarDialog();
  }

  protected onOmitirWhatsapp(): void {
    this.onCerrarDialog();
  }

  /** Ícono de WhatsApp en la grilla histórica (aprobados/rechazados): retoma el envío
   * para un caso que no había completado este paso. */
  protected onEnviarWhatsappDesdeGrid(row: TurnoValidacionResumen): void {
    const estado = this.estado();
    if (estado === 'pendientes') {
      return;
    }
    this.enviarWhatsappRespuesta(estado, row);
  }

  protected onAbrirConfigMensajes(): void {
    this.configMensajeAprobacionId.set(this.mensajeAprobacionId());
    this.configMensajeRechazoId.set(this.mensajeRechazoId());
    this.configDialogOpen.set(true);
  }

  protected onCerrarConfigMensajes(): void {
    this.configDialogOpen.set(false);
  }

  protected onGuardarConfigMensajes(): void {
    if (this.savingConfig()) {
      return;
    }
    this.savingConfig.set(true);
    forkJoin({
      aprobacion: this.parametrosService.update(CLAVE_MENSAJE_APROBACION, {
        valor: this.configMensajeAprobacionId(),
        activo: true,
      }),
      rechazo: this.parametrosService.update(CLAVE_MENSAJE_RECHAZO, {
        valor: this.configMensajeRechazoId(),
        activo: true,
      }),
    }).subscribe({
      next: () => {
        this.savingConfig.set(false);
        this.mensajeAprobacionId.set(this.configMensajeAprobacionId());
        this.mensajeRechazoId.set(this.configMensajeRechazoId());
        this.snackbar.success('Mensajes de respuesta guardados correctamente.');
        this.configDialogOpen.set(false);
      },
      error: (err: ApiError) => {
        this.savingConfig.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar la configuración de mensajes.');
      },
    });
  }

  /** Arma el mensaje configurado para ese evento, abre WhatsApp Web con el destinatario
   * y el texto precargados, y marca el caso como notificado. Si falta el mensaje
   * configurado o el móvil del publicador, avisa y no hace nada (el ícono de la grilla
   * queda disponible para reintentar). */
  private enviarWhatsappRespuesta(estado: EstadoDecidido, turno: TurnoValidacionResumen): void {
    const mensajeId = estado === 'rechazados' ? this.mensajeRechazoId() : this.mensajeAprobacionId();
    const mensaje = mensajeId ? this.mensajesRespuesta().find((m) => m.id === mensajeId) : null;
    if (!mensaje) {
      this.snackbar.error(
        'No hay un mensaje de respuesta configurado para este tipo de decisión. Configúralo desde "Mensajes de respuesta".',
      );
      return;
    }
    if (!turno.movil) {
      this.snackbar.error('Este publicador no tiene un número de móvil registrado.');
      return;
    }

    let texto = substitutePlaceholdersCaso(mensaje.mensaje, turno);
    if (mensaje.adjunto_asociado) {
      texto += `\n\n📎 Archivo adjunto: ${mensaje.adjunto_asociado}`;
    }

    window.open(buildWhatsAppLink(turno.movil, texto), '_blank', 'noopener');
    this.casosService.marcarWhatsappEnviado(estado, turno.id).subscribe({
      next: () => this.cargarTurnos(),
      error: () =>
        this.snackbar.error('El mensaje se abrió en WhatsApp, pero no se pudo registrar el envío.'),
    });
  }

  private cargarTodo(): void {
    this.loading.set(true);
    forkJoin({
      turnosPendientes: this.casosService
        .turnosPendientes()
        .pipe(catchError(() => of<TurnoValidacionResumen[]>([]))),
      turnosAprobados: this.casosService
        .turnosAprobados()
        .pipe(catchError(() => of<TurnoValidacionResumen[]>([]))),
      turnosRechazados: this.casosService
        .turnosRechazados()
        .pipe(catchError(() => of<TurnoValidacionResumen[]>([]))),
      retirosPendientes: this.casosService
        .retirosPendientes()
        .pipe(catchError(() => of<RetiroResumen[]>([]))),
      retirosAprobados: this.casosService
        .retirosAprobados()
        .pipe(catchError(() => of<RetiroResumen[]>([]))),
    }).subscribe((resultado) => {
      this.turnosPendientes.set(resultado.turnosPendientes);
      this.turnosAprobados.set(resultado.turnosAprobados);
      this.turnosRechazados.set(resultado.turnosRechazados);
      this.retirosPendientes.set(resultado.retirosPendientes);
      this.retirosAprobados.set(resultado.retirosAprobados);
      this.loading.set(false);
    });
  }

  private cargarTurnos(): void {
    this.casosService.turnosPendientes().subscribe({
      next: (data) => this.turnosPendientes.set(data),
      error: () => this.snackbar.error('No se pudo cargar los turnos pendientes por validar.'),
    });
    this.casosService.turnosAprobados().subscribe({
      next: (data) => this.turnosAprobados.set(data),
      error: () => this.snackbar.error('No se pudo cargar el histórico de turnos aprobados.'),
    });
    this.casosService.turnosRechazados().subscribe({
      next: (data) => this.turnosRechazados.set(data),
      error: () => this.snackbar.error('No se pudo cargar el histórico de turnos rechazados.'),
    });
  }

  private cargarRetiros(): void {
    this.casosService.retirosPendientes().subscribe({
      next: (data) => this.retirosPendientes.set(data),
      error: () => this.snackbar.error('No se pudo cargar las solicitudes de baja pendientes.'),
    });
    this.casosService.retirosAprobados().subscribe({
      next: (data) => this.retirosAprobados.set(data),
      error: () => this.snackbar.error('No se pudo cargar el histórico de bajas aprobadas.'),
    });
  }

  /** Catálogo de mensajes "RESPUESTA CASOS" y la configuración de cuál aplica a cada
   * evento (aprobación/rechazo), guardada como parámetros generales. */
  private cargarMensajesRespuesta(): void {
    forkJoin({
      mensajes: this.mensajesService.list().pipe(catchError(() => of<Mensaje[]>([]))),
      parametros: this.parametrosService.list().pipe(catchError(() => of([]))),
    }).subscribe(({ mensajes, parametros }) => {
      this.mensajesRespuesta.set(mensajes.filter((m) => m.categoria === 'RESPUESTA CASOS'));
      this.mensajeAprobacionId.set(
        parametros.find((p) => p.clave === CLAVE_MENSAJE_APROBACION)?.valor ?? null,
      );
      this.mensajeRechazoId.set(
        parametros.find((p) => p.clave === CLAVE_MENSAJE_RECHAZO)?.valor ?? null,
      );
    });
  }
}
