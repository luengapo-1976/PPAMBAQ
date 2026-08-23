import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert, TablesUpdate } from '../supabase/database.types';

const PUBLIC_COLUMNS = 'login, rol, correo, movil';

@Injectable()
export class UsuariosRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('usuarios')
      .select(PUBLIC_COLUMNS)
      .order('login', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el listado de usuarios.');
    }

    return data;
  }

  async findByLogin(login: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('usuarios')
      .select('login, rol, password_hash, movil')
      .eq('login', login)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo validar el usuario.');
    }

    return data;
  }

  async findByCorreo(correo: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('usuarios')
      .select('login, rol, correo')
      .ilike('correo', correo)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo validar el correo electrónico.');
    }

    return data;
  }

  async create(payload: TablesInsert<'usuarios'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('usuarios')
      .insert(payload)
      .select(PUBLIC_COLUMNS)
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear el usuario.');
    }

    return data;
  }

  async update(login: string, payload: TablesUpdate<'usuarios'>) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('usuarios')
      .update(payload)
      .eq('login', login)
      .select(PUBLIC_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el usuario.');
    }

    if (!data) {
      throw new NotFoundException('El usuario indicado no existe.');
    }

    return data;
  }

  async updatePasswordHash(login: string, passwordHash: string): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('usuarios')
      .update({ password_hash: passwordHash })
      .eq('login', login);

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar la contraseña.');
    }
  }
}
