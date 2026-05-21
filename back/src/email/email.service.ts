import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private from = 'LouvorHub <onboarding@resend.dev>';
  private ready = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('RESEND_FROM');

    if (!apiKey) {
      this.logger.error(
        'RESEND_API_KEY não configurada. Os e-mails (cadastro, recuperação de senha, notificações) NÃO serão enviados. ' +
          'Defina RESEND_API_KEY nas variáveis de ambiente.',
      );
      return;
    }

    this.resend = new Resend(apiKey);
    if (from) this.from = from;
    this.ready = true;
    this.logger.log(`📧 Resend configurado (from=${this.from})`);
  }

  async sendVerificationEmail(nome: string, email: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:4200');
    const link = `${appUrl}/verificar-email?token=${token}`;

    await this.send({
      to: email,
      subject: 'Confirme seu e-mail - LouvorHub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
          <h2 style="color: #4f46e5;">Bem-vindo ao LouvorHub, ${this.escape(nome)}!</h2>
          <p>Obrigado por se cadastrar. Para ativar sua conta, confirme seu e-mail clicando no botão abaixo:</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${link}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
              Confirmar e-mail
            </a>
          </p>
          <p>Ou copie e cole este link no navegador:</p>
          <p><a href="${link}">${link}</a></p>
          <p style="color:#6b7280;font-size:13px;">Este link expira em 24 horas. Se você não criou uma conta, ignore este e-mail.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="color:#6b7280;font-size:12px;">LouvorHub — gestão de louvor para igrejas</p>
        </div>
      `,
      text: `Olá, ${nome}!\n\nObrigado por se cadastrar no LouvorHub. Acesse o link abaixo para confirmar seu e-mail:\n\n${link}\n\nEste link expira em 24 horas. Se você não criou uma conta, ignore este e-mail.\n\nLouvorHub`,
    });
  }

  async sendPasswordResetEmail(nome: string, email: string, senhaProvisoria: string): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:4200');

    await this.send({
      to: email,
      subject: 'Sua senha provisória - LouvorHub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
          <h2 style="color: #4f46e5;">Redefinição de senha</h2>
          <p>Olá, ${this.escape(nome)}!</p>
          <p>Recebemos uma solicitação de redefinição de senha. Use a senha provisória abaixo para acessar sua conta e, em seguida, altere-a em <strong>Meu Perfil</strong>:</p>
          <p style="text-align:center;margin:24px 0;">
            <code style="background:#f3f4f6;padding:12px 20px;border-radius:8px;font-size:18px;letter-spacing:2px;">${senhaProvisoria}</code>
          </p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${appUrl}/login" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
              Acessar LouvorHub
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">Esta senha expira em 2 horas. Se você não solicitou a redefinição, ignore este e-mail — sua senha atual continua válida.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="color:#6b7280;font-size:12px;">LouvorHub — gestão de louvor para igrejas</p>
        </div>
      `,
      text: `Olá, ${nome}!\n\nRecebemos uma solicitação de redefinição de senha. Use a senha provisória abaixo para acessar sua conta e, em seguida, altere-a em Meu Perfil.\n\nSenha provisória: ${senhaProvisoria}\n\nAcesse: ${appUrl}/login\n\nEsta senha expira em 2 horas. Se você não solicitou a redefinição, ignore este e-mail.\n\nLouvorHub`,
    });
  }

  private async send(params: { to: string; subject: string; html: string; text: string }): Promise<void> {
    if (!this.ready || !this.resend) {
      this.logger.error(
        `Não foi possível enviar e-mail para ${params.to} ("${params.subject}"): Resend não configurado. Verifique RESEND_API_KEY.`,
      );
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      if (error) {
        this.logger.error(
          `Falha ao enviar e-mail para ${params.to} ("${params.subject}"): ${error.name ?? 'erro'} - ${error.message}`,
        );
        return;
      }

      this.logger.log(`E-mail enviado para ${params.to} ("${params.subject}") id=${data?.id}`);
    } catch (err: any) {
      this.logger.error(`Exceção ao enviar e-mail para ${params.to} ("${params.subject}"): ${err.message}`);
    }
  }

  private escape(input: string): string {
    return String(input ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
