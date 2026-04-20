import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const tokenVerificacao = crypto.randomBytes(32).toString('hex');
    const tokenExpiracao = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const usuario = await this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senhaHash,
        funcao: dto.funcao ?? '',
        ministerio: dto.ministerio ?? '',
        tokenVerificacao,
        tokenExpiracao,
        emailVerificado: false,
      },
    });

    await this.emailService.sendVerificationEmail(usuario.nome, usuario.email, tokenVerificacao);

    return {
      data: { usuario: this.sanitize(usuario) },
      sucesso: true,
      mensagem: 'Cadastro realizado! Verifique seu e-mail para ativar a conta.',
      timestamp: new Date().toISOString(),
    };
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (!usuario) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const valid = await bcrypt.compare(dto.senha, usuario.senhaHash);
    if (!valid) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const token = this.generateToken(usuario.id, usuario.email);
    return {
      data: { usuario: this.sanitize(usuario), token },
      sucesso: true,
      mensagem: 'Login realizado com sucesso.',
      timestamp: new Date().toISOString(),
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) throw new UnauthorizedException('Usuário não encontrado.');

    const valid = await bcrypt.compare(dto.senhaAtual, usuario.senhaHash);
    if (!valid) throw new UnauthorizedException('Senha atual incorreta.');

    const senhaHash = await bcrypt.hash(dto.novaSenha, 10);
    await this.prisma.usuario.update({ where: { id: userId }, data: { senhaHash } });

    return {
      data: null,
      sucesso: true,
      mensagem: 'Senha alterada com sucesso.',
      timestamp: new Date().toISOString(),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    // Always return success to avoid user enumeration
    if (!usuario) {
      return {
        data: null,
        sucesso: true,
        mensagem: 'Se este e-mail estiver cadastrado, você receberá a senha provisória em breve.',
        timestamp: new Date().toISOString(),
      };
    }

    const senhaProvisoria = crypto.randomBytes(4).toString('hex');
    const senhaHash = await bcrypt.hash(senhaProvisoria, 10);
    const tokenExpiracao = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { senhaHash, tokenExpiracao },
    });

    await this.emailService.sendPasswordResetEmail(usuario.nome, usuario.email, senhaProvisoria);

    return {
      data: null,
      sucesso: true,
      mensagem: 'Se este e-mail estiver cadastrado, você receberá a senha provisória em breve.',
      timestamp: new Date().toISOString(),
    };
  }

  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Token inválido.');

    const usuario = await this.prisma.usuario.findFirst({
      where: { tokenVerificacao: token },
    });

    if (!usuario) {
      throw new BadRequestException('Token de verificação inválido ou já utilizado.');
    }

    if (usuario.tokenExpiracao && usuario.tokenExpiracao < new Date()) {
      throw new BadRequestException('Token de verificação expirado. Solicite um novo e-mail de confirmação.');
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        emailVerificado: true,
        tokenVerificacao: null,
        tokenExpiracao: null,
      },
    });

    const jwtToken = this.generateToken(usuario.id, usuario.email);
    return {
      data: { usuario: this.sanitize({ ...usuario, emailVerificado: true }), token: jwtToken },
      sucesso: true,
      mensagem: 'E-mail confirmado com sucesso! Bem-vindo ao LouvorHub.',
      timestamp: new Date().toISOString(),
    };
  }

  async resendVerification(email: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });

    if (!usuario || usuario.emailVerificado) {
      return {
        data: null,
        sucesso: true,
        mensagem: 'Se o e-mail estiver pendente de verificação, um novo link será enviado.',
        timestamp: new Date().toISOString(),
      };
    }

    const tokenVerificacao = crypto.randomBytes(32).toString('hex');
    const tokenExpiracao = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { tokenVerificacao, tokenExpiracao },
    });

    await this.emailService.sendVerificationEmail(usuario.nome, usuario.email, tokenVerificacao);

    return {
      data: null,
      sucesso: true,
      mensagem: 'Se o e-mail estiver pendente de verificação, um novo link será enviado.',
      timestamp: new Date().toISOString(),
    };
  }

  private generateToken(id: number, email: string) {
    return this.jwtService.sign({ sub: id, email });
  }

  private sanitize(usuario: any) {
    const { senhaHash: _, tokenVerificacao: _t, tokenRedefinicaoSenha: _r, tokenExpiracao: _e, ...rest } = usuario;
    return rest;
  }
}
