import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

@Injectable()
export class NoticiasRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('noticias')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el listado de noticias.');
    }

    return data ?? [];
  }

  async findPublicadas() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('noticias')
      .select('*')
      .eq('estado', 'PUBLICADA')
      .order('fecha_publicacion', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el listado de noticias publicadas.');
    }

    return data ?? [];
  }

  async findById(id: string) {
    const { data, error } = await this.supabaseService.getClient().from('noticias').select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar la noticia.');
    }

    if (!data) {
      throw new NotFoundException('La noticia indicada no existe.');
    }

    return data;
  }

  async create(payload: TablesInsert<'noticias'>) {
    const { data, error } = await this.supabaseService.getClient().from('noticias').insert(payload).select('*').single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear la noticia.');
    }

    return data;
  }

  async update(id: string, payload: TablesUpdate<'noticias'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('noticias')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar la noticia.');
    }

    if (!data) {
      throw new NotFoundException('La noticia indicada no existe.');
    }

    return data;
  }
}
