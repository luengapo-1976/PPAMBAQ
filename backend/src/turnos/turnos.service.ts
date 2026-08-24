import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TurnosRepository, TurnoConSexo, TurnoValidacion } from './turnos.repository';
import { PublicadoresRepository } from '../publicadores/publicadores.repository';
import { PuntosRepository } from '../puntos/puntos.repository';
import { SolicitarTurnoDto } from './dto/solicitar-turno.dto';
import { DevolverTurnoDto } from './dto/devolver-turno.dto';
import { ReportarActividadDto } from './dto/reportar-actividad.dto';
import { AprobarSolicitudDto } from './dto/aprobar-solicitud.dto';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { todayIsoDateBogota } from '../common/audit/audit.util';

const ESTADO_APROBADO = 'APROBADO';
const ESTADO_PENDIENTE = 'PENDIENTE';
const TURNO_TOMADO_MESSAGE = 'Este turno ya fue tomado por otro publicador. Elige otro horario disponible.';
const MAX_TURNOS_POR_PUBLICADOR = 3;
const LIMITE_TURNOS_MESSAGE = 'No puedes solicitar más turnos. Debes liberar al menos 1.';

export interface MiTurnoResumen {
  id: string;
  nombrePunto: string;
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
}

export interface ConteoTurnosPublicador {
  solicitados: number;
  maximo: number;
  turnos: MiTurnoResumen[];
}

export interface TurnoValidacionResumen {
  id: string;
  nombrePunto: string;
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
  situacionIdentificada: string | null;
  nombrePublicador: string;
  fechaNacimiento: string | null;
  fechaSolicitud: string | null;
  aprobadoPor: string | null;
  justificacionAprobacion: string | null;
  fechaAprobacion: string | null;
}

export interface ActividadHistorialItem {
  fechaActividad: string;
  cumplioTurno: string | null;
  inicioConversacion: string | null;
  arreglosCurso: string | null;
  observaciones: string | null;
  registradoPor: string;
}

export type TurnoDisponibilidad = 'ocupado' | 'disponible' | 'disponible_hermano' | 'disponible_hermana';

export interface TurnoResumen {
  id: string;
  codigo_punto: number;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  id_publicador: string | null;
  sexo_ocupante: string | null;
  disponibilidad: TurnoDisponibilidad;
}

export type SolicitarTurnoOutcome = 'aprobado' | 'requiere_justificacion' | 'pendiente';

export interface SolicitarTurnoResultado {
  outcome: SolicitarTurnoOutcome;
  mensaje: string;
}

@Injectable()
export class TurnosService {
  constructor(
    private readonly turnosRepository: TurnosRepository,
    private readonly publicadoresRepository: PublicadoresRepository,
    private readonly puntosRepository: PuntosRepository,
  ) {}

  async findByCodigoPunto(codigoPunto: number): Promise<TurnoResumen[]> {
    const turnos = await this.turnosRepository.findByCodigoPunto(codigoPunto);
    return turnos.map((turno) => this.toResumen(turno, turnos));
  }

  async contarSolicitadosPorUsuario(user: AuthenticatedUser): Promise<ConteoTurnosPublicador> {
    if (!user.publicadorId) {
      throw new ForbiddenException('Debes ingresar como participante para consultar tus turnos.');
    }
    const misTurnos = await this.turnosRepository.findByPublicador(user.publicadorId);
    return {
      solicitados: misTurnos.length,
      maximo: MAX_TURNOS_POR_PUBLICADOR,
      turnos: misTurnos.map((turno) => ({
        id: turno.id,
        nombrePunto: turno.puntos?.nombre_punto ?? 'Punto sin nombre',
        diaNombre: turno.dia_nombre,
        horaInicio: turno.hora_inicio,
        horaFin: turno.hora_fin,
      })),
    };
  }

