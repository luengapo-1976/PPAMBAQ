import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TurnosRepository,
  TurnoConSexo,
  TurnoValidacion,
  TurnoSolicitadoHistorial,
  TurnoApRechazHistorial,
} from './turnos.repository';
import { PublicadoresRepository } from '../publicadores/publicadores.repository';
import { PuntosRepository } from '../puntos/puntos.repository';
import { SolicitarTurnoDto } from './dto/solicitar-turno.dto';
import { DevolverTurnoDto } from './dto/devolver-turno.dto';
import { ReportarActividadDto } from './dto/reportar-actividad.dto';
import { AprobarSolicitudDto } from './dto/aprobar-solicitud.dto';
import { RechazarSolicitudDto } from './dto/rechazar-solicitud.dto';
import { CrearTurnoDto } from './dto/crear-turno.dto';
import { ActualizarEstadoTurnoDto } from './dto/actualizar-estado-turno.dto';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { todayIsoDateBogota } from '../common/audit/audit.util';

const ESTADO_APROBADO = 'APROBADO';
const ESTADO_PENDIENTE = 'PENDIENTE';
const ESTADO_RECHAZADO = 'RECHAZADO';
const ESTADO_DEVUELTO = 'DEVUELTO POR EL PUBLICADOR';
const TURNO_TOMADO_MESSAGE =
  'Este turno ya fue tomado por otro publicador. Elige otro horario disponible.';
const MAX_TURNOS_POR_PUBLICADOR = 3;
const LIMITE_TURNOS_MESSAGE =
  'No puedes solicitar más turnos. Debes liberar al menos 1.';

const ESTADO_TURNO_ACTIVO = 'ACTIVO';
const TURNO_NO_HABILITADO_MESSAGE =
  'Este horario no está habilitado actualmente. Elige otro horario disponible.';
const TURNO_INACTIVO_ACTIVIDAD_MESSAGE =
  'Este horario no está activo actualmente, por lo que no se puede reportar actividad sobre él.';

/** Convención confirmada: Lunes = 1 ... Domingo = 7, usada al crear un horario nuevo
 * desde "Habilitar nuevo horario" en el calendario de Puntos. */
const DIA_NUMERO_POR_NOMBRE: Record<string, number> = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
  Domingo: 7,
};

/** Un turno sin estado_turno guardado (dato heredado antes de existir la columna) se
 * trata como activo, para no ocultar horarios existentes por una migración a medias. */
function esTurnoActivo(estadoTurno: string | null | undefined): boolean {
  return estadoTurno !== 'INACTIVO';
}

export interface MiTurnoResumen {
  id: string;
  nombrePunto: string;
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
  estadoSolicitud: string | null;
  estadoTurno: string | null;
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
  primerNombrePublicador: string;
  movil: string | null;
  fechaNacimiento: string | null;
  justificacion: string | null;
  nombreConyuge: string | null;
  fechaSolicitud: string | null;
  aprobadoPor: string | null;
  justificacionAprobacion: string | null;
  fechaAprobacion: string | null;
  /** Quien actualmente ocupa el cupo pareja (mismo punto+día+hora), consultado en el
   * momento de listar — puede haber cambiado desde que se hizo la solicitud. Solo se
   * calcula para los casos pendientes de revisión. */
  parejaNombre: string | null;
  parejaMovil: string | null;
}

export type TurnoHistorialTipo = 'solicitado' | 'rechazado' | 'devuelto';

export interface TurnoHistorialItem {
  tipo: TurnoHistorialTipo;
  fecha: string | null;
  nombrePunto: string;
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
  justificacion: string | null;
  motivo: string | null;
  observacion: string | null;
}

export interface ActividadHistorialItem {
  fechaActividad: string;
  cumplioTurno: string | null;
  inicioConversacion: string | null;
  arreglosCurso: string | null;
  observaciones: string | null;
  registradoPor: string;
}

export type TurnoDisponibilidad =
  'ocupado' | 'disponible' | 'disponible_hermano' | 'disponible_hermana';

export interface TurnoResumen {
  id: string;
  codigo_punto: number;
  dia_numero: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  id_publicador: string | null;
  estado_turno: string | null;
  sexo_ocupante: string | null;
  disponibilidad: TurnoDisponibilidad;
  /** Solo se completan cuando quien consulta es administrador o es el encargado de este
   * punto (comparando su propio móvil con el móvil registrado del punto) — para el resto
   * de usuarios quedan en null y la vista solo muestra el sexo de quien ocupa el turno. */
  nombreOcupante: string | null;
  movilOcupante: string | null;
  congregacionOcupante: string | null;
}

