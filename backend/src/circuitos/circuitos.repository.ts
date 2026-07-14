import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

@Injectable()
export class CircuitosRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('circuitos')
      .select('*')
      .order('codigo_circuito', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el listado de circuitos.');
    }

    return data;
  }

  async create(payload: TablesInsert<'circuitos'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('circuitos')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear el circuito.');
    }

    return data;
  }

  async update(codigo: string, payload: TablesUpdate<'circuitos'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('circuitos')
      .update(payload)
      .eq('codigo_circuito', codigo)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el circuito.');
    }

    if (!data) {
      throw new NotFoundException('El circuito indicado no existe.');
    }

    return data;
  }
}
