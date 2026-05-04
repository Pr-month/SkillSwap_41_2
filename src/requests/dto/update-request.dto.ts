import { PartialType } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RequestStatus } from '../requests.enum';
import { CreateRequestDto } from './create-request.dto';

export class UpdateRequestDto extends PartialType(CreateRequestDto) {
  @IsEnum(RequestStatus)
  status: RequestStatus;
}
