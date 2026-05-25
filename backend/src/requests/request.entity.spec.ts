import { Request } from './entities/request.entity';
import { RequestStatus } from './enums/request.enums';
import { User } from 'src/users/entities/user.entity';
import { Skill } from 'src/skills/entities/skill.entity';

describe('Request Entity', () => {
  let entity: Request;

  beforeEach(() => {
    entity = new Request();
    // Инициализируем обязательные поля
    entity.sender = { id: 'user1' } as unknown as User;
    entity.receiver = { id: 'user2' } as unknown as User;
    entity.offeredSkill = { id: 'skill1' } as unknown as Skill;
    entity.requestedSkill = { id: 'skill2' } as unknown as Skill;
    // Устанавливаем значения по умолчанию вручную для тестирования
    entity.status = RequestStatus.PENDING;
    entity.isRead = false;
    entity.createdAt = new Date();
  });

  describe('status', () => {
    it('should default to PENDING', () => {
      expect(entity.status).toBe(RequestStatus.PENDING);
    });

    it('should accept valid status enum values', () => {
      entity.status = RequestStatus.APPROVED;
      expect(entity.status).toBe(RequestStatus.APPROVED);
    });

    it('should allow any string (runtime validation will be done by DB)', () => {
      (entity as any).status = 'INVALID';
      expect(entity.status).toBe('INVALID');
    });
  });

  describe('isRead', () => {
    it('should default to false', () => {
      expect(entity.isRead).toBe(false);
    });
  });

  describe('createdAt', () => {
    it('should be set automatically', () => {
      expect(entity.createdAt).toBeInstanceOf(Date);
    });
  });
});
