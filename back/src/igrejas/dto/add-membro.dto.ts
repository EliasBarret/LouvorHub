import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsEnum } from 'class-validator';
import { PerfilMembro } from '@prisma/client';

export class AddMembroDto {
  @ApiProperty()
  @IsInt()
  usuarioId: number;

  @ApiProperty({ enum: PerfilMembro })
  @IsEnum(PerfilMembro)
  perfil: PerfilMembro;
}
