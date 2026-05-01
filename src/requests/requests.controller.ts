import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
  Post,
  Patch,
  Body
} from '@nestjs/common';
import { TRequestWithUser } from '../auth/auth.types';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(JwtAccessGuard)
  @Post()
  create(@Req() req: TRequestWithUser, @Body() dto: CreateRequestDto) {
    const userId = req.user.sub;
    return this.requestsService.create(userId, dto);
  }

  @UseGuards(JwtAccessGuard)
  @Get('outgoing')
  getOutgoing(@Req() req: TRequestWithUser) {
    return this.requestsService.findOutgoing(req.user.sub);
  }

  @UseGuards(JwtAccessGuard)
  @Patch(':id/accept')
  accept(@Param('id', ParseUUIDPipe) id: string, @Req() req: TRequestWithUser) {
    return this.requestsService.accept(id, req.user.sub);
  }

  @UseGuards(JwtAccessGuard)
  @Patch(':id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string, @Req() req: TRequestWithUser) {
    return this.requestsService.reject(id, req.user.sub);
  }

  @UseGuards(JwtAccessGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: TRequestWithUser) {
    return this.requestsService.remove(id, req.user);
  }
}
