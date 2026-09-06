import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { PublicadoresRepository, PublicadorAuthProfile } from '../publicadores/publicadores.repository';
import { PasswordService } from '../common/security/password.service';
import { MailService } from '../common/mail/mail.service';
import { ParametrosService } from '../parametros/parametros.service';
import {
  AceptacionesLegalesService,
  TIPO_TRATAMIENTO_DATOS,
} from '../aceptaciones-legales/aceptaciones-legales.service';
import { LoginAttemptsService } from './login-attempts.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export interface PublicadorPerfil {
  id: string;
  primer_nombre: string | null;
  segundo_nombre: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  nombre_completo: string;
}

function nombreCompleto(publicador: PublicadorAuthProfile): string {
  return [publicador.primer_nombre, publicador.segundo_nombre, publicador.primer_apellido, publicador.segundo_apellido]
    .filter((part) => !!part && part.trim().length > 0)
    .join(' ');
}

function toPerfil(publicador: PublicadorAuthProfile): PublicadorPerfil {
  return {
    id: publicador.id,
    primer_nombre: publicador.primer_nombre,
    segundo_nombre: publicador.segundo_nombre,
    primer_apellido: publicador.primer_apellido,
    segundo_apellido: publicador.segundo_apellido,
    nombre_completo: nombreCompleto(publicador),
  };
}

const INVALID_CREDENTIALS_MESSAGE = 'Usuario o contraseña incorrectos.';
const INVALID_CURRENT_PASSWORD_MESSAGE = 'La contraseña actual no es correcta.';
const ESTADO_CUMPLE_REQUISITOS = 'CUMPLE REQUISITOS';
const REGISTRO_EN_PROCESO_MESSAGE =
  'Tu registro en la PPAM todavía está en proceso. Podrás ingresar a la aplicación una vez tu solicitud cumpla los requisitos.';
const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'Si el correo está registrado, en unos minutos recibirás un mensaje con una contraseña temporal.';
const TEMP_PASSWORD_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const TEMP_PASSWORD_LENGTH = 12;

function generateTempPassword(): string {
  let password = '';
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
    password += TEMP_PASSWORD_CHARSET[randomInt(TEMP_PASSWORD_CHARSET.length)];
  }
  return password;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuariosRepository: UsuariosRepository,
    private readonly publicadoresRepository: PublicadoresRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly parametrosService: ParametrosService,
    private readonly aceptacionesLegalesService: AceptacionesLegalesService,
    private readonly loginAttemptsService: LoginAttemptsService,
  ) {}

  async login(dto: LoginDto) {
    this.loginAttemptsService.assertNotLocked(dto.login);

    const usuario = await this.usuariosRepository.findByLogin(dto.login);

    if (usuario) {
      const passwordMatches = await this.passwordService.compare(dto.password, usuario.password_hash);
      if (!passwordMatches) {
        this.loginAttemptsService.registerFailure(dto.login);
        throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
      }

      // Cruce por móvil: vincula este usuario con su publicador (si existe) para
      // habilitar el switch entre el Dashboard y la landing de participante.
      const movil = usuario.movil?.trim();
      const publicador = movil ? await this.publicadoresRepository.findByMovil(movil) : null;

      const accessToken = await this.jwtService.signAsync({
        sub: usuario.login,
        rol: usuario.rol,
        publicadorId: publicador?.id ?? null,
      });

      const requiereActualizacionDatos = publicador
        ? await this.parametrosService.requiereActualizacionDatos(
            publicador.fecha_actualizacion_datos,
          )
        : false;
      const requiereAceptacionLegal = await this.aceptacionesLegalesService.requiereAceptacion(
        publicador?.id ?? null,
        TIPO_TRATAMIENTO_DATOS,
      );

      this.loginAttemptsService.registerSuccess(dto.login);
      return {
        access_token: accessToken,
        login: usuario.login,
        rol: usuario.rol,
        publicador: publicador ? toPerfil(publicador) : null,
        requiereActualizacionDatos,
        requiereAceptacionLegal,
      };
    }

    // No existe en usuarios: intenta como login de participante (publicadores),
    // donde el "password" ingresado debe coincidir con la columna movil.
    const login = dto.login.trim();
    const movil = dto.password.trim();
    const publicador = await this.publicadoresRepository.findByLoginAndMovil(login, movil);
    if (!publicador) {
      this.loginAttemptsService.registerFailure(dto.login);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    /** Aunque el login y el móvil (que hace de contraseña) coincidan, un participante
     * solo puede entrar a la aplicación una vez su solicitud "cumple requisitos" — no
     * cuenta como intento fallido para el bloqueo de intentos, porque las credenciales
     * sí son correctas: la persona solo debe esperar a que su registro avance. */
    if (publicador.estado !== ESTADO_CUMPLE_REQUISITOS) {
      throw new UnauthorizedException(REGISTRO_EN_PROCESO_MESSAGE);
    }

    const accessToken = await this.jwtService.signAsync({
      sub: publicador.login ?? login,
      rol: null,
      publicadorId: publicador.id,
    });

    const requiereActualizacionDatos = await this.parametrosService.requiereActualizacionDatos(
      publicador.fecha_actualizacion_datos,
    );
    const requiereAceptacionLegal = await this.aceptacionesLegalesService.requiereAceptacion(
      publicador.id,
      TIPO_TRATAMIENTO_DATOS,
    );

    this.loginAttemptsService.registerSuccess(dto.login);
    return {
      access_token: accessToken,
      login: publicador.login ?? login,
      rol: null,
      publicador: toPerfil(publicador),
      requiereActualizacionDatos,
      requiereAceptacionLegal,
    };
  }

  /** Siempre responde el mismo mensaje genérico, exista o no el correo,
   * para no revelar qué direcciones están registradas (OWASP). */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    try {
      const usuario = await this.usuariosRepository.findByCorreo(dto.correo);
      if (usuario) {
        const tempPassword = generateTempPassword();
        // Enviamos primero y solo persistimos la nueva contraseña si el correo salió bien:
        // así evitamos dejar al usuario sin poder entrar si el envío falla.
        await this.mailService.sendMail({
          to: dto.correo,
          subject: 'PPAM BAQ - Nueva contraseña temporal',
          text:
            `Hola,\n\nRecibimos una solicitud para recuperar tu acceso a PPAM BAQ.\n\n` +
            `Tu usuario es: ${usuario.login}\n` +
            `Tu nueva contraseña temporal es: ${tempPassword}\n\n` +
            `Por seguridad, te recomendamos cambiarla luego de iniciar sesión.\n\n` +
            `Si no solicitaste este cambio, contacta al administrador del sistema.`,
        });
        const passwordHash = await this.passwordService.hash(tempPassword);
        await this.usuariosRepository.updatePasswordHash(usuario.login, passwordHash);
      }
    } catch (error) {
      this.logger.error('Error procesando la solicitud de recuperación de contraseña.', error as Error);
    }

    return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
  }

  async changePassword(login: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const usuario = await this.usuariosRepository.findByLogin(login);
    if (!usuario) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await this.passwordService.compare(dto.currentPassword, usuario.password_hash);
    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CURRENT_PASSWORD_MESSAGE);
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.usuariosRepository.updatePasswordHash(login, passwordHash);

    return { message: 'Contraseña actualizada correctamente.' };
  }
}
