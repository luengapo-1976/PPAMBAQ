import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

const SELECT_COLUMNS =
  'codigo_congregacion, nombre_congregacion, codigo_circuito, codigo_municipio, codigo_departamento, correo_congregacion, usuario_registra, fecha_registro, usuario_modifica, fecha_modificacion';

@Injectable()
export class CongregacionesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('congregaciones')
      .select(SELECT_COLUMNS)
      .order('nombre_congregacion', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el listado de congregaciones.');
    }

    return data;
  }

  async create(payload: TablesInsert<'congregaciones'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('congregaciones')
      .insert(payload)
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear la congregación.');
    }

    return data;
  }

  async update(codigo: number, payload: TablesUpdate<'congregaciones'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('congregaciones')
      .update(payload)
      .eq('codigo_congregacion', codigo)
      .select(SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar la congregación.');
    }

    if (!data) {
      throw new NotFoundException('La congregación indicada no existe.');
    }

    return data;
  }
}
