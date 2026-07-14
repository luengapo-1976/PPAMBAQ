import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromAddress: string | null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');
    const port = this.configService.get<number>('SMTP_PORT') ?? 587;
    this.fromAddress = this.configService.get<string>('SMTP_FROM') ?? user ?? null;

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP no está configurado (SMTP_HOST/SMTP_USER/SMTP_PASSWORD). El envío de correos fallará hasta que se configure.',
      );
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.transporter || !this.fromAddress) {
      throw new InternalServerErrorException('El servicio de correo no está configurado.');
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar el correo a ${options.to}`, error as Error);
      throw error;
    }
  }
}
