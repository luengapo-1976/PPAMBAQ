import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { PasswordService } from '../common/security/password.service';
import { MailService } from '../common/mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const INVALID_CREDENTIALS_MESSAGE = 'Usuario o contraseña incorrectos.';
const INVALID_CURRENT_PASSWORD_MESSAGE = 'La contraseña actual no es correcta.';
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
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.usuariosRepository.findByLogin(dto.login);
    if (!usuario) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await this.passwordService.compare(dto.password, usuario.password_hash);
    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const accessToken = await this.jwtService.signAsync({ sub: usuario.login, rol: usuario.rol });

    return {
      access_token: accessToken,
      login: usuario.login,
      rol: usuario.rol,
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
          subject: 'PPAM BAQ — Nueva contraseña temporal',
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
