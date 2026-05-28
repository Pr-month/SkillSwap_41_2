import { validate } from 'class-validator';
import { CreateRequestDto } from './dto/create-request.dto';

describe('CreateRequestDto', () => {
  let dto: CreateRequestDto;

  beforeEach(() => {
    dto = new CreateRequestDto();
    dto.offeredSkillId = 2;
    dto.requestedSkillId = 3;
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
      expect(errors[0].constraints).toHaveProperty('isInt');
    });

    it('should fail validation when offeredSkillId is empty', async () => {
      // @ts-expect-error: Testing missing value
      dto.offeredSkillId = undefined;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('offeredSkillId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
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
      expect(errors[0].constraints).toHaveProperty('isInt');
    });

    it('should fail validation when requestedSkillId is empty', async () => {
      // @ts-expect-error: Testing missing value
      dto.requestedSkillId = undefined;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('requestedSkillId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });
});
