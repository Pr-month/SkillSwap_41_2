import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TJwtPayload } from '../auth/auth.types';
import { UserRole } from '../users/enums/users.enums';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { Request } from './entities/request.entity';
import { RequestStatus } from './requests.enum';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
  ) {}

  async findOutgoing(userId: number): Promise<Request[]> {
    return this.requestsRepository.find({
      where: {
        sender: { id: userId }, // заявки, где отправитель – текущий пользователь
        status: In([RequestStatus.Pending, RequestStatus.InProgress]), // только активные
      },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'], // подгружаем связанные сущности
      order: { createdAt: 'DESC' }, // сначала новые
    });
  }

  create(createRequestDto: CreateRequestDto) {
    return createRequestDto; // заглушка чтобы не было ошибки
  }

  async remove(id: string, user: TJwtPayload): Promise<void> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: {
        sender: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    const isSender = request.sender.id === user.sub;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isSender && !isAdmin) {
      throw new ForbiddenException('Можно удалить только исходящую заявку');
    }

    await this.requestsRepository.delete(id);
  }

  async updateStatus(
    requestId: string,
    dto: UpdateRequestDto,
    user: TJwtPayload,
  ) {
    const newStatus: RequestStatus = dto.status;

    if (![RequestStatus.Accepted, RequestStatus.Rejected].includes(newStatus)) {
      throw new ForbiddenException(
        'Можно обновить статус только до "accepted" или "rejected"',
      );
    }

    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    const isReceiver = request.receiver.id === user.sub;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isReceiver && !isAdmin) {
      throw new ForbiddenException('Недостаточно прав');
    }

    request.status = newStatus;

    return await this.requestsRepository.save(request);
  }
}
