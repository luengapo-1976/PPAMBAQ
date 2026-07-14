import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

const SELECT_WITH_CONGREGACION = '*, congregaciones(nombre_congregacion, codigo_circuito)';
/** Supabase/PostgREST limita cada consulta a un máximo de filas (por defecto 1000),
 * así que hay que paginar con .range() para traer la tabla completa. */
const PAGE_SIZE = 1000;

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

  async findEstadoByIds(ids: string[]) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .select('id, estado')
      .in('id', ids);

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el estado de las solicitudes.');
    }

    return data;
  }

  async bulkUpdateByIds(ids: string[], estadoActual: string, payload: TablesUpdate<'publicadores'>) {
    if (ids.length === 0) {
      return;
    }
    const { error } = await this.supabaseService
      .getClient()
      .from('publicadores')
      .update(payload)
      .eq('estado', estadoActual)
      .in('id', ids);

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el estado de las solicitudes.');
    }
  }
}
