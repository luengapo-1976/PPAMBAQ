import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TurnosRepository, TurnoConSexo } from './turnos.repository';
import { PublicadoresRepository } from '../publicadores/publicadores.repository';
import { PuntosRepository } from '../puntos/puntos.repository';
import { SolicitarTurnoDto } from './dto/solicitar-turno.dto';
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
