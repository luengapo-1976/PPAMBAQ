import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

const BUCKET = 'banners';

type Direccion = 'arriba' | 'abajo';

@Injectable()
export class BannersRepository {
  private readonly logger = new Logger(BannersRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('banners')
      .select('*')
      .order('orden', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo obtener el listado de banners.',
      );
    }

    return data ?? [];
  }

  async findVisibles() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('banners')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo obtener el listado de banners visibles.',
      );
    }

    return data ?? [];
  }

  async findById(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('banners')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el banner.');
    }

    if (!data) {
      throw new NotFoundException('El banner indicado no existe.');
    }

    return data;
  }

  async findMaxOrden(): Promise<number> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('banners')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo calcular el orden del nuevo banner.',
      );
    }

    return data?.orden ?? -1;
  }

  async create(payload: TablesInsert<'banners'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('banners')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear el banner.');
    }

    return data;
  }

  async update(id: string, payload: TablesUpdate<'banners'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('banners')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo actualizar el banner.',
      );
    }

    if (!data) {
      throw new NotFoundException('El banner indicado no existe.');
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const banner = await this.findById(id);

    const { error } = await this.supabaseService
      .getClient()
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException('No se pudo eliminar el banner.');
    }

    const { error: storageError } = await this.supabaseService
      .getClient()
      .storage.from(BUCKET)
      .remove([banner.storage_path]);

    if (storageError) {
      this.logger.warn(
        `No se pudo eliminar el objeto de Storage "${banner.storage_path}": ${storageError.message}`,
      );
    }
  }

  /** Intercambia el orden del banner con el de su vecino adyacente. Si ya es el
   * primero (arriba) o el último (abajo), no hace nada. */
  async moverOrden(id: string, direccion: Direccion): Promise<void> {
    const banner = await this.findById(id);
    const ascending = direccion === 'abajo';

    let query = this.supabaseService
      .getClient()
      .from('banners')
      .select('id, orden');
    query =
      direccion === 'arriba'
        ? query.lt('orden', banner.orden)
        : query.gt('orden', banner.orden);

    const { data: vecino, error } = await query
      .order('orden', { ascending })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo mover el banner.');
    }

    if (!vecino) {
      return;
    }

    const { error: errorA } = await this.supabaseService
      .getClient()
      .from('banners')
      .update({ orden: vecino.orden })
      .eq('id', banner.id);
    const { error: errorB } = await this.supabaseService
      .getClient()
      .from('banners')
      .update({ orden: banner.orden })
      .eq('id', vecino.id);

    if (errorA || errorB) {
      throw new InternalServerErrorException('No se pudo mover el banner.');
    }
  }

  async uploadImagen(
    file: Express.Multer.File,
  ): Promise<{ url: string; path: string }> {
    const safeName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;

    const { error } = await this.supabaseService
      .getClient()
      .storage.from(BUCKET)
      .upload(safeName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo subir la imagen del banner.',
      );
    }

    const { data } = this.supabaseService
      .getClient()
      .storage.from(BUCKET)
      .getPublicUrl(safeName);

    return { url: data.publicUrl, path: safeName };
  }
}
