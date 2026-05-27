import { validate } from 'class-validator';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestStatus } from './enums/request.enums';

describe('UpdateRequestDto', () => {
  let dto: UpdateRequestDto;

  beforeEach(() => {
    dto = new UpdateRequestDto();
    dto.status = RequestStatus.PENDING;
  });

  describe('status', () => {
    it('should pass validation with valid status', async () => {
      dto.status = RequestStatus.PENDING;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with other valid statuses', async () => {
      const validStatuses = [
        RequestStatus.APPROVED,
        RequestStatus.REJECTED,
        RequestStatus.CANCELLED,
      ];

      for (const status of validStatuses) {
        dto.status = status;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should fail validation with invalid status', async () => {
      // @ts-expect-error: Testing invalid enum value
      dto.status = 'INVALID_STATUS';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should allow undefined status (PartialType)', async () => {
      // Статус может быть undefined благодаря PartialType
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  // Наследование валидации от CreateRequestDto
  describe('inherited fields from CreateRequestDto', () => {
    it('should validate offeredSkillId correctly', async () => {
      dto.offeredSkillId = 456;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate requestedSkillId correctly', async () => {
      dto.requestedSkillId = 789;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
