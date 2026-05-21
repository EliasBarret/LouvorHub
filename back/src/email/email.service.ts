import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private smtpReady = false;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = Number(this.config.get<string | number>('SMTP_PORT', 587));
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      family: 4,
      auth: user && pass ? { user, pass } : undefined,
    } as any);
  }

  async onModuleInit() {
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const host = this.config.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = Number(this.config.get<string | number>('SMTP_PORT', 587));
    const from = this.config.get<string>('SMTP_FROM');

    if (!user || !pass) {
      this.logger.error(
        `SMTP NÃO configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM nas variáveis de ambiente. ` +
          `Os e-mails (cadastro, recuperação de senha, notificações) NÃO serão enviados.`,
      );
      return;
    }

    if (!from) {
      this.logger.warn('SMTP_FROM não definido — usando remetente padrão.');
    }

    try {
      await this.transporter.verify();
      this.smtpReady = true;
      this.logger.log(`📧 SMTP pronto (${user}@${host}:${port})`);
    } catch (err: any) {
      this.logger.error(`Falha ao conectar no SMTP ${host}:${port} com usuário ${user}: ${err.message}`);
    }
  }

  async sendVerificationEmail(nome: string, email: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:4200');
    const link = `${appUrl}/verificar-email?token=${token}`;
    const from = this.config.get<string>('SMTP_FROM', 'LouvorHub <noreply@louvorhub.app>');

    if (!this.smtpReady) {
      this.logger.error(
        `Não foi possível enviar e-mail de verificação para ${email}: SMTP não está pronto. ` +
          `Verifique as variáveis SMTP_* na Railway.`,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Confirme seu e-mail - LouvorHub',
        text: `Olá, ${nome}!

        Obrigado por se cadastrar no LouvorHub. Acesse o link abaixo para confirmar seu e-mail e ativar sua conta:

        ${link}

        Este link expira em 24 horas. Se você não criou uma conta, ignore este e-mail.

        LouvorHub`,
      });
      this.logger.log(`E-mail de verificação enviado para ${email} (messageId=${info.messageId})`);
    } catch (err: any) {
      this.logger.error(`Falha ao enviar e-mail de verificação para ${email}: ${err.message}`);
    }
  }

  async sendPasswordResetEmail(nome: string, email: string, senhaProvisoria: string): Promise<void> {
    const from = this.config.get<string>('SMTP_FROM', 'LouvorHub <noreply@louvorhub.app>');
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:4200');

    if (!this.smtpReady) {
      this.logger.error(
        `Não foi possível enviar e-mail de redefinição para ${email}: SMTP não está pronto. ` +
          `Verifique as variáveis SMTP_* na Railway.`,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Sua senha provisoria - LouvorHub',
        text: `Olá, ${nome}!

        Recebemos uma solicitacao de redefinicao de senha. Use a senha provisoria abaixo para acessar sua conta e, em seguida, altere-a em Meu Perfil.

        Senha provisoria: ${senhaProvisoria}

        Acesse: ${appUrl}/login

        Esta senha expira em 2 horas. Se voce nao solicitou a redefinicao, ignore este e-mail.

        LouvorHub`,
      });
      this.logger.log(`E-mail de redefinição enviado para ${email} (messageId=${info.messageId})`);
    } catch (err: any) {
      this.logger.error(`Falha ao enviar e-mail de redefinição para ${email}: ${err.message}`);
    }
  }
}
