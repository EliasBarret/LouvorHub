import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMusicaDto, UpdateMusicaDto } from './dto/create-musica.dto';

const TAGS_DEFAULT = [
  { nome: 'Adoração', cor: '#8B5FC0' },
  { nome: 'Celebração', cor: '#C9A84C' },
  { nome: 'Lenta', cor: '#6B7280' },
  { nome: 'Animada', cor: '#10B981' },
  { nome: 'Evangelismo', cor: '#EF4444' },
  { nome: 'Santa Ceia', cor: '#3B82F6' },
  { nome: 'Ofertório', cor: '#F59E0B' },
  { nome: 'Louvor', cor: '#EC4899' },
  { nome: 'Oração', cor: '#8B5CF6' },
  { nome: 'Infantil', cor: '#06B6D4' },
];

const TONS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
];

const INSTRUMENTOS = [
  'Violão', 'Guitarra', 'Baixo', 'Teclado', 'Bateria',
  'Vocais', 'Flauta', 'Saxofone', 'Trompete', 'Violino',
  'Gaita', 'Percussão', 'Pandeiro', 'Cajon',
];

@Injectable()
export class MusicasService {
  constructor(private prisma: PrismaService) {}

  async getAll(page = 0, size = 50) {
    const [musicas, total] = await this.prisma.$transaction([
      this.prisma.musica.findMany({
        skip: page * size,
        take: size,
        include: { tags: { include: { tag: true } } },
        orderBy: { titulo: 'asc' },
      }),
      this.prisma.musica.count(),
    ]);
    return {
      conteudo: musicas.map(this.format),
      total,
      pagina: page,
      tamanhoPagina: size,
    };
  }

  async getById(id: number) {
    const musica = await this.prisma.musica.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
    if (!musica) throw new NotFoundException('Música não encontrada.');
    return this.format(musica);
  }

  async create(dto: CreateMusicaDto, userId: number) {
    const musica = await this.prisma.musica.create({
      data: {
        titulo: dto.titulo,
        artista: dto.artista ?? '',
        tom: dto.tom ?? '',
        bpm: dto.bpm ?? 0,
        linkYoutube: dto.linkYoutube ?? '',
        linkSpotify: dto.linkSpotify ?? '',
        observacoes: dto.observacoes ?? '',
        criadoPorId: userId,
        tags: dto.tagIds?.length
          ? { create: dto.tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: { tags: { include: { tag: true } } },
    });
    return this.format(musica);
  }

  async update(id: number, dto: UpdateMusicaDto) {
    await this.getById(id);
    if (dto.tagIds !== undefined) {
      await this.prisma.musicaTag.deleteMany({ where: { musicaId: id } });
    }
    const musica = await this.prisma.musica.update({
      where: { id },
      data: {
        ...(dto.titulo && { titulo: dto.titulo }),
        ...(dto.artista !== undefined && { artista: dto.artista }),
        ...(dto.tom !== undefined && { tom: dto.tom }),
        ...(dto.bpm !== undefined && { bpm: dto.bpm ?? 0 }),
        ...(dto.linkYoutube !== undefined && { linkYoutube: dto.linkYoutube }),
        ...(dto.linkSpotify !== undefined && { linkSpotify: dto.linkSpotify }),
        ...(dto.observacoes !== undefined && { observacoes: dto.observacoes }),
        ...(dto.tagIds?.length && {
          tags: { create: dto.tagIds.map((tagId) => ({ tagId })) },
        }),
      },
      include: { tags: { include: { tag: true } } },
    });
    return this.format(musica);
  }

  async remove(id: number) {
    await this.getById(id);
    await this.prisma.musica.delete({ where: { id } });
  }

  async getTags() {
    return this.prisma.tag.findMany({ orderBy: { nome: 'asc' } });
  }

  getTons() {
    return TONS;
  }

  getInstrumentos() {
    return INSTRUMENTOS;
  }

  async seedTagsIfEmpty() {
    const count = await this.prisma.tag.count();
    if (count === 0) {
      await this.prisma.tag.createMany({ data: TAGS_DEFAULT });
    }
  }

  private format(musica: any) {
    return {
      ...musica,
      tags: musica.tags?.map((mt: any) => mt.tag?.nome ?? mt).filter(Boolean) ?? [],
    };
  }
}
