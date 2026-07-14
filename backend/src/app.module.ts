import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { SupabaseModule } from './supabase/supabase.module';
import { SecurityModule } from './common/security/security.module';
import { MailModule } from './common/mail/mail.module';
import { HealthModule } from './health/health.module';
import { DepartamentosModule } from './departamentos/departamentos.module';
import { MunicipiosModule } from './municipios/municipios.module';
import { CircuitosModule } from './circuitos/circuitos.module';
import { CongregacionesModule } from './congregaciones/congregaciones.module';
import { PublicadoresModule } from './publicadores/publicadores.module';
import { MensajesModule } from './mensajes/mensajes.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    SupabaseModule,
    SecurityModule,
    MailModule,
    HealthModule,
    DepartamentosModule,
    MunicipiosModule,
    CircuitosModule,
    CongregacionesModule,
    PublicadoresModule,
    MensajesModule,
    AuthModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
