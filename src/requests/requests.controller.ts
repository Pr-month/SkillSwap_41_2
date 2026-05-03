import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TRequestWithUser } from '../auth/auth.types';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(JwtAccessGuard)
  @Get('outgoing')
  async getOutgoing(@Req() req: TRequestWithUser) {
    const userId = req.user.sub;
    return this.requestsService.findOutgoing(userId);
  }

  @UseGuards(JwtAccessGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: TRequestWithUser,
  ): Promise<void> {
    return this.requestsService.remove(id, req.user);
  }

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
