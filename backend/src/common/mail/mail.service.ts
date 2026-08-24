import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Remitente de pruebas de Resend: funciona sin verificar un dominio propio.
 * Una vez se verifique un dominio en Resend, se debe fijar RESEND_FROM con una
 * dirección de ese dominio. */
const DEFAULT_FROM = 'onboarding@resend.dev';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client: Resend | null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromAddress = this.configService.get<string>('RESEND_FROM') || DEFAULT_FROM;

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY no está configurada. El envío de correos fallará hasta que se configure.');
      this.client = null;
      return;
    }

    this.client = new Resend(apiKey);
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.client) {
      throw new InternalServerErrorException('El servicio de correo no está configurado.');
    }

    const { error } = await this.client.emails.send({
      from: this.fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (error) {
      this.logger.error(`No se pudo enviar el correo a ${options.to}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo enviar el correo.');
    }
  }
}
