import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIgrejaDto, UpdateIgrejaDto } from './dto/create-igreja.dto';
import { AddMembroDto } from './dto/add-membro.dto';

@Injectable()
export class IgrejasService {
  constructor(private prisma: PrismaService) {}

  getAll() {
    return this.prisma.igreja.findMany({ orderBy: { nome: 'asc' } });
  }

  async getById(id: number) {
    const igreja = await this.prisma.igreja.findUnique({ where: { id } });
    if (!igreja) throw new NotFoundException('Igreja não encontrada.');
    return igreja;
  }

  create(dto: CreateIgrejaDto) {
    return this.prisma.igreja.create({ data: dto });
  }

  async update(id: number, dto: UpdateIgrejaDto) {
    await this.getById(id);
    return this.prisma.igreja.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.getById(id);
    await this.prisma.igreja.delete({ where: { id } });
  }

  async getMembros(igrejaId: number) {
    await this.getById(igrejaId);
    return this.prisma.membroIgreja.findMany({
      where: { igrejaId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            funcao: true,
            ministerio: true,
            avatar: true,
            perfil: true,
            instrumentos: true,
          },
        },
        igreja: true,
      },
    });
  }

  async getIgrejasByUsuario(usuarioId: number) {
    return this.prisma.membroIgreja.findMany({
      where: { usuarioId },
      include: { igreja: true },
    });
  }

  async addMembro(igrejaId: number, dto: AddMembroDto) {
    await this.getById(igrejaId);
    const exists = await this.prisma.membroIgreja.findUnique({
      where: { usuarioId_igrejaId: { usuarioId: dto.usuarioId, igrejaId } },
    });
    if (exists) throw new ConflictException('Usuário já é membro desta igreja.');
    return this.prisma.membroIgreja.create({
      data: { igrejaId, usuarioId: dto.usuarioId, perfil: dto.perfil },
      include: { usuario: true, igreja: true },
    });
  }

  async removeMembro(membroId: number) {
    const membro = await this.prisma.membroIgreja.findUnique({
      where: { id: membroId },
    });
    if (!membro) throw new NotFoundException('Membro não encontrado.');
    await this.prisma.membroIgreja.delete({ where: { id: membroId } });
  }
}
