import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
} from 'class-validator';

export class UpdatePerfilDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  funcao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ministerio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instrumentos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataMembro?: string;
}
