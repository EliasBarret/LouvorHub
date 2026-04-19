import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Matches, MinLength } from 'class-validator';

export class CreateTipoCultoDto {
  @ApiProperty({ example: 'Culto de Domingo — Manhã' })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiProperty({ example: '09:00', description: 'Horário de início do culto (HH:MM)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Horário deve estar no formato HH:MM' })
  horario: string;

  @ApiPropertyOptional({ example: '11:00', description: 'Horário de término do culto (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Horário de fim deve estar no formato HH:MM' })
  horarioFim?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID da igreja (opcional)' })
  @IsOptional()
  @IsInt()
  igrejaId?: number;
}

export class UpdateTipoCultoDto extends CreateTipoCultoDto {}