  async solicitar(turnoId: string, dto: SolicitarTurnoDto, user: AuthenticatedUser): Promise<SolicitarTurnoResultado> {
    if (!user.publicadorId) {
      throw new ForbiddenException('Debes ingresar como participante para solicitar un turno.');
    }

    const publicador = await this.publicadoresRepository.findById(user.publicadorId);
    if (!publicador) {
      throw new NotFoundException('No se encontró tu registro de publicador.');
    }
    if (!publicador.sexo) {
      throw new BadRequestException(
        'Debes completar el campo "Sexo" en Actualizar datos antes de poder solicitar un turno.',
      );
    }

    const misTurnos = await this.turnosRepository.findByPublicador(publicador.id);
    if (misTurnos.length >= MAX_TURNOS_POR_PUBLICADOR) {
      throw new ForbiddenException(LIMITE_TURNOS_MESSAGE);
    }

    const turno = await this.turnosRepository.findById(turnoId);
    if (!turno) {
      throw new NotFoundException('El turno indicado no existe.');
    }
    if (turno.id_publicador) {
      throw new ConflictException(TURNO_TOMADO_MESSAGE);
    }

    const punto = await this.puntosRepository.findByCodigo(turno.codigo_punto);
    if (!punto) {
      throw new NotFoundException('No se encontró el punto correspondiente a este turno.');
    }

    const pareja = await this.turnosRepository.findPareja(
      turno.codigo_punto,
      turno.dia_numero,
      turno.hora_inicio,
      turno.hora_fin,
      turno.id,
    );
    const sexoPareja = pareja?.id_publicador ? (pareja.publicadores?.sexo ?? null) : null;
    const primerNombre = publicador.primer_nombre?.trim() || 'Publicador';
    const hayConflictoDeSexo = sexoPareja !== null && sexoPareja !== publicador.sexo;

    if (!hayConflictoDeSexo) {
      const actualizado = await this.turnosRepository.asignarSiLibre(turnoId, {
        id_publicador: publicador.id,
        estado_solicitud: ESTADO_APROBADO,
        usuario_modifica: user.login,
        fecha_modificacion: todayIsoDateBogota(),
      });
      if (!actualizado) {
        throw new ConflictException(TURNO_TOMADO_MESSAGE);
      }

      return {
        outcome: 'aprobado',
        mensaje: this.mensajeAprobado(primerNombre, punto.encargado, punto.movil),
      };
    }

    const justificacion = dto.justificacion?.trim();
    if (!justificacion) {
      return {
        outcome: 'requiere_justificacion',
        mensaje: this.mensajeAdvertencia(primerNombre, sexoPareja),
      };
    }

    const actualizado = await this.turnosRepository.asignarSiLibre(turnoId, {
      id_publicador: publicador.id,
      estado_solicitud: ESTADO_PENDIENTE,
      justificacion,
      situacion_identificada: this.describirSituacionIdentificada(sexoPareja, publicador.sexo),
      usuario_modifica: user.login,
      fecha_modificacion: todayIsoDateBogota(),
    });
    if (!actualizado) {
      throw new ConflictException(TURNO_TOMADO_MESSAGE);
    }

    return {
      outcome: 'pendiente',
      mensaje: this.mensajePendiente(primerNombre),
    };
  }

