import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscalacoesService } from '../escalacoes/escalacoes.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private escalacoesService: EscalacoesService,
  ) {}

  async getStats(userId: number) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const [proximosCultos, musicasEscaladas, aguardandoConfirmacao] = await Promise.all([
      this.prisma.escalacaoMusico.count({
        where: {
          usuarioId: userId,
          repertorio: { dataCulto: { gte: today } },
        },
      }),
      this.prisma.musicaEscalada.count({
        where: { escalacao: { usuarioId: userId, repertorio: { dataCulto: { gte: today } } } },
      }),
      this.escalacoesService.getPendentesCount(userId, today),
    ]);

    return [
      { icon: 'calendar_today', label: 'PRÓXIMOS CULTOS', value: proximosCultos, color: '#8B5FC0' },
      { icon: 'music_note', label: 'MÚSICAS ESCALADAS', value: musicasEscaladas, color: '#8B5FC0' },
      {
        icon: 'schedule',
        label: 'AGUARDANDO CONFIRMAÇÃO',
        value: aguardandoConfirmacao,
        color: aguardandoConfirmacao > 0 ? '#C9A84C' : '#10B981',
      },
    ];
  }

  async getEscalacoes(userId: number) {
    return this.escalacoesService.getMinhasEscalacoes(userId);
  }
}
