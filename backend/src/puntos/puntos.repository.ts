import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

@Injectable()
export class PuntosRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('puntos')
      .select('*')
      .order('nombre_punto', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo obtener el listado de puntos.',
      );
    }

    return data;
  }

  /** Puntos donde el móvil registrado como encargado coincide con el móvil dado —
   * usado para que un publicador vea el calendario del/los punto(s) a su cargo. */
  async findByMovil(movil: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('puntos')
      .select('*')
      .eq('movil', movil)
      .order('nombre_punto', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo consultar los puntos a cargo.',
      );
    }

    return data;
  }

  async findByCodigo(codigo: number) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('puntos')
      .select('*')
      .eq('codigo_punto', codigo)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar el punto.');
    }

    return data;
  }

  async create(payload: TablesInsert<'puntos'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('puntos')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear el punto.');
    }

    return data;
  }

  async update(codigo: number, payload: TablesUpdate<'puntos'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('puntos')
      .update(payload)
      .eq('codigo_punto', codigo)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el punto.');
    }

    if (!data) {
      throw new NotFoundException('El punto indicado no existe.');
    }

    return data;
  }
}
