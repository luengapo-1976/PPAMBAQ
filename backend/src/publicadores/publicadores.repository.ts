import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

const SELECT_WITH_CONGREGACION = '*, congregaciones(nombre_congregacion, codigo_circuito)';
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