  async devolver(turnoId: string, dto: DevolverTurnoDto, user: AuthenticatedUser): Promise<{ mensaje: string }> {
    if (!user.publicadorId) {
      throw new ForbiddenException('Debes ingresar como participante para devolver un turno.');
    }

    const publicador = await this.publicadoresRepository.findById(user.publicadorId);
    if (!publicador) {
      throw new NotFoundException('No se encontró tu registro de publicador.');
    }

    const turno = await this.turnosRepository.findById(turnoId);
    if (!turno || turno.id_publicador !== publicador.id) {
      throw new NotFoundException('Este turno no está asignado a tu registro.');
    }

    const motivo = dto.motivo === 'Otro' ? `Otro: ${dto.motivoOtro!.trim()}` : dto.motivo;
    const hoy = todayIsoDateBogota();

    /** Se libera el turno primero: si algo falla después al registrar el histórico,
     * es preferible que el turno haya quedado libre (aunque se pierda el registro de
     * "por qué") a que quede tomado indefinidamente mientras el histórico sí quedó. */
    const liberado = await this.turnosRepository.liberarSiEsDelPublicador(turnoId, publicador.id, {
      id_publicador: null,
      estado_solicitud: null,
      observaciones: null,
      justificacion: null,
      usuario_modifica: user.login,
      fecha_modificacion: hoy,
    });
    if (!liberado) {
      throw new ConflictException('Este turno ya no está asignado a tu registro.');
    }

    await this.turnosRepository.registrarEntrega({
      codigo_punto: turno.codigo_punto,
      dia_numero: turno.dia_numero,
      dia_nombre: turno.dia_nombre,
      hora_inicio: turno.hora_inicio,
      hora_fin: turno.hora_fin,
      id_publicador: publicador.id,
      motivo,
      observaciones: dto.observaciones?.trim() || null,
      usuario_registra: user.login,
      fecha_registro: hoy,
    });

    const primerNombre = publicador.primer_nombre?.trim() || 'Publicador';
    return {
      mensaje:
        `${primerNombre}, confirmamos la liberación de este turno que tenías asignado. Gracias por ayudarnos a ` +
        `mantener actualizada la información de esta plataforma de gestión. Deseamos que Jehová siga bendiciendo ` +
        `tu fiel servicio.`,
    };
  }

  async verificarDisponibilidadActividad(
    turnoId: string,
    fechaActividad: string,
    user: AuthenticatedUser,
  ): Promise<{ disponible: boolean; mensaje?: string }> {
    const { publicador, turno } = await this.cargarTurnoPropio(turnoId, user, 'consultar la disponibilidad de esta fecha');
    this.validarFechaNoFutura(fechaActividad);
    this.validarDiaSemana(turno, fechaActividad);

    const conflicto = await this.buscarConflictoActividad(turno, fechaActividad);
    if (!conflicto) {
      return { disponible: true };
    }

    return {
      disponible: false,
      mensaje: await this.mensajeActividadDuplicada(publicador, turno, fechaActividad, conflicto.usuario_registra),
    };
  }

  async reportarActividad(
    turnoId: string,
    dto: ReportarActividadDto,
    user: AuthenticatedUser,
  ): Promise<{ mensaje: string }> {
    const { publicador, turno } = await this.cargarTurnoPropio(turnoId, user, 'reportar actividad de este turno');
    this.validarFechaNoFutura(dto.fechaActividad);
    this.validarDiaSemana(turno, dto.fechaActividad);

    const conflicto = await this.buscarConflictoActividad(turno, dto.fechaActividad);
    if (conflicto) {
      throw new ConflictException(
        await this.mensajeActividadDuplicada(publicador, turno, dto.fechaActividad, conflicto.usuario_registra),
      );
    }

    await this.turnosRepository.registrarActividad({
      id_turno: turno.id,
      fecha_actividad: dto.fechaActividad,
      cumplio_turno: dto.cumplioTurno,
      inicio_conversacion: dto.inicioConversacion ?? null,
      arreglos_curso: dto.arreglosCurso ?? null,
      observaciones: dto.observaciones?.trim() || null,
      usuario_registra: user.login,
      fecha_registro: todayIsoDateBogota(),
    });

    const primerNombre = publicador.primer_nombre?.trim() || 'Publicador';
    return {
      mensaje:
        `${primerNombre}, hemos recibido tu reporte de actividad. Muchas gracias por contribuir con el suministro ` +
        `de información para nuestra PPAM. Deseamos que Jehová te siga bendiciendo en tu fiel servicio.`,
    };
  }

