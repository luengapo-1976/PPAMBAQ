import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

const SELECT_WITH_CONGREGACION = '*, congregaciones(nombre_congregacion, codigo_circuito)';
/** Debe coincidir exactamente con el valor que PublicadoresService.solicitarBaja
 * escribe al crear la solicitud (ver estado_solicitud_retiro en insertRetirado). */
const ESTADO_RETIRO_PENDIENTE = 'PENDIENTE VALIDACIÓN';
const RETIRO_COLUMNS =
  'id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, movil, codigo_congregacion, ' +
  'fecha_nacimiento, fecha_bautismo, privilegio_ser, justificacion, fecha_retiro, estado_solicitud_retiro, ' +
  'valida_retiro, observaciones_retiro, fecha_validacion_retiro';

export interface PublicadorRetirado {
  id: string;
  primer_nombre: string | null;
  segundo_nombre: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  movil: string | null;
  codigo_congregacion: number | null;
  fecha_nacimiento: string | null;
  fecha_bautismo: string | null;
  privilegio_ser: string | null;
  justificacion: string;
  fecha_retiro: string | null;
  estado_solicitud_retiro: string | null;
  valida_retiro: string | null;
  observaciones_retiro: string | null;
  fecha_validacion_retiro: string | null;
}
/** Supabase/PostgREST limita cada consulta a un máximo de filas (por defecto 1000),
 * así que hay que paginar con .range() para traer la tabla completa. */
const PAGE_SIZE = 1000;
const AUTH_PROFILE_COLUMNS = 'id, login, movil, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido';

export interface PublicadorAuthProfile {
  id: string;
  login: string | null;
  movil: string | null;
  primer_nombre: string | null;
  segundo_nombre: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
}

