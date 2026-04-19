import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsInt,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatusRepertorio } from '@prisma/client';

export class MusicoEscaladoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  usuarioId: number;

  @ApiProperty({ example: 'Guitarra' })
  @IsString()
  instrumento: string;
}

export class MusicaRepertorioDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  musicaId: number;

  @ApiPropertyOptional({ type: [Number], description: 'IDs dos cantores escalados para esta música' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  cantores?: number[];

  @ApiPropertyOptional({ type: [MusicoEscaladoDto], description: 'Músicos escalados para esta música com seus instrumentos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MusicoEscaladoDto)
  musicos?: MusicoEscaladoDto[];
}

export class CreateRepertorioDto {
  @ApiProperty({ example: 'Culto de Domingo — Manhã' })
  @IsString()
  nome: string;

  @ApiProperty({ example: '2026-04-20' })
  @IsDateString()
  dataCulto: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString()
  horario?: string;

  @ApiPropertyOptional({ example: '12:00', description: 'Horário de término do culto (HH:MM)' })
  @IsOptional()
  @IsString()
  horarioFim?: string;

  @ApiProperty({ example: 'Culto de Domingo — Manhã' })
  @IsString()
  tipoCulto: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  localCulto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aviso?: string;

  @ApiPropertyOptional({ enum: StatusRepertorio })
  @IsOptional()
  @IsEnum(StatusRepertorio)
  status?: StatusRepertorio;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  igrejaId?: number;

  @ApiProperty({ type: [MusicaRepertorioDto], description: 'Músicas do repertório com cantores e músicos escalados' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MusicaRepertorioDto)
  musicas: MusicaRepertorioDto[];
}

export class UpdateRepertorioDto extends CreateRepertorioDto {}
