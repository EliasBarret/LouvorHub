import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsEnum,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { TipoMusica } from '@prisma/client';

export class CreateMusicaDto {
  @ApiProperty({ example: 'Deus de Promessas' })
  @IsString()
  titulo: string;

  @ApiPropertyOptional({ example: 'Toque no Altar' })
  @IsOptional()
  @IsString()
  artista?: string;

  @ApiPropertyOptional({ example: 'G', description: 'Tom masculino' })
  @IsOptional()
  @IsString()
  tom?: string;

  @ApiPropertyOptional({ example: 'E', description: 'Tom feminino' })
  @IsOptional()
  @IsString()
  tomFeminino?: string;

  @ApiPropertyOptional({ example: 72 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  bpm?: number;

  @ApiPropertyOptional({ type: [Number], description: 'IDs das tags' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];

  @ApiPropertyOptional({
    enum: TipoMusica,
    isArray: true,
    description: 'Tipos da música',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TipoMusica, { each: true })
  tipos?: TipoMusica[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkYoutube?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkSpotify?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class UpdateMusicaDto extends CreateMusicaDto {}
