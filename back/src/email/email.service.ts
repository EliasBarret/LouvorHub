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
      subject: '✅ Confirme seu e-mail — LouvorHub',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:32px">🎵</span>
            <h2 style="margin:8px 0 0;color:#1a1a2e;font-size:20px;">LouvorHub</h2>
          </div>
          <h3 style="color:#1a1a2e;font-size:18px;margin-bottom:8px;">Olá, ${nome}!</h3>
          <p style="color:#4b5563;font-size:14px;line-height:1.6;margin-bottom:24px;">
            Obrigado por se cadastrar no <strong>LouvorHub</strong>. Clique no botão abaixo para confirmar seu e-mail e ativar sua conta.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${link}" style="display:inline-block;padding:12px 28px;background:#6b3fa0;color:#fff;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">
              Confirmar e-mail
            </a>
          </div>
          <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0;">
            Este link expira em <strong>24 horas</strong>. Se você não criou uma conta, ignore este e-mail.
          </p>
        </div>
      `,
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
      subject: '🔑 Sua senha provisória — LouvorHub',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:32px">🎵</span>
            <h2 style="margin:8px 0 0;color:#1a1a2e;font-size:20px;">LouvorHub</h2>
          </div>
          <h3 style="color:#1a1a2e;font-size:18px;margin-bottom:8px;">Olá, ${nome}!</h3>
          <p style="color:#4b5563;font-size:14px;line-height:1.6;margin-bottom:16px;">
            Recebemos uma solicitação de redefinição de senha. Use a senha provisória abaixo para acessar sua conta e, em seguida, altere-a em <strong>Meu Perfil</strong>.
          </p>
          <div style="background:#f3f4f6;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Senha provisória</p>
            <p style="margin:0;font-size:24px;font-weight:800;color:#6b3fa0;letter-spacing:2px;">${senhaProvisoria}</p>
          </div>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${appUrl}/login" style="display:inline-block;padding:12px 28px;background:#6b3fa0;color:#fff;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">
              Acessar o LouvorHub
            </a>
          </div>
          <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0;">
            Esta senha expira em <strong>2 horas</strong>. Se você não solicitou a redefinição, ignore este e-mail.
          </p>
        </div>
      `,
    }).catch(err => {
      this.logger.error(`Falha ao enviar e-mail de redefinição para ${email}: ${err.message}`);
    });
  }
}
