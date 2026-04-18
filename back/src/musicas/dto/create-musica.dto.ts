import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  Min,
  Max,
  IsUrl,
} from 'class-validator';

export class CreateMusicaDto {
  @ApiProperty({ example: 'Deus de Promessas' })
  @IsString()
  titulo: string;

  @ApiPropertyOptional({ example: 'Toque no Altar' })
  @IsOptional()
  @IsString()
  artista?: string;

  @ApiPropertyOptional({ example: 'G' })
  @IsOptional()
  @IsString()
  tom?: string;

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
