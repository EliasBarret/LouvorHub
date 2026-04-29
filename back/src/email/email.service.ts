import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: this.config.get<number>('SMTP_PORT', 587) === 465,
      family: 4,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(nome: string, email: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:4200');
    const link = `${appUrl}/verificar-email?token=${token}`;
    const from = this.config.get<string>('SMTP_FROM', 'LouvorHub <noreply@louvorhub.app>');

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Confirme seu e-mail - LouvorHub',
      text: `Olá, ${nome}!

        Obrigado por se cadastrar no LouvorHub. Acesse o link abaixo para confirmar seu e-mail e ativar sua conta:

        ${link}

        Este link expira em 24 horas. Se você não criou uma conta, ignore este e-mail.

        LouvorHub`,
    }).catch(err => {
      this.logger.error(`Falha ao enviar e-mail de verificação para ${email}: ${err.message}`);
    });
  }

  async sendPasswordResetEmail(nome: string, email: string, senhaProvisoria: string): Promise<void> {
    const from = this.config.get<string>('SMTP_FROM', 'LouvorHub <noreply@louvorhub.app>');
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:4200');

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Sua senha provisoria - LouvorHub',
      text: `Olá, ${nome}!

        Recebemos uma solicitacao de redefinicao de senha. Use a senha provisoria abaixo para acessar sua conta e, em seguida, altere-a em Meu Perfil.

        Senha provisoria: ${senhaProvisoria}

        Acesse: ${appUrl}/login

        Esta senha expira em 2 horas. Se voce nao solicitou a redefinicao, ignore este e-mail.

        LouvorHub`,
    }).catch(err => {
      this.logger.error(`Falha ao enviar e-mail de redefinição para ${email}: ${err.message}`);
    });
  }
}
