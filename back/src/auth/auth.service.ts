import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const usuario = await this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senhaHash,
        funcao: dto.funcao ?? '',
        ministerio: dto.ministerio ?? '',
      },
    });

    const token = this.generateToken(usuario.id, usuario.email);
    return {
      data: { usuario: this.sanitize(usuario), token },
      sucesso: true,
      mensagem: 'Cadastro realizado com sucesso.',
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

  private generateToken(id: number, email: string) {
    return this.jwtService.sign({ sub: id, email });
  }

  private sanitize(usuario: any) {
    const { senhaHash: _, ...rest } = usuario;
    return rest;
  }
}
