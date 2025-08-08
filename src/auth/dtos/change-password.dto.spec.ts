import { validate } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';

describe('ChangePasswordDto', () => {
  it('should be defined', () => {
    expect(ChangePasswordDto).toBeDefined();
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = 'OldPassword123!';
      dto.newPassword = 'NewPassword456!';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty current password', async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = '';
      dto.newPassword = 'NewPassword456!';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('currentPassword');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with empty new password', async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = 'OldPassword123!';
      dto.newPassword = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with new password shorter than 8 characters', async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = 'OldPassword123!';
      dto.newPassword = 'short';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with non-string passwords', async () => {
      const dto = new ChangePasswordDto();
      (dto as any).currentPassword = 123;
      (dto as any).newPassword = 456;

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
      expect(errors[0].property).toBe('currentPassword');
      expect(errors[1].property).toBe('newPassword');
    });
  });
}); 