import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoCultoDto, UpdateTipoCultoDto } from './dto/create-tipo-culto.dto';

@Injectable()
export class TiposCultoService {
  constructor(private prisma: PrismaService) {}

  getAll(igrejaId?: number) {
    const where = igrejaId ? { igrejaId } : {};
    return this.prisma.tipoCulto.findMany({
      where,
      include: { igreja: { select: { id: true, nome: true } } },
      orderBy: [{ igrejaId: 'asc' }, { horario: 'asc' }, { nome: 'asc' }],
    });
  }

  async getById(id: number) {
    const tipo = await this.prisma.tipoCulto.findUnique({
      where: { id },
      include: { igreja: { select: { id: true, nome: true } } },
    });
    if (!tipo) throw new NotFoundException('Tipo de culto não encontrado.');
    return tipo;
  }

  create(dto: CreateTipoCultoDto) {
    return this.prisma.tipoCulto.create({
      data: {
        nome: dto.nome,
        horario: dto.horario,
        horarioFim: dto.horarioFim ?? null,
        igrejaId: dto.igrejaId ?? null,
      },
      include: { igreja: { select: { id: true, nome: true } } },
    });
  }

  async update(id: number, dto: UpdateTipoCultoDto) {
    await this.getById(id);
    return this.prisma.tipoCulto.update({
      where: { id },
      data: {
        nome: dto.nome,
        horario: dto.horario,
        horarioFim: dto.horarioFim ?? null,
        igrejaId: dto.igrejaId ?? null,
      },
      include: { igreja: { select: { id: true, nome: true } } },
    });
  }

  async remove(id: number) {
    await this.getById(id);
    await this.prisma.tipoCulto.delete({ where: { id } });
  }
}
