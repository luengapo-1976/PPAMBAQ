import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class HealthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async checkSupabaseConnection(): Promise<{ status: 'ok'; timestamp: string }> {
    const { error } = await this.supabaseService
      .getClient()
      .from('departamentos')
      .select('codigo_departamento', { count: 'exact', head: true });

    if (error) {
      throw new ServiceUnavailableException(
        'No se pudo establecer conexión con la base de datos.',
      );
    }

    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
