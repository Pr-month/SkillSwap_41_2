import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { TRequestWithUser } from '../auth/auth.types';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(JwtAccessGuard)
  @Post()
  async create(
    @Res() res: TRequestWithUser,
    @Body() createRequestDto: CreateRequestDto,
  ) {
    return this.requestsService.create(
      createRequestDto,
      res.user.sub as number,
    );
  }

  @UseGuards(JwtAccessGuard)
  @Get('incoming')
  findAll(@Req() req: TRequestWithUser) {
    return this.requestsService.findAll(req.user.sub as number);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRequestDto: UpdateRequestDto) {
    return this.requestsService.update(+id, updateRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requestsService.remove(+id);
  }
}
