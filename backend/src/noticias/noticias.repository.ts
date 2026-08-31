import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';
import { todayIsoDateBogota } from '../common/audit/audit.util';

const BUCKET = 'noticias';

type Direccion = 'arriba' | 'abajo';

@Injectable()
export class NoticiasRepository {
  private readonly logger = new Logger(NoticiasRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('noticias')
      .select('*')
      .order('orden', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo obtener el listado de noticias.',
      );
    }

    return data ?? [];
  }

  async findPublicadas() {
    const hoy = todayIsoDateBogota();

    const { data, error } = await this.supabaseService
      .getClient()
      .from('noticias')
      .select('*')
      .eq('estado', 'PUBLICADA')
      .or(
        `fecha_maxima_publicacion.is.null,fecha_maxima_publicacion.gte.${hoy}`,
      )
      .order('orden', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo obtener el listado de noticias publicadas.',
      );
    }

    return data ?? [];
  }

  async findById(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('noticias')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo consultar la noticia.',
      );
    }

    if (!data) {
      throw new NotFoundException('La noticia indicada no existe.');
    }

    return data;
  }

  async findMaxOrden(): Promise<number> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('noticias')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo calcular el orden de la nueva noticia.',
      );
    }

    return data?.orden ?? -1;
  }

  async create(payload: TablesInsert<'noticias'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('noticias')
      .insert(payload)
      .select('*')
      .single();

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
      throw new InternalServerErrorException(
        'No se pudo actualizar la noticia.',
      );
    }

    if (!data) {
      throw new NotFoundException('La noticia indicada no existe.');
    }

    return data;
  }

  /** Borra la fila y, si tiene storage_path (imágenes subidas desde que existe el
   * bucket propio "noticias"), también el objeto en Storage. Las noticias antiguas
   * cuya imagen quedó en el bucket compartido "adjuntos" no tienen storage_path,
   * así que para esas solo se borra la fila (no es seguro borrar ahí un archivo
   * sin nombre único que pudiera estar en uso en otro lado). */
  async delete(id: string): Promise<void> {
    const noticia = await this.findById(id);

    const { error } = await this.supabaseService
      .getClient()
      .from('noticias')
      .delete()
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException('No se pudo eliminar la noticia.');
    }

    if (noticia.storage_path) {
      const { error: storageError } = await this.supabaseService
        .getClient()
        .storage.from(BUCKET)
        .remove([noticia.storage_path]);

      if (storageError) {
        this.logger.warn(
          `No se pudo eliminar el objeto de Storage "${noticia.storage_path}": ${storageError.message}`,
        );
      }
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
        'No se pudo subir la imagen de la noticia.',
      );
    }

    const { data } = this.supabaseService
      .getClient()
      .storage.from(BUCKET)
      .getPublicUrl(safeName);

    return { url: data.publicUrl, path: safeName };
  }

  /** Intercambia el orden de la noticia con el de su vecino adyacente. Si ya es la
   * primera (arriba) o la última (abajo), no hace nada. */
  async moverOrden(id: string, direccion: Direccion): Promise<void> {
    const noticia = await this.findById(id);
    const ascending = direccion === 'abajo';

    let query = this.supabaseService
      .getClient()
      .from('noticias')
      .select('id, orden');
    query =
      direccion === 'arriba'
        ? query.lt('orden', noticia.orden)
        : query.gt('orden', noticia.orden);

    const { data: vecino, error } = await query
      .order('orden', { ascending })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo mover la noticia.');
    }

    if (!vecino) {
      return;
    }

    const { error: errorA } = await this.supabaseService
      .getClient()
      .from('noticias')
      .update({ orden: vecino.orden })
      .eq('id', noticia.id);
    const { error: errorB } = await this.supabaseService
      .getClient()
      .from('noticias')
      .update({ orden: noticia.orden })
      .eq('id', vecino.id);

    if (errorA || errorB) {
      throw new InternalServerErrorException('No se pudo mover la noticia.');
    }
  }
}
