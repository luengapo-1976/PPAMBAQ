import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';
import { todayIsoDateBogota } from '../common/audit/audit.util';

const BUCKET = 'capacitaciones';

type Direccion = 'arriba' | 'abajo';

@Injectable()
export class CapacitacionesRepository {
  private readonly logger = new Logger(CapacitacionesRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('capacitaciones')
      .select('*')
      .order('orden', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo obtener el listado de capacitaciones.',
      );
    }

    return data ?? [];
  }

  async findVisibles() {
    const hoy = todayIsoDateBogota();

    const { data, error } = await this.supabaseService
      .getClient()
      .from('capacitaciones')
      .select('*')
      .eq('activo', true)
      .or(
        `fecha_maxima_publicacion.is.null,fecha_maxima_publicacion.gte.${hoy}`,
      )
      .order('orden', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo obtener el listado de capacitaciones visibles.',
      );
    }

    return data ?? [];
  }

  async findById(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('capacitaciones')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo consultar la capacitación.',
      );
    }

    if (!data) {
      throw new NotFoundException('La capacitación indicada no existe.');
    }

    return data;
  }

  async findMaxOrden(): Promise<number> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('capacitaciones')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo calcular el orden de la nueva capacitación.',
      );
    }

    return data?.orden ?? -1;
  }

  async create(payload: TablesInsert<'capacitaciones'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('capacitaciones')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo crear la capacitación.',
      );
    }

    return data;
  }

  async update(id: string, payload: TablesUpdate<'capacitaciones'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('capacitaciones')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo actualizar la capacitación.',
      );
    }

    if (!data) {
      throw new NotFoundException('La capacitación indicada no existe.');
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const capacitacion = await this.findById(id);

    const { error } = await this.supabaseService
      .getClient()
      .from('capacitaciones')
      .delete()
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo eliminar la capacitación.',
      );
    }

    if (capacitacion.tipo === 'IMAGEN' && capacitacion.storage_path) {
      const { error: storageError } = await this.supabaseService
        .getClient()
        .storage.from(BUCKET)
        .remove([capacitacion.storage_path]);

      if (storageError) {
        this.logger.warn(
          `No se pudo eliminar el objeto de Storage "${capacitacion.storage_path}": ${storageError.message}`,
        );
      }
    }
  }

  /** Intercambia el orden de la capacitación con el de su vecino adyacente. Si ya
   * es la primera (arriba) o la última (abajo), no hace nada. */
  async moverOrden(id: string, direccion: Direccion): Promise<void> {
    const capacitacion = await this.findById(id);
    const ascending = direccion === 'abajo';

    let query = this.supabaseService
      .getClient()
      .from('capacitaciones')
      .select('id, orden');
    query =
      direccion === 'arriba'
        ? query.lt('orden', capacitacion.orden)
        : query.gt('orden', capacitacion.orden);

    const { data: vecino, error } = await query
      .order('orden', { ascending })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo mover la capacitación.',
      );
    }

    if (!vecino) {
      return;
    }

    const { error: errorA } = await this.supabaseService
      .getClient()
      .from('capacitaciones')
      .update({ orden: vecino.orden })
      .eq('id', capacitacion.id);
    const { error: errorB } = await this.supabaseService
      .getClient()
      .from('capacitaciones')
      .update({ orden: capacitacion.orden })
      .eq('id', vecino.id);

    if (errorA || errorB) {
      throw new InternalServerErrorException(
        'No se pudo mover la capacitación.',
      );
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
        'No se pudo subir la imagen de la capacitación.',
      );
    }

    const { data } = this.supabaseService
      .getClient()
      .storage.from(BUCKET)
      .getPublicUrl(safeName);

    return { url: data.publicUrl, path: safeName };
  }
}
