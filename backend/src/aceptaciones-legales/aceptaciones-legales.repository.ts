import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TablesInsert } from '../supabase/database.types';

@Injectable()
export class AceptacionesLegalesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async existeAceptacion(publicadorId: string, textoLegalId: string): Promise<boolean> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('aceptaciones_legales')
      .select('id')
      .eq('id_publicador', publicadorId)
      .eq('id_texto_legal', textoLegalId)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo consultar la aceptación registrada.');
    }

    return !!data;
  }

  async create(payload: TablesInsert<'aceptaciones_legales'>): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('aceptaciones_legales')
      .insert(payload);

    if (error) {
      throw new InternalServerErrorException('No se pudo registrar tu aceptación.');
    }
  }
}
