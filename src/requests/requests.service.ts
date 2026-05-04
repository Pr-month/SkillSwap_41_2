import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestStatus } from './enums/request.enums';

import { User } from 'src/users/entities/user.entity';
import { Request } from 'src/requests/entities/request.entity';
import { Skill } from 'src/skills/entities/skill.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Request)
    private requestsRepository: Repository<Request>,
    @InjectRepository(Skill)
    private skillRepository: Repository<Skill>,
  ) {}

  async create(dto: CreateRequestDto, userId: number) {
    const offeredSkill = await this.skillRepository.findOne({
      where: { id: dto.offeredSkillId },
      relations: {
        owner: true, // join для проверки владельца навыка
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

    const receiver = requestedSkill?.owner;

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

  findAll() {
    return `This action returns all requests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} request`;
  }

  update(id: number, updateRequestDto: UpdateRequestDto) {
    return `This action updates a #${id} request`;
  }

  remove(id: number) {
    return `This action removes a #${id} request`;
  }
}
