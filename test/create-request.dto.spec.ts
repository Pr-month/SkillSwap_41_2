import { validate } from 'class-validator';
import { CreateRequestDto } from '../src/requests/dto/create-request.dto';

describe('CreateRequestDto', () => {
  let dto: CreateRequestDto;

  beforeEach(() => {
    dto = new CreateRequestDto();
  });

  describe('receiverId', () => {
    it('should pass validation with valid integer', async () => {
      dto.receiverId = 123;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when receiverId is not an integer', async () => {
      // @ts-expect-error: Testing invalid type
      dto.receiverId = 'not-a-number';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('receiverId');
      expect(errors[0].constraints).toHaveProperty('isInt');
    });

    it('should fail validation when receiverId is empty', async () => {
      // @ts-expect-error: Testing missing value
      dto.receiverId = undefined;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('receiverId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('offeredSkillId', () => {
    it('should pass validation with valid integer', async () => {
      dto.offeredSkillId = 456;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when offeredSkillId is not an integer', async () => {
      // @ts-expect-error: Testing invalid type
      dto.offeredSkillId = 'invalid';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('offeredSkillId');
    });
  });

  describe('requestedSkillId', () => {
    it('should pass validation with valid integer', async () => {
      dto.requestedSkillId = 789;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when requestedSkillId is not an integer', async () => {
      // @ts-expect-error: Testing invalid type
      dto.requestedSkillId = null;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('requestedSkillId');
    });
  });
});
