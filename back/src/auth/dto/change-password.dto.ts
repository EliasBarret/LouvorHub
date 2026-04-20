import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'senhaAtual123' })
  @IsString()
  senhaAtual: string;

  @ApiProperty({ example: 'novaSenha456' })
  @IsString()
  @MinLength(6, { message: 'Nova senha deve ter no mínimo 6 caracteres.' })
  novaSenha: string;
}
