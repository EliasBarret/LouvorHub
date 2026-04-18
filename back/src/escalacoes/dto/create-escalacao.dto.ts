import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class MusicaEscaladaDto {
  @ApiProperty()
  @IsInt()
  musicaId: number;

  @ApiProperty({ example: 'Violão' })
  @IsString()
  instrumento: string;
}

export class CreateEscalacaoDto {
  @ApiProperty()
  @IsInt()
  repertorioId: number;

  @ApiProperty()
  @IsInt()
  usuarioId: number;

  @ApiProperty({ type: [MusicaEscaladaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MusicaEscaladaDto)
  musicasEscaladas: MusicaEscaladaDto[];
}
