import { validate } from 'class-validator';
import { Request } from '../src/requests/entities/request.entity';
import { RequestStatus } from '../src/requests/enums/request.enums';
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
  });

  describe('status', () => {
    it('should default to PENDING', () => {
      expect(entity.status).toBe(RequestStatus.PENDING);
    });

    it('should accept valid status enum values', async () => {
      entity.status = RequestStatus.APPROVED;
      const errors = await validate(entity);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid status values', async () => {
      // @ts-expect-error: Testing invalid enum
      entity.status = 'INVALID';
      const errors = await validate(entity);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
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
