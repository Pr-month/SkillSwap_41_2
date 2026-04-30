import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TJwtPayload } from '../auth/auth.types';
import { UserRole } from '../users/enums/users.enums';
import { Request } from './entities/request.entity';

type RequestUser = Pick<TJwtPayload, 'role' | 'sub'>;

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
    return 'This action adds a new request';
  }

  async remove(id: string, user: RequestUser): Promise<void> {
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
}
