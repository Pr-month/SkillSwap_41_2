import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TRequestWithUser } from '../auth/auth.types';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestsService } from './requests.service';
import {
  ApiRequestsAccept,
  ApiRequestsCreate,
  ApiRequestsDelete,
  ApiRequestsGetIncoming,
  ApiRequestsGetOutgoing,
  ApiRequestsReject,
  ApiRequestsUpdateStatus,
} from './requests.swagger';

@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiRequestsCreate()
  @UseGuards(JwtAccessGuard)
  @Post()
  create(@Req() req: TRequestWithUser, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(req.user.sub, dto);
  }

  @ApiRequestsGetIncoming()
  @UseGuards(JwtAccessGuard)
  @Get('incoming')
  async getIncoming(@Req() req: TRequestWithUser) {
    return this.requestsService.findIncoming(req.user.sub);
  }

  @ApiRequestsGetOutgoing()
  @UseGuards(JwtAccessGuard)
  @Get('outgoing')
  getOutgoing(@Req() req: TRequestWithUser) {
    return this.requestsService.findOutgoing(req.user.sub);
  }

  @ApiRequestsAccept()
  @UseGuards(JwtAccessGuard)
  @Patch(':id/accept')
  accept(@Param('id', ParseUUIDPipe) id: string, @Req() req: TRequestWithUser) {
    return this.requestsService.accept(id, req.user.sub);
  }

  @ApiRequestsReject()
  @UseGuards(JwtAccessGuard)
  @Patch(':id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string, @Req() req: TRequestWithUser) {
    return this.requestsService.reject(id, req.user.sub);
  }

  @ApiRequestsDelete()
  @UseGuards(JwtAccessGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: TRequestWithUser) {
    return this.requestsService.remove(id, req.user);
  }

  @ApiRequestsUpdateStatus()
  @UseGuards(JwtAccessGuard)
  @Patch(':id')
  updateStatus(
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() dto: UpdateRequestDto,
    @Req() req: TRequestWithUser,
  ) {
    return this.requestsService.updateStatus(requestId, dto, req.user);
  }
}
