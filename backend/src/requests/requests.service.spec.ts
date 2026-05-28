import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationService } from '../notification/notification.service';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/users.enums';
import { CreateRequestDto } from './dto/create-request.dto';
import { Request } from './entities/request.entity';
import { RequestStatus } from './enums/request.enums';
import { RequestsService } from './requests.service';
import { TJwtPayload } from 'src/auth/auth.types';

describe('RequestsService', () => {
  let service: RequestsService;
  let requestRepository: jest.Mocked<Repository<Request>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let skillRepository: jest.Mocked<Repository<Skill>>;
  let notificationService: jest.Mocked<NotificationService>;

  // тестовые данные
  const mockUser = {
    id: 1,
    name: 'Sender',
    email: 'sender@test.com',
    role: UserRole.USER,
  } as unknown as User;
  const mockReceiver = {
    id: 2,
    name: 'Receiver',
    email: 'receiver@test.com',
    role: UserRole.USER,
  } as unknown as User;
  const mockOfferedSkill = {
    id: 10,
    title: 'Offered Skill',
    owner: mockUser,
  } as unknown as Skill;
  const mockRequestedSkill = {
    id: 20,
    title: 'Requested Skill',
    owner: mockReceiver,
  } as unknown as Skill;
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
          provide: NotificationService,
          useValue: {
            notifyNewRequest: jest.fn(),
            notifyRequestAccepted: jest.fn(),
            notifyRequestRejected: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    requestRepository = module.get(getRepositoryToken(Request));
    userRepository = module.get(getRepositoryToken(User));
    skillRepository = module.get(getRepositoryToken(Skill));
    notificationService = module.get(NotificationService);
  });

  // после каждого теста очищаем моки
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==============================
  // Create
  // ==============================
  describe('create', () => {
    const dto: CreateRequestDto = {
      offeredSkillId: 10,
      requestedSkillId: 20,
    };
    const userId = 1;

    it('Заявка должна создаться при корректных данных', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(mockRequestedSkill);
      requestRepository.findOne.mockResolvedValueOnce(null);
      requestRepository.create.mockReturnValue(mockRequest);
      requestRepository.save.mockResolvedValue(mockRequest);
      userRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.create(userId, dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });

      // Проверяем первый вызов (offeredSkill)
      expect(skillRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: 10, status: 'active' },
        relations: ['owner'],
      });

      // Проверяем второй вызов (requestedSkill)
      expect(skillRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { id: 20, status: 'active' },
        relations: ['owner'],
      });

      const findOneArg = requestRepository.findOne.mock.calls[0]?.[0];

      expect(findOneArg).toBeDefined();

      if (!findOneArg) {
        throw new Error('findOne was not called');
      }

      expect(findOneArg).toMatchObject({
        where: {
          sender: { id: userId },
          receiver: { id: mockRequestedSkill.owner.id },
          offeredSkill: { id: dto.offeredSkillId },
          requestedSkill: { id: dto.requestedSkillId },
        },
      });
      expect(requestRepository.create).toHaveBeenCalledWith({
        sender: { id: userId },
        receiver: { id: mockRequestedSkill.owner.id },
        offeredSkill: mockOfferedSkill,
        requestedSkill: mockRequestedSkill,
        status: RequestStatus.PENDING,
        isRead: false,
      });
      expect(notificationService.notifyNewRequest).toHaveBeenCalledWith(
        mockReceiver,
        {
          requestId: mockRequest.id,
          senderName: mockUser.name,
          offeredSkillTitle: mockOfferedSkill.title,
          requestedSkillTitle: mockRequestedSkill.title,
        },
      );
      expect(result).toEqual(mockRequest);
    });

    // Остальные тесты остаются без изменений
    it('Должно отправиться уведомление с именем по умолчанию, если отправитель не найден в БД', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);

      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(mockRequestedSkill);

      requestRepository.findOne.mockResolvedValueOnce(null);
      requestRepository.create.mockReturnValue(mockRequest);
      requestRepository.save.mockResolvedValue(mockRequest);

      await service.create(userId, dto);

      expect(notificationService.notifyNewRequest).toHaveBeenCalledWith(
        mockReceiver,
        {
          requestId: mockRequest.id,
          senderName: 'Пользователь',
          offeredSkillTitle: mockOfferedSkill.title,
          requestedSkillTitle: mockRequestedSkill.title,
        },
      );
    });

    it('Должна вернуться ошибка NotFound, если получатель не найден', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.create(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Должна вернуться ошибка NotFound, если предлагаемый навык не найден', async () => {
      userRepository.findOne.mockResolvedValue(mockReceiver);
      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.create(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(userId, dto)).rejects.toThrow(
        'Предлагаемый навык не найден',
      );

      expect(requestRepository.save).not.toHaveBeenCalled();
    });

    it('Должна вернуться ошибка Forbidden, если предлагаемый навык не принадлежит отправителю', async () => {
      const skillOwnedByOther = {
        ...mockOfferedSkill,
        owner: { id: 999 } as unknown as User,
      };
      userRepository.findOne.mockResolvedValue(mockReceiver);
      skillRepository.findOne.mockResolvedValueOnce(skillOwnedByOther);
      await expect(service.create(userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('Должна создаться заявка с получателем - владельцем запрашиваемого навыка', async () => {
      const skillOwnedByOther = {
        ...mockRequestedSkill,
        owner: { id: 999, name: 'Other User' } as unknown as User,
      };

      userRepository.findOne.mockResolvedValueOnce(mockUser);
      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(skillOwnedByOther);
      requestRepository.findOne.mockResolvedValueOnce(null);
      requestRepository.create.mockReturnValue({
        ...mockRequest,
        receiver: skillOwnedByOther.owner,
        requestedSkill: skillOwnedByOther,
      });
      requestRepository.save.mockResolvedValue({
        ...mockRequest,
        receiver: skillOwnedByOther.owner,
        requestedSkill: skillOwnedByOther,
      });

      const result = await service.create(userId, dto);

      expect(requestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          receiver: { id: 999 },
          requestedSkill: skillOwnedByOther,
        }),
      );

      expect(result.receiver.id).toBe(999);
    });

    it('Должна вернуться ошибка BadRequest, если уже есть активная заявка', async () => {
      userRepository.findOne.mockResolvedValue(mockReceiver);
      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(mockRequestedSkill);
      requestRepository.findOne.mockResolvedValue(mockRequest);
      await expect(service.create(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Должна вернуться ошибка BadRequest, если уже есть активная заявка со статусом IN_PROGRESS', async () => {
      const existingRequest = {
        ...mockRequest,
        status: RequestStatus.IN_PROGRESS,
      };
      userRepository.findOne.mockResolvedValue(mockReceiver);
      skillRepository.findOne.mockResolvedValueOnce(mockOfferedSkill);
      skillRepository.findOne.mockResolvedValueOnce(mockRequestedSkill);
      requestRepository.findOne.mockResolvedValue(existingRequest);
      await expect(service.create(1, dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ==============================
  // Find Incoming
  // ==============================
  describe('findIncoming', () => {
    it('должен вернуть входящие заявки пользователя', async () => {
      const userId = 2;
      const mockIncomingRequests = [mockRequest];

      requestRepository.find.mockResolvedValue(mockIncomingRequests);

      const result = await service.findIncoming(userId);

      expect(requestRepository.find).toHaveBeenCalledWith({
        where: {
          receiver: { id: userId },
          status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
        },
        relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockIncomingRequests);
    });

    it('должен вернуть пустой массив, если нет входящих заявок', async () => {
      requestRepository.find.mockResolvedValue([]);

      const result = await service.findIncoming(999);

      expect(result).toEqual([]);
    });
  });

  // ==============================
  // Find Outgoing
  // ==============================
  describe('findOutgoing', () => {
    it('должен вернуть исходящие заявки пользователя', async () => {
      const userId = 1;
      const mockOutgoingRequests = [mockRequest];

      requestRepository.find.mockResolvedValue(mockOutgoingRequests);

      const result = await service.findOutgoing(userId);

      expect(requestRepository.find).toHaveBeenCalledWith({
        where: {
          sender: { id: userId },
          status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
        },
        relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockOutgoingRequests);
    });
  });

  // ==============================
  // Accept
  // ==============================
  describe('accept', () => {
    const requestId = '11111111-2222-3333-4444-555555555555';
    const userId = 2;

    it('должен успешно принять заявку', async () => {
      const pendingRequest = { ...mockRequest, status: RequestStatus.PENDING };
      requestRepository.findOne.mockResolvedValue(pendingRequest);
      userRepository.findOne.mockResolvedValue(mockReceiver);
      requestRepository.save.mockResolvedValue({
        ...pendingRequest,
        status: RequestStatus.ACCEPTED,
      });

      const result = await service.accept(requestId, userId);

      expect(requestRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: RequestStatus.ACCEPTED }),
      );
      expect(notificationService.notifyRequestAccepted).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Заявка принята' });
    });

    it('должен выбросить NotFoundException, если заявка не найдена', async () => {
      requestRepository.findOne.mockResolvedValue(null);

      await expect(service.accept(requestId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('должен выбросить ForbiddenException, если пользователь не получатель', async () => {
      requestRepository.findOne.mockResolvedValue(mockRequest);

      await expect(service.accept(requestId, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('должен выбросить BadRequestException, если заявка уже обработана', async () => {
      const acceptedRequest = {
        ...mockRequest,
        status: RequestStatus.ACCEPTED,
      };
      requestRepository.findOne.mockResolvedValue(acceptedRequest);

      await expect(service.accept(requestId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ==============================
  // Reject
  // ==============================
  describe('reject', () => {
    const requestId = '11111111-2222-3333-4444-555555555555';
    const userId = 2;

    it('должен успешно отклонить заявку', async () => {
      const pendingRequest = { ...mockRequest, status: RequestStatus.PENDING };
      requestRepository.findOne.mockResolvedValue(pendingRequest);
      userRepository.findOne.mockResolvedValue(mockReceiver);
      requestRepository.save.mockResolvedValue({
        ...pendingRequest,
        status: RequestStatus.REJECTED,
      });

      const result = await service.reject(requestId, userId);

      expect(requestRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: RequestStatus.REJECTED }),
      );
      expect(notificationService.notifyRequestRejected).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Заявка отклонена' });
    });

    it('должен выбросить ForbiddenException, если пользователь не получатель', async () => {
      requestRepository.findOne.mockResolvedValue(mockRequest);

      await expect(service.reject(requestId, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('должен выбросить BadRequestException, если заявка уже обработана', async () => {
      const rejectedRequest = {
        ...mockRequest,
        status: RequestStatus.REJECTED,
      };
      requestRepository.findOne.mockResolvedValue(rejectedRequest);

      await expect(service.reject(requestId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ==============================
  // Remove
  // ==============================
  describe('remove', () => {
    const requestId = '11111111-2222-3333-4444-555555555555';
    const userPayload = { sub: 1, role: UserRole.USER } as TJwtPayload;

    it('должен успешно удалить заявку отправителем', async () => {
      requestRepository.findOne.mockResolvedValue(mockRequest);
      requestRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(requestId, userPayload);

      expect(requestRepository.delete).toHaveBeenCalledWith(requestId);
    });

    it('должен выбросить NotFoundException, если заявка не найдена', async () => {
      requestRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(requestId, userPayload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('должен выбросить ForbiddenException, если пользователь не отправитель и не админ', async () => {
      const anotherUserPayload = {
        sub: 999,
        role: UserRole.USER,
      } as TJwtPayload;
      requestRepository.findOne.mockResolvedValue(mockRequest);

      await expect(
        service.remove(requestId, anotherUserPayload),
      ).rejects.toThrow(ForbiddenException);
    });

    it('должен успешно удалить заявку администратором', async () => {
      const adminPayload = { sub: 999, role: UserRole.ADMIN } as TJwtPayload;
      requestRepository.findOne.mockResolvedValue(mockRequest);
      requestRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(requestId, adminPayload);

      expect(requestRepository.delete).toHaveBeenCalledWith(requestId);
    });
  });

  // ==============================
  // UpdateStatus
  // ==============================
  describe('updateStatus', () => {
    const requestId = '11111111-2222-3333-4444-555555555555';
    const userPayload = { sub: 2, role: UserRole.USER } as TJwtPayload;

    it('должен успешно обновить статус на ACCEPTED', async () => {
      const dto = { status: RequestStatus.ACCEPTED };
      requestRepository.findOne.mockResolvedValue(mockRequest);
      requestRepository.save.mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.ACCEPTED,
      });

      const result = await service.updateStatus(requestId, dto, userPayload);

      expect(requestRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(RequestStatus.ACCEPTED);
    });

    it('должен успешно обновить статус на REJECTED', async () => {
      const dto = { status: RequestStatus.REJECTED };
      requestRepository.findOne.mockResolvedValue(mockRequest);
      requestRepository.save.mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.REJECTED,
      });

      const result = await service.updateStatus(requestId, dto, userPayload);

      expect(result.status).toBe(RequestStatus.REJECTED);
    });

    it('должен выбросить ForbiddenException при попытке обновить на недопустимый статус', async () => {
      const dto = { status: RequestStatus.PENDING };

      await expect(
        service.updateStatus(requestId, dto, userPayload),
      ).rejects.toThrow(ForbiddenException);
    });

    it('должен выбросить NotFoundException, если заявка не найдена', async () => {
      const dto = { status: RequestStatus.ACCEPTED };
      requestRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus(requestId, dto, userPayload),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить ForbiddenException, если пользователь не получатель и не админ', async () => {
      const dto = { status: RequestStatus.ACCEPTED };
      const anotherUserPayload = {
        sub: 999,
        role: UserRole.USER,
      } as TJwtPayload;
      requestRepository.findOne.mockResolvedValue(mockRequest);

      await expect(
        service.updateStatus(requestId, dto, anotherUserPayload),
      ).rejects.toThrow(ForbiddenException);
    });

    it('должен позволить администратору обновить статус', async () => {
      const dto = { status: RequestStatus.ACCEPTED };
      const adminPayload = { sub: 999, role: UserRole.ADMIN } as TJwtPayload;
      requestRepository.findOne.mockResolvedValue(mockRequest);
      requestRepository.save.mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.ACCEPTED,
      });

      const result = await service.updateStatus(requestId, dto, adminPayload);

      expect(result.status).toBe(RequestStatus.ACCEPTED);
    });
  });
});
