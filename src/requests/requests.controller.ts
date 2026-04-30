import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TRequestWithUser } from '../auth/auth.types';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
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
}