export type SolicitarTurnoOutcome =
  'aprobado' | 'requiere_justificacion' | 'pendiente';

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

  async findByCodigoPunto(
    codigoPunto: number,
    user: AuthenticatedUser,
  ): Promise<TurnoResumen[]> {
    const turnos = await this.turnosRepository.findByCodigoPunto(codigoPunto);
    const mostrarOcupante = await this.puedeVerOcupante(codigoPunto, user);
    return turnos.map((turno) =>
      this.toResumen(turno, turnos, mostrarOcupante),
    );
  }

  /** Admin: siempre puede ver quién ocupa un turno. Participante: solo si es el
   * encargado de este punto — se determina comparando su propio móvil (el de su
   * registro de publicador) con el móvil de contacto guardado en el punto, ya que
   * "encargado" es un dato de texto libre sin vínculo directo a una cuenta. */
  private async puedeVerOcupante(
    codigoPunto: number,
    user: AuthenticatedUser,
  ): Promise<boolean> {
    if (user.rol === 'Administrador') {
      return true;
    }
    if (!user.publicadorId) {
      return false;
    }
    const [punto, publicador] = await Promise.all([
      this.puntosRepository.findByCodigo(codigoPunto),
      this.publicadoresRepository.findById(user.publicadorId),
    ]);
    return (
      !!punto?.movil && !!publicador?.movil && punto.movil === publicador.movil
    );
  }

  /** "Habilitar nuevo horario" en el calendario de Puntos: crea dos cupos nuevos,
   * libres y activos, para un punto/día/hora (cada horario disponible tiene dos
   * cupos, uno por cada integrante de la pareja). Sin gestión de roles en el
   * backend (misma convención del resto de la app): la restricción a Administrador
   * es solo de frontend. */
  async crearTurno(
    dto: CrearTurnoDto,
    user: AuthenticatedUser,
  ): Promise<{ mensaje: string }> {
    if (dto.hora_fin <= dto.hora_inicio) {
      throw new BadRequestException(
        'La hora de finalización debe ser posterior a la hora de inicio.',
      );
    }

    const hoy = todayIsoDateBogota();
    const payload = {
      codigo_punto: dto.codigo_punto,
      dia_nombre: dto.dia_nombre,
      dia_numero: DIA_NUMERO_POR_NOMBRE[dto.dia_nombre],
      hora_inicio: dto.hora_inicio,
      hora_fin: dto.hora_fin,
      estado_turno: ESTADO_TURNO_ACTIVO,
      id_publicador: null,
      usuario_registra: user.login,
      fecha_registro: hoy,
    };
    await Promise.all([
      this.turnosRepository.crear(payload),
      this.turnosRepository.crear(payload),
    ]);

    return { mensaje: 'El horario fue creado correctamente.' };
  }

  /** Activa o inactiva un horario existente desde el calendario de Puntos. Un horario
   * inactivo deja de ser visible/solicitable para los publicadores (Solicitar turno,
   * Asignar turno) y deja de admitir nuevos reportes de actividad, pero no afecta a
   * quien ya lo tenga asignado: Devolver/Retirar turno siguen funcionando igual. */
  async actualizarEstadoTurno(
    turnoId: string,
    dto: ActualizarEstadoTurnoDto,
    user: AuthenticatedUser,
  ): Promise<{ mensaje: string }> {
    const actualizado = await this.turnosRepository.actualizarEstado(turnoId, {
      estado_turno: dto.estado_turno,
      usuario_modifica: user.login,
      fecha_modificacion: todayIsoDateBogota(),
    });
    if (!actualizado) {
      throw new NotFoundException('El horario indicado no existe.');
    }

    return {
      mensaje:
        dto.estado_turno === ESTADO_TURNO_ACTIVO
          ? 'El horario fue activado correctamente.'
          : 'El horario fue inactivado correctamente.',
    };
  }

  /** idPublicadorOverride lo usan las páginas administrativas (Editar solicitud,
   * Retirar turno, Informe de turno) para consultar los turnos de un publicador
   * elegido, en vez de los del usuario logueado. */
  async contarSolicitadosPorUsuario(
    user: AuthenticatedUser,
    idPublicadorOverride?: string,
  ): Promise<ConteoTurnosPublicador> {
    const publicadorId = idPublicadorOverride ?? user.publicadorId;
    if (!publicadorId) {
      throw new ForbiddenException(
        'Debes ingresar como participante para consultar tus turnos.',
      );
    }
    const misTurnos =
      await this.turnosRepository.findByPublicador(publicadorId);
    return {
      solicitados: misTurnos.length,
      maximo: MAX_TURNOS_POR_PUBLICADOR,
      turnos: misTurnos.map((turno) => ({
        id: turno.id,
        nombrePunto: turno.puntos?.nombre_punto ?? 'Punto sin nombre',
        diaNombre: turno.dia_nombre,
        horaInicio: turno.hora_inicio,
        horaFin: turno.hora_fin,
        estadoSolicitud: turno.estado_solicitud,
        estadoTurno: turno.estado_turno,
      })),
    };
  }

  /** dto.id_publicador lo usa la página administrativa "Asignar turno" para
   * solicitar en nombre de un publicador elegido, distinto de quien hace la
   * petición. Toda la lógica siguiente (sexo, límite de 3, etc.) aplica igual
   * sobre ese publicador, sin distinción entre flujo propio o administrativo. */
  async solicitar(
    turnoId: string,
    dto: SolicitarTurnoDto,
    user: AuthenticatedUser,
  ): Promise<SolicitarTurnoResultado> {
    const publicadorId = dto.id_publicador ?? user.publicadorId;
    if (!publicadorId) {
      throw new ForbiddenException(
        'Debes ingresar como participante para solicitar un turno.',
      );
    }

    const publicador = await this.publicadoresRepository.findById(publicadorId);
    if (!publicador) {
      throw new NotFoundException(
        'No se encontró el registro del publicador indicado.',
      );
    }
    if (!publicador.sexo) {
      throw new BadRequestException(
        'Debes completar el campo "Sexo" en Actualizar datos antes de poder solicitar un turno.',
      );
    }

    const misTurnos = await this.turnosRepository.findByPublicador(
      publicador.id,
    );
    if (misTurnos.length >= MAX_TURNOS_POR_PUBLICADOR) {
      throw new ForbiddenException(LIMITE_TURNOS_MESSAGE);
    }

    const turno = await this.turnosRepository.findById(turnoId);
    if (!turno) {
      throw new NotFoundException('El turno indicado no existe.');
    }
    if (!esTurnoActivo(turno.estado_turno)) {
      throw new ConflictException(TURNO_NO_HABILITADO_MESSAGE);
    }
    if (turno.id_publicador) {
      throw new ConflictException(TURNO_TOMADO_MESSAGE);
    }

    const punto = await this.puntosRepository.findByCodigo(turno.codigo_punto);
    if (!punto) {
      throw new NotFoundException(
        'No se encontró el punto correspondiente a este turno.',
      );
    }

    const pareja = await this.turnosRepository.findPareja(
      turno.codigo_punto,
      turno.dia_numero,
      turno.hora_inicio,
      turno.hora_fin,
      turno.id,
    );
    const sexoPareja = pareja?.id_publicador
      ? (pareja.publicadores?.sexo ?? null)
      : null;
    const nombrePareja = pareja?.id_publicador
      ? [
          pareja.publicadores?.primer_nombre,
          pareja.publicadores?.segundo_nombre,
          pareja.publicadores?.primer_apellido,
          pareja.publicadores?.segundo_apellido,
        ]
          .filter(
            (parte): parte is string => !!parte && parte.trim().length > 0,
          )
          .join(' ') || null
      : null;
    const primerNombre = publicador.primer_nombre?.trim() || 'Publicador';
    const hayConflictoDeSexo =
      sexoPareja !== null && sexoPareja !== publicador.sexo;

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
        mensaje: this.mensajeAprobado(
          primerNombre,
          punto.encargado,
          punto.movil,
        ),
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
      situacion_identificada: this.describirSituacionIdentificada(
        sexoPareja,
        publicador.sexo,
        nombrePareja,
      ),
      /** Se guarda aparte de situacion_identificada (que es texto libre) para poder
       * mostrarlo como dato estructurado en "Casos por validar": quién tenía asignado el
       * turno pareja al momento de esta solicitud, incluso si esa persona luego devuelve
       * o le rechazan su propio turno. */
      pareja_nombre: nombrePareja,
      pareja_movil: pareja?.publicadores?.movil ?? null,
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

  /** dto.id_publicador lo usa la página administrativa "Retirar turno" para
   * devolver el turno de un publicador elegido, distinto de quien hace la
   * petición. */
  async devolver(
    turnoId: string,
    dto: DevolverTurnoDto,
    user: AuthenticatedUser,
  ): Promise<{ mensaje: string }> {
    const publicadorId = dto.id_publicador ?? user.publicadorId;
    if (!publicadorId) {
      throw new ForbiddenException(
        'Debes ingresar como participante para devolver un turno.',
      );
    }

    const publicador = await this.publicadoresRepository.findById(publicadorId);
    if (!publicador) {
      throw new NotFoundException(
        'No se encontró el registro del publicador indicado.',
      );
    }

    const turno = await this.turnosRepository.findById(turnoId);
    if (!turno || turno.id_publicador !== publicador.id) {
      throw new NotFoundException('Este turno no está asignado a tu registro.');
    }

    const motivo =
      dto.motivo === 'Otro' ? `Otro: ${dto.motivoOtro!.trim()}` : dto.motivo;
    const hoy = todayIsoDateBogota();

    /** Se libera el turno primero: si algo falla después al registrar el histórico,
     * es preferible que el turno haya quedado libre (aunque se pierda el registro de
     * "por qué") a que quede tomado indefinidamente mientras el histórico sí quedó. */
    const liberado = await this.turnosRepository.liberarSiEsDelPublicador(
      turnoId,
      publicador.id,
      {
        id_publicador: null,
        estado_solicitud: null,
        observaciones: null,
        justificacion: null,
        usuario_modifica: user.login,
        fecha_modificacion: hoy,
      },
    );
    if (!liberado) {
      throw new ConflictException(
        'Este turno ya no está asignado a tu registro.',
      );
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

    /** Misma lógica de auditoría que aprobar/rechazar en Casos por validar: queda un
     * registro de la solicitud devuelta en turnos_apro_rechaz, sin importar si quien
     * devuelve es el propio publicador o un administrador desde "Retirar turno". */
    await this.turnosRepository.registrarApRechaz({
      codigo_punto: turno.codigo_punto,
      dia_numero: turno.dia_numero,
      dia_nombre: turno.dia_nombre,
      hora_inicio: turno.hora_inicio,
      hora_fin: turno.hora_fin,
      id_publicador: publicador.id,
      observaciones: turno.observaciones,
      usuario_registra: turno.usuario_registra,
      fecha_registro: turno.fecha_registro,
      usuario_modifica: turno.usuario_modifica,
      fecha_modificacion: turno.fecha_modificacion,
      estado_solicitud: ESTADO_DEVUELTO,
      justificacion: motivo,
      /** Se preserva aparte, porque el campo "justificacion" de arriba ya se usa para el
       * motivo de la devolución: si el turno había sido un caso de revisión (conflicto de
       * sexo), aquí queda la justificación original de esa solicitud. */
      justificacion_solicitud: turno.justificacion,
      situacion_identificada: turno.situacion_identificada,
      pareja_nombre: turno.pareja_nombre,
      pareja_movil: turno.pareja_movil,
      aprobado_por: user.login,
      fecha_aprobacion: hoy,
      justificacion_aprobacion: dto.observaciones?.trim() || null,
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
    idPublicadorOverride?: string,
  ): Promise<{ disponible: boolean; mensaje?: string }> {
    const { publicador, turno } = await this.cargarTurnoDe(
      turnoId,
      idPublicadorOverride ?? user.publicadorId,
      'consultar la disponibilidad de esta fecha',
    );
    if (!esTurnoActivo(turno.estado_turno)) {
      throw new BadRequestException(TURNO_INACTIVO_ACTIVIDAD_MESSAGE);
    }
    this.validarFechaNoFutura(fechaActividad);
    this.validarDiaSemana(turno, fechaActividad);

    const conflicto = await this.buscarConflictoActividad(
      turno,
      fechaActividad,
    );
    if (!conflicto) {
      return { disponible: true };
    }

    return {
      disponible: false,
      mensaje: await this.mensajeActividadDuplicada(
        publicador,
        turno,
        fechaActividad,
        conflicto.usuario_registra,
      ),
    };
  }

  async reportarActividad(
    turnoId: string,
    dto: ReportarActividadDto,
    user: AuthenticatedUser,
  ): Promise<{ mensaje: string }> {
    const { publicador, turno } = await this.cargarTurnoDe(
      turnoId,
      dto.id_publicador ?? user.publicadorId,
      'reportar actividad de este turno',
    );
    if (!esTurnoActivo(turno.estado_turno)) {
      throw new BadRequestException(TURNO_INACTIVO_ACTIVIDAD_MESSAGE);
    }
    this.validarFechaNoFutura(dto.fechaActividad);
    this.validarDiaSemana(turno, dto.fechaActividad);

    const conflicto = await this.buscarConflictoActividad(
      turno,
      dto.fechaActividad,
    );
    if (conflicto) {
      throw new ConflictException(
        await this.mensajeActividadDuplicada(
          publicador,
          turno,
          dto.fechaActividad,
          conflicto.usuario_registra,
        ),
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
  async historialActividad(
    turnoId: string,
    user: AuthenticatedUser,
    idPublicadorOverride?: string,
  ): Promise<ActividadHistorialItem[]> {
    const { turno } = await this.cargarTurnoDe(
      turnoId,
      idPublicadorOverride ?? user.publicadorId,
      'consultar el histórico de este turno',
    );

    const turnoIds = await this.turnosRepository.findIdsPorPuntoDiaHora(
      turno.codigo_punto,
      turno.dia_nombre,
      turno.hora_inicio,
      turno.hora_fin,
    );
    if (turnoIds.length === 0) {
      return [];
    }

    const actividades =
      await this.turnosRepository.findActividadesPorTurnos(turnoIds);
    if (actividades.length === 0) {
      return [];
    }

    const logins = [
      ...new Set(
        actividades
          .map((a) => a.usuario_registra)
          .filter((login): login is string => !!login),
      ),
    ];
    const publicadoresPorLogin = new Map(
      (await this.publicadoresRepository.findNombresByLogins(logins)).map(
        (p) => [p.login, p],
      ),
    );

    return actividades.map((actividad) => {
      const registrador = actividad.usuario_registra
        ? publicadoresPorLogin.get(actividad.usuario_registra)
        : null;
      const nombre =
        `${registrador?.primer_nombre ?? ''} ${registrador?.primer_apellido ?? ''}`.trim();
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
   * administrador los revise en "Casos por validar". Para cada uno se consulta,
   * en el momento de listar, quién ocupa actualmente el cupo pareja (mismo
   * punto+día+hora) — puede haber cambiado desde que se solicitó el turno. */
  async pendientesValidacion(): Promise<TurnoValidacionResumen[]> {
    const rows = await this.turnosRepository.findPendientesValidacion();
    return Promise.all(
      rows.map(async (row) => {
        const pareja = await this.turnosRepository.findPareja(
          row.codigo_punto,
          row.dia_numero,
          row.hora_inicio,
          row.hora_fin,
          row.id,
        );
        return this.toValidacionResumen(row, pareja);
      }),
    );
  }

  /** Histórico de casos que pasaron por revisión manual (no todo turno "APROBADO",
   * solo los que tienen aprobado_por). */
  async aprobadosValidacion(): Promise<TurnoValidacionResumen[]> {
    const rows = await this.turnosRepository.findAprobadosValidacion();
    return rows.map((row) => this.toValidacionResumen(row));
  }

  /** Histórico de casos rechazados manualmente. */
  async rechazadosValidacion(): Promise<TurnoValidacionResumen[]> {
    const rows = await this.turnosRepository.findRechazadosValidacion();
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

    /** Además de quedar aprobado en turnos, se guarda una copia del registro (ya
     * actualizado) en turnos_apro_rechaz, para tener un histórico centralizado de
     * las decisiones tomadas en Casos por validar. */
    await this.turnosRepository.registrarApRechaz({
      codigo_punto: aprobado.codigo_punto,
      dia_numero: aprobado.dia_numero,
      dia_nombre: aprobado.dia_nombre,
      hora_inicio: aprobado.hora_inicio,
      hora_fin: aprobado.hora_fin,
      id_publicador: aprobado.id_publicador,
      observaciones: aprobado.observaciones,
      usuario_registra: aprobado.usuario_registra,
      fecha_registro: aprobado.fecha_registro,
      usuario_modifica: aprobado.usuario_modifica,
      fecha_modificacion: aprobado.fecha_modificacion,
      estado_solicitud: aprobado.estado_solicitud,
      justificacion: aprobado.justificacion,
      situacion_identificada: aprobado.situacion_identificada,
      pareja_nombre: aprobado.pareja_nombre,
      pareja_movil: aprobado.pareja_movil,
      aprobado_por: aprobado.aprobado_por,
      fecha_aprobacion: aprobado.fecha_aprobacion,
      justificacion_aprobacion: aprobado.justificacion_aprobacion,
    });

    return { mensaje: 'La solicitud fue aprobada correctamente.' };
  }

  async rechazarSolicitudPendiente(
    turnoId: string,
    dto: RechazarSolicitudDto,
    user: AuthenticatedUser,
  ): Promise<{ mensaje: string }> {
    const turno = await this.turnosRepository.findById(turnoId);
    if (!turno || turno.estado_solicitud !== ESTADO_PENDIENTE) {
      throw new ConflictException('Esta solicitud ya fue procesada.');
    }

    const hoy = todayIsoDateBogota();

    /** A diferencia de aprobar, un turno rechazado no se queda marcado como RECHAZADO en
     * turnos: se libera (misma lógica que una devolución), para que vuelva a estar
     * disponible. El histórico de la decisión queda en turnos_apro_rechaz, usando los
     * datos del turno tal como estaban antes de liberarlo. */
    const liberado = await this.turnosRepository.rechazarSolicitud(turnoId, {
      id_publicador: null,
      estado_solicitud: null,
      observaciones: null,
      justificacion: null,
      usuario_modifica: user.login,
      fecha_modificacion: hoy,
    });
    if (!liberado) {
      throw new ConflictException('Esta solicitud ya fue procesada.');
    }

    await this.turnosRepository.registrarApRechaz({
      codigo_punto: turno.codigo_punto,
      dia_numero: turno.dia_numero,
      dia_nombre: turno.dia_nombre,
      hora_inicio: turno.hora_inicio,
      hora_fin: turno.hora_fin,
      id_publicador: turno.id_publicador,
      observaciones: turno.observaciones,
      usuario_registra: turno.usuario_registra,
      fecha_registro: turno.fecha_registro,
      usuario_modifica: turno.usuario_modifica,
      fecha_modificacion: turno.fecha_modificacion,
      estado_solicitud: ESTADO_RECHAZADO,
      justificacion: turno.justificacion,
      situacion_identificada: turno.situacion_identificada,
      pareja_nombre: turno.pareja_nombre,
      pareja_movil: turno.pareja_movil,
      aprobado_por: user.login,
      fecha_aprobacion: hoy,
      justificacion_aprobacion: dto.justificacion.trim(),
    });

    return { mensaje: 'La solicitud fue rechazada correctamente.' };
  }

  /** Línea de tiempo de "Editar solicitud": combina los turnos que el publicador tiene
   * actualmente asignados/pendientes (tabla turnos) con el histórico de rechazos y
   * devoluciones (tabla turnos_apro_rechaz), reconstruyendo hasta 2 eventos por turno
   * procesado ("Solicitado" + su desenlace). Un turno rechazado o devuelto no aparece en
   * turnos (quedó libre), por eso ambas fuentes son necesarias para el historial completo. */
  async historialSolicitudesPublicador(
    publicadorId: string | null | undefined,
  ): Promise<TurnoHistorialItem[]> {
    if (!publicadorId) {
      throw new ForbiddenException(
        'Debes ingresar como participante para consultar este historial.',
      );
    }

    const [solicitados, procesados] = await Promise.all([
      this.turnosRepository.findSolicitadosPorPublicador(publicadorId),
      this.turnosRepository.findApRechazPorPublicador(publicadorId),
    ]);

    const items: TurnoHistorialItem[] = solicitados.map(
      (turno: TurnoSolicitadoHistorial) => ({
        tipo: 'solicitado',
        fecha: turno.fecha_modificacion,
        nombrePunto: turno.puntos?.nombre_punto ?? 'Punto sin nombre',
        diaNombre: turno.dia_nombre,
        horaInicio: turno.hora_inicio,
        horaFin: turno.hora_fin,
        justificacion: turno.justificacion,
        motivo: null,
        observacion: null,
      }),
    );

    for (const registro of procesados as TurnoApRechazHistorial[]) {
      const nombrePunto = registro.puntos?.nombre_punto ?? 'Punto sin nombre';
      const esRechazado = registro.estado_solicitud === ESTADO_RECHAZADO;

      items.push({
        tipo: 'solicitado',
        fecha: registro.fecha_modificacion,
        nombrePunto,
        diaNombre: registro.dia_nombre,
        horaInicio: registro.hora_inicio,
        horaFin: registro.hora_fin,
        /** Para las devoluciones, la columna "justificacion" guarda el motivo de la
         * devolución (no sirve aquí); la justificación original de la solicitud, si
         * existió, se preservó aparte en justificacion_solicitud. */
        justificacion: esRechazado
          ? registro.justificacion
          : registro.justificacion_solicitud,
        motivo: null,
        observacion: null,
      });

      items.push(
        esRechazado
          ? {
              tipo: 'rechazado',
              fecha: registro.fecha_aprobacion,
              nombrePunto,
              diaNombre: registro.dia_nombre,
              horaInicio: registro.hora_inicio,
              horaFin: registro.hora_fin,
              justificacion: registro.justificacion_aprobacion,
              motivo: null,
              observacion: null,
            }
          : {
              tipo: 'devuelto',
              fecha: registro.fecha_aprobacion,
              nombrePunto,
              diaNombre: registro.dia_nombre,
              horaInicio: registro.hora_inicio,
              horaFin: registro.hora_fin,
              justificacion: null,
              motivo: registro.justificacion,
              observacion: registro.justificacion_aprobacion,
            },
      );
    }

    return items.sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
  }

  private toValidacionResumen(
    turno: TurnoValidacion,
    pareja?: TurnoConSexo | null,
  ): TurnoValidacionResumen {
    const publicador = turno.publicadores;
    const nombrePublicador =
      [
        publicador?.primer_nombre,
        publicador?.segundo_nombre,
        publicador?.primer_apellido,
        publicador?.segundo_apellido,
      ]
        .filter((parte): parte is string => !!parte && parte.trim().length > 0)
        .join(' ') || 'Publicador';
    /** Solo se muestra el nombre del cónyuge cuando quien solicita es mujer y su
     * estado civil es "Casada" — para cualquier otro caso el dato es irrelevante
     * para la revisión del caso, aunque exista en el registro. */
    const mostrarConyuge =
      publicador?.sexo === 'F' && publicador?.estado_civil === 'Casado';

    /** "pareja" solo se pasa desde pendientesValidacion (consulta en vivo, quién ocupa el
     * cupo pareja ahora mismo). Para aprobados/rechazados no se pasa (queda undefined) y se
     * usa en su lugar el dato guardado en el propio turno al momento de la solicitud —
     * "quién lo tenía asignado entonces", que puede ya no coincidir con quién lo ocupa hoy. */
    let parejaNombre: string | null;
    let parejaMovil: string | null;
    if (pareja !== undefined) {
      const parejaPublicador = pareja?.id_publicador
        ? pareja.publicadores
        : null;
      parejaNombre = parejaPublicador
        ? [
            parejaPublicador.primer_nombre,
            parejaPublicador.segundo_nombre,
            parejaPublicador.primer_apellido,
            parejaPublicador.segundo_apellido,
          ]
            .filter(
              (parte): parte is string => !!parte && parte.trim().length > 0,
            )
            .join(' ') || null
        : null;
      parejaMovil = parejaPublicador?.movil ?? null;
    } else {
      parejaNombre = turno.pareja_nombre;
      parejaMovil = turno.pareja_movil;
    }

    return {
      id: turno.id,
      nombrePunto: turno.puntos?.nombre_punto ?? 'Punto sin nombre',
      diaNombre: turno.dia_nombre,
      horaInicio: turno.hora_inicio,
      horaFin: turno.hora_fin,
      situacionIdentificada: turno.situacion_identificada,
      nombrePublicador,
      primerNombrePublicador: publicador?.primer_nombre?.trim() || 'Publicador',
      movil: publicador?.movil ?? null,
      fechaNacimiento: publicador?.fecha_nacimiento ?? null,
      justificacion: turno.justificacion,
      nombreConyuge: mostrarConyuge
        ? (publicador?.nombre_conyuge ?? null)
        : null,
      fechaSolicitud: turno.fecha_modificacion,
      aprobadoPor: turno.aprobado_por,
      justificacionAprobacion: turno.justificacion_aprobacion,
      fechaAprobacion: turno.fecha_aprobacion,
      parejaNombre,
      parejaMovil,
    };
  }

  /** publicadorId puede venir del usuario logueado (flujo de participante) o de un
   * override explícito (páginas administrativas que operan en nombre de otro
   * publicador ya elegido por búsqueda). */
  private async cargarTurnoDe(
    turnoId: string,
    publicadorId: string | null | undefined,
    accion: string,
  ) {
    if (!publicadorId) {
      throw new ForbiddenException(
        `Debes ingresar como participante para ${accion}.`,
      );
    }
    const publicador = await this.publicadoresRepository.findById(publicadorId);
    if (!publicador) {
      throw new NotFoundException(
        'No se encontró el registro del publicador indicado.',
      );
    }
    const turno = await this.turnosRepository.findById(turnoId);
    if (!turno || turno.id_publicador !== publicador.id) {
      throw new NotFoundException(
        'Este turno no está asignado a este publicador.',
      );
    }
    return { publicador, turno };
  }

  /** Los dos cupos de un mismo punto+día+hora comparten la misma actividad: basta con
   * que uno de los dos publicadores ya la haya reportado para esa fecha. */
  private async buscarConflictoActividad(
    turno: TurnoConSexo,
    fechaActividad: string,
  ) {
    const pareja = await this.turnosRepository.findPareja(
      turno.codigo_punto,
      turno.dia_numero,
      turno.hora_inicio,
      turno.hora_fin,
      turno.id,
    );
    const turnoIds = pareja ? [turno.id, pareja.id] : [turno.id];
    return this.turnosRepository.findActividadPorTurnosYFecha(
      turnoIds,
      fechaActividad,
    );
  }

  private validarFechaNoFutura(fechaActividad: string): void {
    if (fechaActividad > todayIsoDateBogota()) {
      throw new BadRequestException(
        'La fecha de la actividad no puede ser una fecha futura.',
      );
    }
  }

  /** No hay una columna que registre la convención de dia_numero (0/1-indexado, qué
   * día es el 0, etc.), así que la validación se hace por nombre de día — inequívoco
   * y ya viene guardado en turnos.dia_nombre. */
  private validarDiaSemana(turno: TurnoConSexo, fechaActividad: string): void {
    const DIAS = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
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
    const nombre =
      `${otro?.primer_nombre ?? ''} ${otro?.primer_apellido ?? ''}`.trim();
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
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(fecha);
  }

  /** El "grupo" (todos los turnos del mismo punto) ya viene cargado completo desde
   * findByCodigoPunto, así que la pareja se resuelve en memoria sin consultas extra. */
  private toResumen(
    turno: TurnoConSexo,
    grupo: TurnoConSexo[],
    mostrarOcupante: boolean,
  ): TurnoResumen {
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
      const sexoPareja = pareja?.id_publicador
        ? (pareja.publicadores?.sexo ?? null)
        : null;
      if (sexoPareja === 'M') {
        disponibilidad = 'disponible_hermano';
      } else if (sexoPareja === 'F') {
        disponibilidad = 'disponible_hermana';
      }
    }

    const ocupante =
      mostrarOcupante && turno.id_publicador ? turno.publicadores : null;
    const nombreOcupante = ocupante
      ? [
          ocupante.primer_nombre,
          ocupante.segundo_nombre,
          ocupante.primer_apellido,
          ocupante.segundo_apellido,
        ]
          .filter(
            (parte): parte is string => !!parte && parte.trim().length > 0,
          )
          .join(' ') || null
      : null;

    return {
      id: turno.id,
      codigo_punto: turno.codigo_punto,
      dia_numero: turno.dia_numero,
      dia_nombre: turno.dia_nombre,
      hora_inicio: turno.hora_inicio,
      hora_fin: turno.hora_fin,
      id_publicador: turno.id_publicador,
      estado_turno: turno.estado_turno,
      sexo_ocupante: turno.publicadores?.sexo ?? null,
      disponibilidad,
      nombreOcupante,
      movilOcupante: ocupante?.movil ?? null,
      congregacionOcupante:
        ocupante?.congregaciones?.nombre_congregacion ?? null,
    };
  }

  private mensajeAprobado(
    primerNombre: string,
    encargado: string | null,
    movil: string | null,
  ): string {
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
  private describirSituacionIdentificada(
    sexoPareja: string | null,
    sexoPublicador: string | null,
    nombrePareja: string | null,
  ): string {
    const esperado = sexoPareja === 'M' ? 'un hermano' : 'una hermana';
    const solicitante = sexoPublicador === 'M' ? 'un hermano' : 'una hermana';
    let mensaje = `El turno debe ser solicitado por ${esperado}, pero lo está solicitando ${solicitante}.`;
    if (nombrePareja) {
      mensaje += ` El turno actual está asignado a ${nombrePareja}.`;
    }
    return mensaje;
  }

  private mensajeAdvertencia(
    primerNombre: string,
    sexoPareja: string | null,
  ): string {
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
