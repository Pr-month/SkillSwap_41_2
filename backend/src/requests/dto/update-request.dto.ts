import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RequestStatus } from '../enums/request.enums';
import { CreateRequestDto } from './create-request.dto';

export class UpdateRequestDto extends PartialType(CreateRequestDto) {
  @ApiProperty({
    description: 'Новый статус заявки',
    enum: RequestStatus,
    example: RequestStatus.ACCEPTED,
  })
  @IsEnum(RequestStatus)
  status: RequestStatus | undefined;
}
