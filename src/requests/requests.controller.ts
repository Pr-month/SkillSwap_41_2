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
import { TRequestWithUser } from '../auth/auth.types';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestsService } from './requests.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('requests')
@ApiBearerAuth()
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiOperation({
    summary: 'Создание заявки на обмен навыками',
    description: 'Создаёт запрос другому пользователю на обмен навыками: ты предлагаешь свой навык, а просишь навык другого пользователя.'
  })
  @ApiResponse({ status: 201, description: 'Заявка создана' })
  @ApiResponse({
    status: 400,
    description: 'Ошибка валидации или такая заявка уже существует',
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({
    status: 403,
    description:
      'Предлагаемый навык не принадлежит отправителю или запрашиваемый не принадлежит получателю',
  })
  @ApiResponse({
    status: 404,
    description: 'Получатель или один из навыков не найден',
  })
  @UseGuards(JwtAccessGuard)
  @Post()
  create(@Req() req: TRequestWithUser, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(req.user.sub, dto);
  }

  @ApiOperation({
    summary: 'Получение входящих заявок',
    description:
      'Возвращает заявки отправленные текущему пользователю',
  })
  @ApiResponse({ status: 200, description: 'Список входящих заявок получен' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(JwtAccessGuard)
  @Get('incoming')
  async getIncoming(@Req() req: TRequestWithUser) {
    return this.requestsService.findIncoming(req.user.sub);
  }

  @ApiOperation({
    summary: 'Получение исходящих заявок',
    description:
      'Возвращает заявки отправленные текущим пользователем',
  })
  @ApiResponse({ status: 200, description: 'Список исходящих заявок получен' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @UseGuards(JwtAccessGuard)
  @Get('outgoing')
  getOutgoing(@Req() req: TRequestWithUser) {
    return this.requestsService.findOutgoing(req.user.sub);
  }

  @ApiOperation({
    summary: 'Принятие заявки',
    description:
      'Меняет статус заявки на accepted. Принять заявку может только её получатель',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID заявки',
    format: 'uuid',
    example: '11111111-2222-3333-4444-555555555555',
  })
  @ApiResponse({ status: 200, description: 'Заявка принята' })
  @ApiResponse({ status: 400, description: 'Заявка уже обработана' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({
    status: 403,
    description: 'Только получатель может принять заявку',
  })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  @UseGuards(JwtAccessGuard)
  @Patch(':id/accept')
  accept(@Param('id', ParseUUIDPipe) id: string, @Req() req: TRequestWithUser) {
    return this.requestsService.accept(id, req.user.sub);
  }

  @ApiOperation({
    summary: 'Отклонение заявки',
    description:
      'Меняет статус заявки на rejected. Отклонить заявку может только её получатель',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID заявки',
    format: 'uuid',
    example: '11111111-2222-3333-4444-555555555555',
  })
  @ApiResponse({ status: 200, description: 'Заявка отклонена' })
  @ApiResponse({ status: 400, description: 'Заявка уже обработана' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({
    status: 403,
    description: 'Только получатель может отклонить заявку',
  })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  @UseGuards(JwtAccessGuard)
  @Patch(':id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string, @Req() req: TRequestWithUser) {
    return this.requestsService.reject(id, req.user.sub);
  }

  @ApiOperation({
    summary: 'Удаление заявки',
    description:
      'Удаляет заявку. Обычный пользователь может удалить только свою исходящую заявку. ' +
      'Администратор может удалить любую',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID заявки',
    format: 'uuid',
    example: '11111111-2222-3333-4444-555555555555',
  })
  @ApiResponse({ status: 200, description: 'Заявка удалена' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({
    status: 403,
    description:
      'Можно удалить только свою исходящую заявку (если не админ)',
  })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  @UseGuards(JwtAccessGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: TRequestWithUser) {
    return this.requestsService.remove(id, req.user);
  }

  @ApiOperation({
    summary: 'Обновление статуса заявки',
    description:
      'Изменяет статус заявки на accepted или rejected. ' +
      'Доступно получателю заявки или администратору',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID заявки',
    format: 'uuid',
    example: '11111111-2222-3333-4444-555555555555',
  })
  @ApiResponse({ status: 200, description: 'Статус заявки обновлён' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({
    status: 403,
    description:
      'Можно установить только статус accepted или rejected. ' +
      'Менять статус может только получатель или админ',
  })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
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