  /** Histórico completo del horario (punto+día+hora), sin importar cuál de los 2
   * cupos reportó cada fecha — mismo criterio de agrupación que el chequeo de
   * duplicados al reportar. */
  async historialActividad(turnoId: string, user: AuthenticatedUser): Promise<ActividadHistorialItem[]> {
    const { turno } = await this.cargarTurnoPropio(turnoId, user, 'consultar el histórico de este turno');

    const turnoIds = await this.turnosRepository.findIdsPorPuntoDiaHora(
      turno.codigo_punto,
      turno.dia_nombre,
      turno.hora_inicio,
      turno.hora_fin,
    );
    if (turnoIds.length === 0) {
      return [];
    }

    const actividades = await this.turnosRepository.findActividadesPorTurnos(turnoIds);
    if (actividades.length === 0) {
      return [];
    }

    const logins = [...new Set(actividades.map((a) => a.usuario_registra).filter((login): login is string => !!login))];
    const publicadoresPorLogin = new Map(
      (await this.publicadoresRepository.findNombresByLogins(logins)).map((p) => [p.login, p]),
    );

    return actividades.map((actividad) => {
      const registrador = actividad.usuario_registra ? publicadoresPorLogin.get(actividad.usuario_registra) : null;
      const nombre = `${registrador?.primer_nombre ?? ''} ${registrador?.primer_apellido ?? ''}`.trim();
      return {
        fechaActividad: actividad.fecha_actividad,
        cumplioTurno: actividad.cumplio_turno,
        inicioConversacion: actividad.inicio_conversacion,
        arreglosCurso: actividad.arreglos_curso,
        observaciones: actividad.observaciones,
        registradoPor: nombre || 'Publicador',
      };
    });
  }

  /** Turnos con conflicto de sexo sin resolver automáticamente: quedaron
   * "PENDIENTE" con la justificación del publicador, a la espera de que un
   * administrador los revise en "Casos por validar". */
  async pendientesValidacion(): Promise<TurnoValidacionResumen[]> {
    const rows = await this.turnosRepository.findPendientesValidacion();
    return rows.map((row) => this.toValidacionResumen(row));
  }

  /** Histórico de casos que pasaron por revisión manual (no todo turno "APROBADO",
   * solo los que tienen aprobado_por). */
  async aprobadosValidacion(): Promise<TurnoValidacionResumen[]> {
    const rows = await this.turnosRepository.findAprobadosValidacion();
    return rows.map((row) => this.toValidacionResumen(row));
  }

  async aprobarSolicitudPendiente(
    turnoId: string,
    dto: AprobarSolicitudDto,
    user: AuthenticatedUser,
  ): Promise<{ mensaje: string }> {
    const aprobado = await this.turnosRepository.aprobarSolicitud(turnoId, {
      estado_solicitud: ESTADO_APROBADO,
      aprobado_por: user.login,
      justificacion_aprobacion: dto.justificacion.trim(),
      fecha_aprobacion: todayIsoDateBogota(),
    });
    if (!aprobado) {
      throw new ConflictException('Esta solicitud ya fue procesada.');
    }
    return { mensaje: 'La solicitud fue aprobada correctamente.' };
  }

  private toValidacionResumen(turno: TurnoValidacion): TurnoValidacionResumen {
    const publicador = turno.publicadores;
    const nombrePublicador =
      [publicador?.primer_nombre, publicador?.segundo_nombre, publicador?.primer_apellido, publicador?.segundo_apellido]
        .filter((parte): parte is string => !!parte && parte.trim().length > 0)
        .join(' ') || 'Publicador';

    return {
      id: turno.id,
      nombrePunto: turno.puntos?.nombre_punto ?? 'Punto sin nombre',
      diaNombre: turno.dia_nombre,
      horaInicio: turno.hora_inicio,
      horaFin: turno.hora_fin,
      situacionIdentificada: turno.situacion_identificada,
      nombrePublicador,
      fechaNacimiento: publicador?.fecha_nacimiento ?? null,
      fechaSolicitud: turno.fecha_modificacion,
      aprobadoPor: turno.aprobado_por,
      justificacionAprobacion: turno.justificacion_aprobacion,
      fechaAprobacion: turno.fecha_aprobacion,
    };
  }

