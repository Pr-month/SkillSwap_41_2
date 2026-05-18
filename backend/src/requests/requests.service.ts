import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TJwtPayload } from '../auth/auth.types';
import { NotificationGateway } from '../notification/notification.gateway';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
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
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(userId: number, dto: CreateRequestDto) {
    const receiver = await this.usersRepository.findOne({
      where: { id: dto.receiverId },
    });
    if (!receiver) throw new NotFoundException('Получатель не найден');

    const offeredSkill = await this.skillsRepository.findOne({
      where: { id: dto.offeredSkillId },
      relations: ['owner'],
    });
    if (!offeredSkill) {
      throw new NotFoundException('Предлагаемый навык не найден');
    }
    if (offeredSkill.owner.id !== userId) {
      throw new ForbiddenException('Вы можете предлагать только свои навыки');
    }

    const requestedSkill = await this.skillsRepository.findOne({
      where: { id: dto.requestedSkillId },
      relations: ['owner'],
    });
    if (!requestedSkill) {
      throw new NotFoundException('Запрашиваемый навык не найден');
    }
    if (requestedSkill.owner.id !== receiver.id) {
      throw new ForbiddenException(
        'Запрашиваемый навык должен принадлежать получателю',
      );
    }

    const existing = await this.requestsRepository.findOne({
      where: {
        sender: { id: userId },
        receiver: { id: receiver.id },
        offeredSkill: { id: offeredSkill.id },
        requestedSkill: { id: requestedSkill.id },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Такая заявка уже существует и не завершена',
      );
    }

    const request = this.requestsRepository.create({
      sender: { id: userId },
      receiver: { id: receiver.id },
      offeredSkill,
      requestedSkill,
      status: RequestStatus.PENDING,
      isRead: false,
    });
    const saved = await this.requestsRepository.save(request);

    const sender = await this.usersRepository.findOne({
      where: { id: userId },
    });
    const senderName = sender?.name ?? 'Пользователь';

    this.notificationGateway.sendNotification(receiver.id, 'new_request', {
      requestId: saved.id,
      senderName,
      offeredSkillTitle: offeredSkill.title,
      requestedSkillTitle: requestedSkill.title,
    });

    return saved;
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

  async accept(requestId: string, userId: number) {
    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
    });
    if (!request) throw new NotFoundException('Заявка не найдена');
    if (request.receiver.id !== userId) {
      throw new ForbiddenException('Только получатель может принять заявку');
    }
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Заявка уже обработана');
    }

    request.status = RequestStatus.ACCEPTED;
    await this.requestsRepository.save(request);

    const receiver = await this.usersRepository.findOne({
      where: { id: userId },
    });
    const receiverName = receiver?.name ?? 'Получатель';

    this.notificationGateway.sendNotification(
      request.sender.id,
      'request_accepted',
      {
        requestId: request.id,
        receiverName,
        offeredSkillTitle: request.offeredSkill.title,
      },
    );

    return { message: 'Заявка принята' };
  }

  async reject(requestId: string, userId: number) {
    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: ['sender', 'receiver'],
    });
    if (!request) throw new NotFoundException('Заявка не найдена');
    if (request.receiver.id !== userId) {
      throw new ForbiddenException('Только получатель может отклонить заявку');
    }
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Заявка уже обработана');
    }

    request.status = RequestStatus.REJECTED;
    await this.requestsRepository.save(request);

    const receiver = await this.usersRepository.findOne({
      where: { id: userId },
    });
    const receiverName = receiver?.name ?? 'Получатель';

    this.notificationGateway.sendNotification(
      request.sender.id,
      'request_rejected',
      {
        requestId: request.id,
        receiverName,
      },
    );

    return { message: 'Заявка отклонена' };
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
    const newStatus = dto.status as RequestStatus;

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
