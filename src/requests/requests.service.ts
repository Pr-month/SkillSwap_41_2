import {
  BadRequestException,
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
    // Проврка существования получателя
    const receiver = await this.userRepository.findOne({
      where: { id: dto.receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Получатель не найден');
    }

    // Проврка существования навыков
    const offeredSkill = await this.skillRepository.findOne({
      where: { id: dto.offeredSkillId },
      relations: {
        owner: true, // для проверки владельца
      },
    });

    const requestedSkill = await this.skillRepository.findOne({
      where: { id: dto.requestedSkillId },
    });

    if (!offeredSkill || !requestedSkill) {
      throw new NotFoundException('Навык не найден');
    }

    if (offeredSkill.owner.id !== userId) {
      throw new ForbiddenException('Нельзя предлагать чужой навык');
    }

    if (dto.receiverId === userId) {
      throw new BadRequestException('Нельзя отправить заявку самому себе');
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
