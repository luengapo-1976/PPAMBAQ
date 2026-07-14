import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

const SELECT_COLUMNS = 'codigo_municipio, nombre_municipio, codigo_departamento';

@Injectable()
export class MunicipiosRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(codigoDepartamento?: string) {
    let query = this.supabaseService
      .getClient()
      .from('municipios')
      .select(SELECT_COLUMNS)
      .order('nombre_municipio', { ascending: true });

    if (codigoDepartamento) {
      query = query.eq('codigo_departamento', codigoDepartamento);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el listado de municipios.');
    }

    return data;
  }

  async create(payload: TablesInsert<'municipios'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('municipios')
      .insert(payload)
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear el municipio.');
    }

    return data;
  }

  async update(codigo: string, payload: TablesUpdate<'municipios'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('municipios')
      .update(payload)
      .eq('codigo_municipio', codigo)
      .select(SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el municipio.');
    }

    if (!data) {
      throw new NotFoundException('El municipio indicado no existe.');
    }

    return data;
  }
}
