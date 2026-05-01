import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TJwtPayload } from '../auth/auth.types';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { RequestStatus } from './requests.enum';
import { NotificationGateway } from '../notification/notification.gateway';
import { CreateRequestDto } from './dto/create-request.dto';
import { UserRole } from '../users/enums/users.enums';
import { Request } from './entities/request.entity';

type RequestUser = Pick<TJwtPayload, 'role' | 'sub'>;

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private requestsRepository: Repository<Request>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
    private notificationGateway: NotificationGateway,
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

  // Создание заявки на обмен
async create(userId: number, dto: CreateRequestDto) {
  // Проверяем получателя
  const receiver = await this.usersRepository.findOne({ where: { id: dto.receiverId } });
  if (!receiver) throw new NotFoundException('Получатель не найден');

  // Проверяем предлагаемый навык
  const offeredSkill = await this.skillsRepository.findOne({ 
    where: { id: dto.offeredSkillId }, 
    relations: ['owner'] 
  });
  if (!offeredSkill) throw new NotFoundException('Предлагаемый навык не найден');
  if (offeredSkill.owner.id !== userId) 
    throw new ForbiddenException('Вы можете предлагать только свои навыки');

  // Проверяем запрашиваемый навык
  const requestedSkill = await this.skillsRepository.findOne({ 
    where: { id: dto.requestedSkillId }, 
    relations: ['owner'] 
  });
  if (!requestedSkill) throw new NotFoundException('Запрашиваемый навык не найден');
  if (requestedSkill.owner.id !== receiver.id)
    throw new ForbiddenException('Запрашиваемый навык должен принадлежать получателю');

  // Проверка дубликата активной заявки
  const existing = await this.requestsRepository.findOne({
    where: {
      sender: { id: userId },
      receiver: { id: receiver.id },
      offeredSkill: { id: offeredSkill.id },
      requestedSkill: { id: requestedSkill.id },
      status: In([RequestStatus.Pending, RequestStatus.InProgress]),
    },
  });
  if (existing) throw new BadRequestException('Такая заявка уже существует и не завершена');

  const request = this.requestsRepository.create({
    sender: { id: userId },
    receiver: { id: receiver.id },
    offeredSkill,
    requestedSkill,
    status: RequestStatus.Pending,
  });
  const saved = await this.requestsRepository.save(request);

  // Получаем имя отправителя для уведомления (с проверкой)
  const sender = await this.usersRepository.findOne({ where: { id: userId } });
  const senderName = sender?.name ?? 'Пользователь';

  this.notificationGateway.sendNotification(receiver.id, 'new_request', {
    requestId: saved.id,
    senderName: senderName,
    offeredSkillTitle: offeredSkill.title,
    requestedSkillTitle: requestedSkill.title,
  });

  return saved;
}

  // Принятие заявки (только получатель)
async accept(requestId: string, userId: number) {
  const request = await this.requestsRepository.findOne({
    where: { id: requestId },
    relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
  });
  if (!request) throw new NotFoundException('Заявка не найдена');
  if (request.receiver.id !== userId) throw new ForbiddenException('Только получатель может принять заявку');
  if (request.status !== RequestStatus.Pending) throw new BadRequestException('Заявка уже обработана');
  // Обновляем статус
  request.status = RequestStatus.Accepted;
  await this.requestsRepository.save(request);

  const receiver = await this.usersRepository.findOne({ where: { id: userId } });
  const receiverName = receiver?.name ?? 'Получатель';
    // Здесь по ТЗ нужно добавить навыки в поле skills пользователей
    // (это можно реализовать позже, сейчас только уведомление)

    // Уведомляем отправителя
  this.notificationGateway.sendNotification(request.sender.id, 'request_accepted', {
    requestId: request.id,
    receiverName: receiverName,
    offeredSkillTitle: request.offeredSkill.title,
  });

  return { message: 'Заявка принята' };
} 
  
  // Отклонение заявки (только получатель)
async reject(requestId: string, userId: number) {
  const request = await this.requestsRepository.findOne({
    where: { id: requestId },
    relations: ['sender', 'receiver'],
  });
  if (!request) throw new NotFoundException('Заявка не найдена');
  if (request.receiver.id !== userId) throw new ForbiddenException('Только получатель может отклонить заявку');
  if (request.status !== RequestStatus.Pending) throw new BadRequestException('Заявка уже обработана');

  request.status = RequestStatus.Rejected;
  await this.requestsRepository.save(request);

  const receiver = await this.usersRepository.findOne({ where: { id: userId } });
  const receiverName = receiver?.name ?? 'Получатель';
  // Уведомляем отправителя
  this.notificationGateway.sendNotification(request.sender.id, 'request_rejected', {
    requestId: request.id,
    receiverName: receiverName,
  });

  return { message: 'Заявка отклонена' };
}
}
