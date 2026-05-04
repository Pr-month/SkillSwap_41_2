import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TJwtPayload } from '../auth/auth.types';
import { Skill } from '../skills/entities/skill.entity';
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
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async create(dto: CreateRequestDto, userId: number) {
    const offeredSkill = await this.skillRepository.findOne({
      where: { id: dto.offeredSkillId },
      relations: {
        owner: true,
      },
    });

    const requestedSkill = await this.skillRepository.findOne({
      where: { id: dto.requestedSkillId },
      relations: {
        owner: true,
      },
    });

    if (!offeredSkill || !requestedSkill) {
      throw new NotFoundException('Навык не найден');
    }

    const receiver = requestedSkill.owner;

    if (!receiver) {
      throw new NotFoundException('Получатель не найден');
    }

    if (offeredSkill.owner.id !== userId) {
      throw new ForbiddenException('Нельзя предлагать чужой навык');
    }

    if (requestedSkill.owner.id === userId) {
      throw new ForbiddenException(
        'Нельзя запрашивать навык, который у вас уже есть',
      );
    }

    const request = this.requestsRepository.create({
      sender: { id: userId },
      receiver,
      offeredSkill,
      requestedSkill,
      status: RequestStatus.PENDING,
      isRead: false,
    });

    return this.requestsRepository.save(request);
  }

  async findIncoming(userId: number): Promise<Request[]> {
    return this.requestsRepository.find({
      where: {
        receiver: { id: userId },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOutgoing(userId: number): Promise<Request[]> {
    return this.requestsRepository.find({
      where: {
        sender: { id: userId },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
      order: { createdAt: 'DESC' },
    });
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

    if (![RequestStatus.ACCEPTED, RequestStatus.REJECTED].includes(newStatus)) {
      throw new ForbiddenException(
        'Можно обновить статус только до "accepted" или "rejected"',
      );
    }

    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: {
        receiver: true,
      },
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

    return this.requestsRepository.save(request);
  }
}
