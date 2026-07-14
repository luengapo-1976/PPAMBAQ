import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

@Injectable()
export class DepartamentosRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('departamentos')
      .select('codigo_departamento, nombre_departamento')
      .order('nombre_departamento', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el listado de departamentos.');
    }

    return data;
  }

  async create(payload: TablesInsert<'departamentos'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('departamentos')
      .insert(payload)
      .select('codigo_departamento, nombre_departamento')
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear el departamento.');
    }

    return data;
  }

  async update(codigo: string, payload: TablesUpdate<'departamentos'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('departamentos')
      .update(payload)
      .eq('codigo_departamento', codigo)
      .select('codigo_departamento, nombre_departamento')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el departamento.');
    }

    if (!data) {
      throw new NotFoundException('El departamento indicado no existe.');
    }

    return data;
  }
}