  private async cargarTurnoPropio(turnoId: string, user: AuthenticatedUser, accion: string) {
    if (!user.publicadorId) {
      throw new ForbiddenException(`Debes ingresar como participante para ${accion}.`);
    }
    const publicador = await this.publicadoresRepository.findById(user.publicadorId);
    if (!publicador) {
      throw new NotFoundException('No se encontró tu registro de publicador.');
    }
    const turno = await this.turnosRepository.findById(turnoId);
    if (!turno || turno.id_publicador !== publicador.id) {
      throw new NotFoundException('Este turno no está asignado a tu registro.');
    }
    return { publicador, turno };
  }

  /** Los dos cupos de un mismo punto+día+hora comparten la misma actividad: basta con
   * que uno de los dos publicadores ya la haya reportado para esa fecha. */
  private async buscarConflictoActividad(turno: TurnoConSexo, fechaActividad: string) {
    const pareja = await this.turnosRepository.findPareja(
      turno.codigo_punto,
      turno.dia_numero,
      turno.hora_inicio,
      turno.hora_fin,
      turno.id,
    );
    const turnoIds = pareja ? [turno.id, pareja.id] : [turno.id];
    return this.turnosRepository.findActividadPorTurnosYFecha(turnoIds, fechaActividad);
  }

  private validarFechaNoFutura(fechaActividad: string): void {
    if (fechaActividad > todayIsoDateBogota()) {
      throw new BadRequestException('La fecha de la actividad no puede ser una fecha futura.');
    }
  }

  /** No hay una columna que registre la convención de dia_numero (0/1-indexado, qué
   * día es el 0, etc.), así que la validación se hace por nombre de día — inequívoco
   * y ya viene guardado en turnos.dia_nombre. */
  private validarDiaSemana(turno: TurnoConSexo, fechaActividad: string): void {
    const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const [anio, mes, dia] = fechaActividad.split('-').map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    const diaEsperado = DIAS[fecha.getUTCDay()];

    if (diaEsperado.toLowerCase() !== turno.dia_nombre.trim().toLowerCase()) {
      throw new BadRequestException(
        `La fecha elegida debe caer en día ${turno.dia_nombre}, que es el día programado de este turno.`,
      );
    }
  }

  private async mensajeActividadDuplicada(
    publicador: { primer_nombre: string | null },
    turno: TurnoConSexo,
    fechaActividad: string,
    usuarioRegistra: string | null,
  ): Promise<string> {
    const punto = await this.puntosRepository.findByCodigo(turno.codigo_punto);
    const nombreOtro = await this.nombrePorLogin(usuarioRegistra);
    const primerNombre = publicador.primer_nombre?.trim() || 'Publicador';

    return (
      `${primerNombre}, te informamos que la actividad para el punto ${punto?.nombre_punto ?? 'este punto'}, del ` +
      `día ${turno.dia_nombre}, de ${this.formatHoraAmPm(turno.hora_inicio)} a ${this.formatHoraAmPm(turno.hora_fin)} ` +
      `para la fecha ${this.formatFechaLarga(fechaActividad)} ya fue registrada previamente por ${nombreOtro}, por ` +
      `lo tanto no se puede hacer un nuevo registro sobre esta misma fecha en este punto y horario. Muchas gracias ` +
      `por contribuir con el suministro de información para nuestra PPAM. Deseamos que Jehová te siga bendiciendo ` +
      `en tu fiel servicio.`
    );
  }

  private async nombrePorLogin(login: string | null): Promise<string> {
    if (!login) {
      return 'otro publicador';
    }
    const otro = await this.publicadoresRepository.findByLogin(login);
    const nombre = `${otro?.primer_nombre ?? ''} ${otro?.primer_apellido ?? ''}`.trim();
    return nombre || 'otro publicador';
  }

  private formatHoraAmPm(hora: string): string {
    const match = /^(\d{1,2}):(\d{2})/.exec(hora ?? '');
    if (!match) {
      return hora;
    }
    const horas = Number(match[1]);
    const minutos = match[2];
    const periodo = horas >= 12 ? 'pm' : 'am';
    const horas12 = horas % 12 === 0 ? 12 : horas % 12;
    return `${String(horas12).padStart(2, '0')}:${minutos} ${periodo}`;
  }