@Injectable()
export class PublicadoresRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const rows: Record<string, unknown>[] = [];
    let from = 0;

    for (;;) {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('publicadores')
        .select(SELECT_WITH_CONGREGACION)
        .order('fecha_solicitud', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        throw new InternalServerErrorException('No se pudo obtener el listado de solicitudes.');
      }

      rows.push(...(data as unknown as Record<string, unknown>[]));

      if (!data || data.length < PAGE_SIZE) {
        break;
      }
      from += PAGE_SIZE;
    }

    return rows;
  }

  async create(payload: TablesInsert<'publicadores'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .insert(payload)
      .select(SELECT_WITH_CONGREGACION)
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear la solicitud.');
    }

    return data;
  }

  async update(id: string, payload: TablesUpdate<'publicadores'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .update(payload)
      .eq('id', id)
      .select(SELECT_WITH_CONGREGACION)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar la solicitud.');
    }

    if (!data) {
      throw new NotFoundException('La solicitud indicada no existe.');
    }

    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .select('id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, sexo, movil')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el publicador.');
    }

    return data;
  }

  /** Registro completo (incluida la congregación embebida) para que el propio
   * publicador vea/edite sus datos en "Actualizar mis datos". */
  async findByIdFull(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .select(SELECT_WITH_CONGREGACION)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar tus datos.');
    }

    return data;
  }

  /** Usado para resolver "quién registró esto" a partir de un usuario_registra (login),
   * ej. en el mensaje de conflicto al reportar actividad de un turno. */
  async findByLogin(login: string): Promise<{ primer_nombre: string | null; primer_apellido: string | null } | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .select('primer_nombre, primer_apellido')
      .eq('login', login)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el publicador.');
    }

    return data;
  }

  /** Variante en lote de findByLogin, para resolver "quién registró" varias filas
   * (ej. el histórico de actividad) sin una consulta por fila. */
  async findNombresByLogins(
    logins: string[],
  ): Promise<{ login: string | null; primer_nombre: string | null; primer_apellido: string | null }[]> {
    if (logins.length === 0) {
      return [];
    }
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .select('login, primer_nombre, primer_apellido')
      .in('login', logins);

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar los publicadores.');
    }

    return data ?? [];
  }

  /** Login alterno de participantes: login + móvil (usado como contraseña) deben coincidir. */
  async findByLoginAndMovil(login: string, movil: string): Promise<PublicadorAuthProfile | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .select(AUTH_PROFILE_COLUMNS)
      .eq('login', login)
      .eq('movil', movil)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo validar el usuario.');
    }

    return data;
  }

  /** Cruce por móvil para vincular un usuario (tabla usuarios) con su publicador. */
  async findByMovil(movil: string): Promise<PublicadorAuthProfile | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .select(AUTH_PROFILE_COLUMNS)
      .eq('movil', movil)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo validar el móvil del usuario.');
    }

    return data;
  }

  async existsByLogin(login: string): Promise<boolean> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .select('id')
      .eq('login', login)
      .limit(1);

    if (error) {
      throw new InternalServerErrorException('No se pudo validar el login de la solicitud.');
    }

    return (data?.length ?? 0) > 0;
  }

  async bulkUpdateByIds(ids: string[], payload: TablesUpdate<'publicadores'>) {
    if (ids.length === 0) {
      return;
    }
    const { error } = await this.supabaseService.getClient().from('publicadores').update(payload).in('id', ids);

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el estado de las solicitudes.');
    }
  }

  async findFechaAprobacionByIds(ids: string[]): Promise<{ id: string; fecha_aprobacion: string | null }[]> {
    if (ids.length === 0) {
      return [];
    }
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .select('id, fecha_aprobacion')
      .in('id', ids);

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar las solicitudes seleccionadas.');
    }

    return data ?? [];
  }

  async findUsuarioModificaByIds(ids: string[]): Promise<{ id: string; usuario_modifica: string | null }[]> {
    if (ids.length === 0) {
      return [];
    }
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .select('id, usuario_modifica')
      .in('id', ids);

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar las solicitudes seleccionadas.');
    }

    return data ?? [];
  }

  async insertRetirado(payload: TablesInsert<'publicadores_retirados'>): Promise<void> {
    const { error } = await this.supabaseService.getClient().from('publicadores_retirados').insert(payload);

    if (error) {
      throw new InternalServerErrorException('No se pudo registrar la solicitud de baja.');
    }
  }

  async findRetirosPendientes(): Promise<PublicadorRetirado[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores_retirados')
      .select(RETIRO_COLUMNS)
      .eq('estado_solicitud_retiro', ESTADO_RETIRO_PENDIENTE)
      .order('fecha_retiro', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar las solicitudes de baja pendientes.');
    }

    return (data ?? []) as unknown as PublicadorRetirado[];
  }

  async findRetirosAprobados(): Promise<PublicadorRetirado[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores_retirados')
      .select(RETIRO_COLUMNS)
      .eq('estado_solicitud_retiro', 'APROBADO')
      .order('fecha_validacion_retiro', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el histórico de bajas aprobadas.');
    }

    return (data ?? []) as unknown as PublicadorRetirado[];
  }

  /** Update condicionado a que la solicitud siga pendiente, para evitar aprobarla dos veces. */
  async aprobarRetiro(id: string, payload: TablesUpdate<'publicadores_retirados'>): Promise<boolean> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores_retirados')
      .update(payload)
      .eq('id', id)
      .eq('estado_solicitud_retiro', ESTADO_RETIRO_PENDIENTE)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo aprobar la solicitud de baja.');
    }

    return !!data;
  }

  async bulkUpdateByIdsAndEntrenamiento(
    ids: string[],
    entrenamientoRequerido: string,
    payload: TablesUpdate<'publicadores'>,
  ) {
    if (ids.length === 0) {
      return;
    }
    const { error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .update(payload)
      .in('id', ids)
      .eq('entrenamiento_requerido', entrenamientoRequerido);

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el lugar de entrenamiento de las solicitudes.');
    }
  }
}
