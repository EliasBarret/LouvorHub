import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateIgrejaDto {
  @ApiProperty({ example: 'Igreja Reviver em Cristo' })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiPropertyOptional({ example: 'Recife' })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class UpdateIgrejaDto extends CreateIgrejaDto {}