  private formatFechaLarga(fechaIso: string): string {
    const [anio, mes, dia] = fechaIso.split('-').map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      fecha,
    );
  }

  /** El "grupo" (todos los turnos del mismo punto) ya viene cargado completo desde
   * findByCodigoPunto, así que la pareja se resuelve en memoria sin consultas extra. */
  private toResumen(turno: TurnoConSexo, grupo: TurnoConSexo[]): TurnoResumen {
    let disponibilidad: TurnoDisponibilidad = 'disponible';

    if (turno.id_publicador) {
      disponibilidad = 'ocupado';
    } else {
      const pareja = grupo.find(
        (otro) =>
          otro.id !== turno.id &&
          otro.dia_numero === turno.dia_numero &&
          otro.hora_inicio === turno.hora_inicio &&
          otro.hora_fin === turno.hora_fin,
      );
      const sexoPareja = pareja?.id_publicador ? (pareja.publicadores?.sexo ?? null) : null;
      if (sexoPareja === 'M') {
        disponibilidad = 'disponible_hermano';
      } else if (sexoPareja === 'F') {
        disponibilidad = 'disponible_hermana';
      }
    }

    return {
      id: turno.id,
      codigo_punto: turno.codigo_punto,
      dia_numero: turno.dia_numero,
      dia_nombre: turno.dia_nombre,
      hora_inicio: turno.hora_inicio,
      hora_fin: turno.hora_fin,
      id_publicador: turno.id_publicador,
      sexo_ocupante: turno.publicadores?.sexo ?? null,
      disponibilidad,
    };
  }

  private mensajeAprobado(primerNombre: string, encargado: string | null, movil: string | null): string {
    return (
      `¡${primerNombre}, felicitaciones! Te confirmamos que tu solicitud ha sido aprobada a partir de este momento. ` +
      `Te agradecemos ponerte en contacto con el hermano ${encargado ?? 'encargado del punto'}, quien está encargado ` +
      `de este punto, al cual podrás contactar al número ${movil ?? 'registrado en el punto'}. Deseamos que Jehová ` +
      `siga bendiciendo tu excelente disposición de servicio.`
    );
  }

  private mensajePendiente(primerNombre: string): string {
    return (
      `${primerNombre}, tu solicitud ha sido enviada. En los próximos días estarás recibiendo una respuesta a tu ` +
      `número de WhatsApp que te indicará si tu solicitud ha sido aprobada o rechazada. Deseamos que Jehová siga ` +
      `bendiciendo tu excelente disposición de servicio.`
    );
  }

  /** Describe en lenguaje de negocio la regla de aprobación automática que se
   * incumple, para que quien valide el caso en "Casos por validar" entienda el
   * conflicto sin tener que interpretar código. Hoy la única regla automática es
   * la de sexo (el otro cupo del mismo punto+día+hora ya lo ocupa el sexo contrario). */
  private describirSituacionIdentificada(sexoPareja: string | null, sexoPublicador: string | null): string {
    const esperado = sexoPareja === 'M' ? 'un hermano' : 'una hermana';
    const solicitante = sexoPublicador === 'M' ? 'un hermano' : 'una hermana';
    return `El turno debe ser solicitado por ${esperado}, pero lo está solicitando ${solicitante}.`;
  }

  private mensajeAdvertencia(primerNombre: string, sexoPareja: string | null): string {
    const esHombre = sexoPareja === 'M';
    const companero = esHombre ? 'un hermano' : 'una hermana';
    const parentesco = esHombre ? 'prometido' : 'prometida';
    return (
      `${primerNombre}, debido a que el otro publicador que ya está trabajando en este turno es ${companero}, no ` +
      `deberías tomar este turno, a menos que sea tu familiar, tu cónyuge o tu ${parentesco}. Solo si se cumple ` +
      `alguna de las condiciones indicadas debes seguir adelante; de lo contrario, tu solicitud será rechazada.`
    );
  }
}
