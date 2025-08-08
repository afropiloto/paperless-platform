import { validate } from 'class-validator';
import { EmailPasswordLoginDto } from './email-password-login.dto';

describe('EmailPasswordLoginDto', () => {
  it('should be defined', () => {
    expect(EmailPasswordLoginDto).toBeDefined();
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = new EmailPasswordLoginDto();
      dto.email = 'test@example.com';
      dto.password = 'ValidPassword123!';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = new EmailPasswordLoginDto();
      dto.email = 'invalid-email';
      dto.password = 'ValidPassword123!';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail validation with empty email', async () => {
      const dto = new EmailPasswordLoginDto();
      dto.email = '';
      dto.password = 'ValidPassword123!';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with empty password', async () => {
      const dto = new EmailPasswordLoginDto();
      dto.email = 'test@example.com';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with password shorter than 8 characters', async () => {
      const dto = new EmailPasswordLoginDto();
      dto.email = 'test@example.com';
      dto.password = 'short';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with non-string password', async () => {
      const dto = new EmailPasswordLoginDto();
      dto.email = 'test@example.com';
      (dto as any).password = 123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });
}); 