import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TJwtPayload } from '../auth/auth.types';
import { NotificationGateway } from '../notification/notification.gateway';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/users.enums';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { Request } from './entities/request.entity';
import { RequestStatus } from './requests.enum';
import { RequestsService } from './requests.service';

describe('RequestsService', () => {
  let service: RequestsService;
  let requestRepository: jest.Mocked<Repository<Request>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let skillRepository: jest.Mocked<Repository<Skill>>;
  let notificationGateway: jest.Mocked<NotificationGateway>;

  // тестовые данные
  const mockUser = { id: 1, name: 'Sender', email: 'sender@test.com', role: UserRole.USER } as unknown as User;
  const mockReceiver = { id: 2, name: 'Receiver', email: 'receiver@test.com', role: UserRole.USER } as unknown as User;
  const mockOfferedSkill = { id: 10, title: 'Offered Skill', owner: mockUser } as unknown as Skill;
  const mockRequestedSkill = { id: 20, title: 'Requested Skill', owner: mockReceiver } as unknown as Skill;
  const mockRequest = {
    id: '11111111-2222-3333-4444-555555555555',
    status: RequestStatus.PENDING,
    sender: mockUser,
    receiver: mockReceiver,
    offeredSkill: mockOfferedSkill,
    requestedSkill: mockRequestedSkill,
    isRead: false,
    createdAt: new Date(),
  } as Request;

  // перед каждым тестом инициализируем сервис
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(Request),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: NotificationGateway,
          useValue: {
            sendNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    requestRepository = module.get(getRepositoryToken(Request));
    userRepository = module.get(getRepositoryToken(User));
    skillRepository = module.get(getRepositoryToken(Skill));
    notificationGateway = module.get(NotificationGateway);
  });

  // после каждого теста очищаем моки
  afterEach(() => {
    jest.clearAllMocks();
  });

  // тестируем создание заявки
  describe('create', () => {
    const dto: CreateRequestDto = {
      receiverId: 2,
      offeredSkillId: 10,
      requestedSkillId: 20,
    };
    const userId = 1;

    it('Заявка должна создаться при корректных данных', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockReceiver);
      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(mockRequestedSkill);
      requestRepository.findOne.mockResolvedValueOnce(null);
      requestRepository.create.mockReturnValue(mockRequest);
      requestRepository.save.mockResolvedValue(mockRequest);
      userRepository.findOne.mockResolvedValueOnce(mockUser); 

      const result = await service.create(userId, dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(skillRepository.findOne).toHaveBeenCalledWith({ where: { id: 10 }, relations: ['owner'] });
      expect(skillRepository.findOne).toHaveBeenCalledWith({ where: { id: 20 }, relations: ['owner'] });
      expect(requestRepository.findOne).toHaveBeenCalledWith({
        where: {
          sender: { id: userId },
          receiver: { id: dto.receiverId },
          offeredSkill: { id: dto.offeredSkillId },
          requestedSkill: { id: dto.requestedSkillId },
          status: expect.any(Object),
        },
      });
      expect(requestRepository.create).toHaveBeenCalledWith({
        sender: { id: userId },
        receiver: { id: dto.receiverId },
        offeredSkill: mockOfferedSkill,
        requestedSkill: mockRequestedSkill,
        status: RequestStatus.PENDING,
        isRead: false,
      });
      expect(notificationGateway.sendNotification).toHaveBeenCalledWith(
        mockReceiver.id,
        'new_request',
        expect.objectContaining({
          requestId: mockRequest.id,
          senderName: mockUser.name,
          offeredSkillTitle: mockOfferedSkill.title,
          requestedSkillTitle: mockRequestedSkill.title,
        }),
      );
      expect(result).toEqual(mockRequest);
    });

    it('Должно отправиться уведомление с именем по умолчанию, если отправитель не найден в БД', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockReceiver);
      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(mockRequestedSkill);
      requestRepository.findOne.mockResolvedValueOnce(null);
      requestRepository.create.mockReturnValue(mockRequest);
      requestRepository.save.mockResolvedValue(mockRequest);
      userRepository.findOne.mockResolvedValueOnce(null);
      await service.create(userId, dto);
      expect(notificationGateway.sendNotification).toHaveBeenCalledWith(
        mockReceiver.id,
        'new_request',
        expect.objectContaining({ senderName: 'Пользователь' })
      );
    });

    it('Должна вернуться ошибка NotFound, если получатель не найден', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('Должна вернуться ошибка NotFound, если запрашиваемый навык не найден', async () => {
      userRepository.findOne.mockResolvedValue(mockReceiver);
      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(userId, dto)).rejects.toThrow('Запрашиваемый навык не найден');
      
      expect(requestRepository.save).not.toHaveBeenCalled();
    });

    it('Должна вернуться ошибка Forbidden, если предлагаемый навык не принадлежит отправителю', async () => {
      const skillOwnedByOther = { ...mockOfferedSkill, owner: { id: 999 } as unknown as User };
      userRepository.findOne.mockResolvedValue(mockReceiver);
      skillRepository.findOne.mockResolvedValueOnce(skillOwnedByOther);
      await expect(service.create(userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('Должна вернуться ошибка Forbidden, если запрашиваемый навык не принадлежит получателю', async () => {
      const skillOwnedByOther = { ...mockRequestedSkill, owner: { id: 999 } as unknown as User };
      userRepository.findOne.mockResolvedValue(mockReceiver);
      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(skillOwnedByOther);
      await expect(service.create(userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('Должна вернуться ошибка BadRequest, если уже есть активная заявка', async () => {
      userRepository.findOne.mockResolvedValue(mockReceiver);
      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(mockRequestedSkill);
      requestRepository.findOne.mockResolvedValue(mockRequest);
      await expect(service.create(userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('Должна вернуться ошибка BadRequest, если уже есть активная заявка со статусом IN_PROGRESS', async () => {
      const existingRequest = { ...mockRequest, status: RequestStatus.IN_PROGRESS };
      userRepository.findOne.mockResolvedValue(mockReceiver);
      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(mockRequestedSkill);
      requestRepository.findOne.mockResolvedValue(existingRequest);
      await expect(service.create(1, dto)).rejects.toThrow(BadRequestException);
    });
  });

  // тестирование поиска входящих заявок
  describe('findIncoming', () => {
    it('Должны вернуться найденные входящие заявки для пользователя', async () => {
      const incomingRequests = [mockRequest];
      requestRepository.find.mockResolvedValue(incomingRequests);
      const result = await service.findIncoming(2);
      expect(requestRepository.find).toHaveBeenCalledWith({
        where: {
          receiver: { id: 2 },
          status: expect.arrayContaining([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
        },
        relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(incomingRequests);
    });

    it('Должен вернуться пустой массив, если входящих заявок нет', async () => {
      requestRepository.find.mockResolvedValue([]);
      const result = await service.findIncoming(2);
      expect(result).toEqual([]);
    });
  });

  // тестирование поиска исходящих заявок
  describe('findOutgoing', () => {
    it('Должны вернуться найденные исходящие заявки для пользователя', async () => {
      const outgoingRequests = [mockRequest];
      requestRepository.find.mockResolvedValue(outgoingRequests);
      const result = await service.findOutgoing(1);
      expect(requestRepository.find).toHaveBeenCalledWith({
        where: {
          sender: { id: 1 },
          status: expect.arrayContaining([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
        },
        relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(outgoingRequests);
    });

    it('Должен вернуться пустой массив, если исходящих заявок нет', async () => {
      requestRepository.find.mockResolvedValue([]);
      const result = await service.findOutgoing(1);
      expect(result).toEqual([]);
    });
  });

  // тестирование принятия заявки
  describe('accept', () => {
    const requestId = mockRequest.id;
    const userId = 2;

    it('Заявка должна приняться и отправиться уведомление', async () => {
      const pendingRequest = { ...mockRequest, status: RequestStatus.PENDING };
      requestRepository.findOne.mockResolvedValue(pendingRequest);
      userRepository.findOne.mockResolvedValue(mockReceiver);
      requestRepository.save.mockResolvedValue({ ...pendingRequest, status: RequestStatus.ACCEPTED });

      const result = await service.accept(requestId, userId);

      expect(requestRepository.findOne).toHaveBeenCalledWith({
        where: { id: requestId },
        relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
      });
      expect(requestRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: RequestStatus.ACCEPTED }));
      expect(notificationGateway.sendNotification).toHaveBeenCalledWith(
        mockRequest.sender.id,
        'request_accepted',
        expect.objectContaining({ requestId, receiverName: mockReceiver.name }),
      );
      expect(result).toEqual({ message: 'Заявка принята' });
    });

    it('Должено отправиться уведомление с именем по умолчанию, если получатель не найден в БД', async () => {
      const pendingRequest = { ...mockRequest, status: RequestStatus.PENDING };
      requestRepository.findOne.mockResolvedValue(pendingRequest);
      userRepository.findOne.mockResolvedValue(null); // получатель не найден
      requestRepository.save.mockResolvedValue({ ...pendingRequest, status: RequestStatus.ACCEPTED } as unknown as Request);
      await service.accept(requestId, userId);
      expect(notificationGateway.sendNotification).toHaveBeenCalledWith(
        mockRequest.sender.id,
        'request_accepted',
        expect.objectContaining({ receiverName: 'Получатель' })
      );
    });

    it('Должна вернуться ошибка NotFound, если заявка не найдена', async () => {
      requestRepository.findOne.mockResolvedValue(null);
      await expect(service.accept(requestId, userId)).rejects.toThrow(NotFoundException);
    });

    it('Должна вернуться ошибка Forbidden, если пользователь не получатель', async () => {
      const requestWithOtherReceiver = { ...mockRequest, receiver: { id: 999 } };
      requestRepository.findOne.mockResolvedValue(requestWithOtherReceiver as any);
      await expect(service.accept(requestId, userId)).rejects.toThrow(ForbiddenException);
    });

    it('Должна вернуться ошибка BadRequest, если заявка уже обработана', async () => {
      const processedRequest = { ...mockRequest, status: RequestStatus.ACCEPTED };
      requestRepository.findOne.mockResolvedValue(processedRequest);
      await expect(service.accept(requestId, userId)).rejects.toThrow(BadRequestException);
    });
  });

  // тестирование отклонения заявки
  describe('reject', () => {
    const requestId = mockRequest.id;
    const userId = 2;

    it('Должна отклониться заявка и отправиться уведомление', async () => {
      const pendingRequest = { ...mockRequest, status: RequestStatus.PENDING };
      requestRepository.findOne.mockResolvedValue(pendingRequest);
      userRepository.findOne.mockResolvedValue(mockReceiver);
      requestRepository.save.mockResolvedValue({ ...pendingRequest, status: RequestStatus.REJECTED } as unknown as Request);

      const result = await service.reject(requestId, userId);
      expect(result).toEqual({ message: 'Заявка отклонена' });
    });

    it('Должно отправиться уведомление с именем по умолчанию, если получатель не найден в БД', async () => {
      const pendingRequest = { ...mockRequest, status: RequestStatus.PENDING };
      requestRepository.findOne.mockResolvedValue(pendingRequest);
      userRepository.findOne.mockResolvedValue(null);
      requestRepository.save.mockResolvedValue({ ...pendingRequest, status: RequestStatus.REJECTED } as unknown as Request);
      await service.reject(requestId, userId);
      expect(notificationGateway.sendNotification).toHaveBeenCalledWith(
        mockRequest.sender.id,
        'request_rejected',
        expect.objectContaining({ receiverName: 'Получатель' })
      );
    });

    it('Должна вернуться ошибка NotFound, если заявка не найдена', async () => {
      requestRepository.findOne.mockResolvedValue(null);
      await expect(service.reject(requestId, userId)).rejects.toThrow(NotFoundException);
    });

    it('Должна вернуться ошибка Forbidden, если пользователь не получатель', async () => {
      const requestWithOtherReceiver = { ...mockRequest, receiver: { id: 999 } as unknown as User };
      requestRepository.findOne.mockResolvedValue(requestWithOtherReceiver);
      await expect(service.reject(requestId, userId)).rejects.toThrow(ForbiddenException);
    });

    it('Должна вернуться ошибка BadRequest, если заявка уже обработана', async () => {
      const processedRequest = { ...mockRequest, status: RequestStatus.REJECTED };
      requestRepository.findOne.mockResolvedValue(processedRequest);
      await expect(service.reject(requestId, userId)).rejects.toThrow(BadRequestException);
    });
  });

  // тестирование удаления заявки
  describe('remove', () => {
    const requestId = mockRequest.id;
    const userPayload: TJwtPayload = { sub: 1, email: 'sender@test.com', name: 'Sender', role: UserRole.USER };
    const adminPayload: TJwtPayload = { ...userPayload, role: UserRole.ADMIN };

    it('Должна удалиться заявка, если пользователь её отправитель', async () => {
      requestRepository.findOne.mockResolvedValue({ ...mockRequest, sender: mockUser });
      await service.remove(requestId, userPayload);
      expect(requestRepository.delete).toHaveBeenCalledWith(requestId);
    });

    it('Должна удалиться заявка, если пользователь администратор', async () => {
      requestRepository.findOne.mockResolvedValue(mockRequest);
      await service.remove(requestId, adminPayload);
      expect(requestRepository.delete).toHaveBeenCalledWith(requestId);
    });

    it('Должна вернуться ошибка NotFound, если заявка не найдена', async () => {
      requestRepository.findOne.mockResolvedValue(null);
      await expect(service.remove(requestId, userPayload)).rejects.toThrow(NotFoundException);
    });

    it('Должна вернуться ошибка Forbidden, если пользователь не отправитель и не администратор', async () => {
      const otherSender = { id: 999, name: 'Other', email: 'other@test.com', role: UserRole.USER } as unknown as User;
      const requestWithOtherSender = { ...mockRequest, sender: otherSender };
      requestRepository.findOne.mockResolvedValue(requestWithOtherSender);
      await expect(service.remove(requestId, userPayload)).rejects.toThrow(ForbiddenException);
    });
  });

  // тестируем изменение статуса заявки
  describe('updateStatus', () => {
    const requestId = mockRequest.id;
    const userPayload: TJwtPayload = { sub: 2, email: 'receiver@test.com', name: 'Receiver', role: UserRole.USER };
    const adminPayload: TJwtPayload = { ...userPayload, role: UserRole.ADMIN };

    it('Должен обновиться статус на accepted, если пользователь получатель', async () => {
      const dto: UpdateRequestDto = { status: RequestStatus.ACCEPTED };
      const pendingRequest = { ...mockRequest, receiver: mockReceiver, status: RequestStatus.PENDING };
      requestRepository.findOne.mockResolvedValue(pendingRequest as any);
      requestRepository.save.mockResolvedValue({ ...pendingRequest, status: RequestStatus.ACCEPTED } as unknown as Request);

      const result = await service.updateStatus(requestId, dto, userPayload);
      expect(requestRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: RequestStatus.ACCEPTED }));
      expect(result.status).toBe(RequestStatus.ACCEPTED);
    });

    it('Должен обновиться статус на accepted, если пользователь администратор (даже не получатель)', async () => {
      const dto: UpdateRequestDto = { status: RequestStatus.ACCEPTED };
      const pendingRequest = { ...mockRequest, receiver: { id: 999 } as unknown as User, status: RequestStatus.PENDING };
      requestRepository.findOne.mockResolvedValue(pendingRequest);
      requestRepository.save.mockResolvedValue({ ...pendingRequest, status: RequestStatus.ACCEPTED } as unknown as Request);
      const result = await service.updateStatus(requestId, dto, adminPayload);
      expect(result.status).toBe(RequestStatus.ACCEPTED);
    });

    it('Должен обновиться статус на rejected, если пользователь администратор', async () => {
      const dto: UpdateRequestDto = { status: RequestStatus.REJECTED };
      const pendingRequest = { ...mockRequest, receiver: mockReceiver, status: RequestStatus.PENDING };
      requestRepository.findOne.mockResolvedValue(pendingRequest as any);
      requestRepository.save.mockResolvedValue({ ...pendingRequest, status: RequestStatus.REJECTED } as unknown as Request);

      const result = await service.updateStatus(requestId, dto, adminPayload);
      expect(result.status).toBe(RequestStatus.REJECTED);
    });

    it('Должна вернуться ошибка Forbidden, если статус не accepted/rejected', async () => {
      const dto: UpdateRequestDto = { status: RequestStatus.PENDING };
      await expect(service.updateStatus(requestId, dto, userPayload)).rejects.toThrow(ForbiddenException);
    });

    it('Должна вернуться ошибка NotFound, если заявка не найдена', async () => {
      const dto: UpdateRequestDto = { status: RequestStatus.ACCEPTED };
      requestRepository.findOne.mockResolvedValue(null);
      await expect(service.updateStatus(requestId, dto, userPayload)).rejects.toThrow(NotFoundException);
    });

    it('Должна вернуться ошибка Forbidden, если пользователь не получатель и не администратор', async () => {
      const dto: UpdateRequestDto = { status: RequestStatus.ACCEPTED };
      const requestWithOtherReceiver = { ...mockRequest, receiver: { id: 999 } as unknown as User };
      requestRepository.findOne.mockResolvedValue(requestWithOtherReceiver as any);
      await expect(service.updateStatus(requestId, dto, userPayload)).rejects.toThrow(ForbiddenException);
    });
  });
});
