import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesUpdate } from '../supabase/database.types';

export interface ParametroRow {
  id: string;
  clave: string;
  valor: string | null;
  activo: boolean;
  descripcion: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
}

@Injectable()
export class ParametrosRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(): Promise<ParametroRow[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('parametros')
      .select('*')
      .order('clave');

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar los parámetros.');
    }

    return data ?? [];
  }

  async findByClave(clave: string): Promise<ParametroRow | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('parametros')
      .select('*')
      .eq('clave', clave)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el parámetro.');
    }

    return data;
  }

  async updateByClave(
    clave: string,
    payload: TablesUpdate<'parametros'>,
  ): Promise<ParametroRow | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('parametros')
      .update(payload)
      .eq('clave', clave)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el parámetro.');
    }

    return data;
  }
}
