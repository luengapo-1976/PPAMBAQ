import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

export interface TextoLegalRow {
  id: string;
  tipo: string;
  version: string;
  contenido: string;
  activo: boolean;
  usuario_registra: string | null;
  fecha_registro: string | null;
}

@Injectable()
export class TextosLegalesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAllByTipo(tipo: string): Promise<TextoLegalRow[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('textos_legales')
      .select('*')
      .eq('tipo', tipo)
      .order('fecha_registro', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar los textos legales.');
    }

    return data ?? [];
  }

  async findActivoByTipo(tipo: string): Promise<TextoLegalRow | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('textos_legales')
      .select('*')
      .eq('tipo', tipo)
      .eq('activo', true)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el texto legal vigente.');
    }

    return data;
  }

  async findById(id: string): Promise<TextoLegalRow | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('textos_legales')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el texto legal.');
    }

    return data;
  }

  /** Desactiva todas las versiones anteriores de este tipo, para que solo exista una
   * versión activa a la vez (la que se le muestra a cada publicador). */
  async desactivarTodas(tipo: string, payload: TablesUpdate<'textos_legales'>): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('textos_legales')
      .update(payload)
      .eq('tipo', tipo)
      .eq('activo', true);

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el texto legal vigente.');
    }
  }

  /** Cambia solo la columna activo de una fila puntual (por id), sin tocar su
   * contenido ni crear una versión nueva. */
  async updateActivo(id: string, activo: boolean): Promise<TextoLegalRow | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('textos_legales')
      .update({ activo })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el estado del texto legal.');
    }

    return data;
  }

  async create(payload: TablesInsert<'textos_legales'>): Promise<TextoLegalRow> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('textos_legales')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo guardar el texto legal.');
    }

    return data;
  }
}
