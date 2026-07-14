import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

@Injectable()
export class MensajesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('mensajes')
      .select('*')
      .order('tipo', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el listado de mensajes.');
    }

    return data;
  }

  async create(payload: TablesInsert<'mensajes'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('mensajes')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear el mensaje.');
    }

    return data;
  }

  async update(id: string, payload: TablesUpdate<'mensajes'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('mensajes')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el mensaje.');
    }

    if (!data) {
      throw new NotFoundException('El mensaje indicado no existe.');
    }

    return data;
  }

  async uploadAdjunto(file: Express.Multer.File): Promise<{ url: string; path: string }> {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');

    const { error } = await this.supabaseService
      .getClient()
      .storage.from('adjuntos')
      .upload(safeName, file.buffer, { contentType: file.mimetype, upsert: true });

    if (error) {
      throw new InternalServerErrorException('No se pudo subir el archivo adjunto.');
    }

    const { data } = this.supabaseService.getClient().storage.from('adjuntos').getPublicUrl(safeName);

    return { url: data.publicUrl, path: safeName };
  }
}
