import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsEnum } from 'class-validator';

export enum StatusConfirmacaoEnum {
  CONHECE = 'conhece',
  NAO_CONHECE = 'nao_conhece',
}

export class ConfirmacaoDto {
  @ApiProperty()
  @IsInt()
  escalacaoMusicoId: number;

  @ApiProperty()
  @IsInt()
  musicaId: number;

  @ApiProperty({ enum: StatusConfirmacaoEnum })
  @IsEnum(StatusConfirmacaoEnum)
  status: StatusConfirmacaoEnum;
}
