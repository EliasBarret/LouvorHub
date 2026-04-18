import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsInt,
  IsEnum,
} from 'class-validator';
import { StatusRepertorio } from '@prisma/client';

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

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  musicasIds: number[];
}

export class UpdateRepertorioDto extends CreateRepertorioDto {}
