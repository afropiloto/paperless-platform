import { Test, TestingModule } from '@nestjs/testing';
import { AccountUsersService } from './account-users.service';
import { AccountUsersRepository } from './account-users.repository';
import { PermissionsValidationService } from './services/permissions-validation.service';
import { AccountsService } from '../accounts/accounts.service';
import { PasswordService } from '../auth/services/password.service';
import { CreateAccountUserDto } from './dtos';
import { AuthMethod } from './schemas';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AccountUsersService', () => {
  let service: AccountUsersService;
  let repository: AccountUsersRepository;
  let accountsService: AccountsService;
  let passwordService: PasswordService;

  const mockRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findByAccountId: jest.fn(),
    findByWalletAddress: jest.fn(),
    findByEmail: jest.fn(),
    findAllByAccountId: jest.fn(),
    updateAccountUserStatus: jest.fn(),
  };

  const mockAccountsService = {
    accountExists: jest.fn(),
  };

  const mockPasswordService = {
    generateSecurePassword: jest.fn(),
    hashPassword: jest.fn(),
    validatePassword: jest.fn(),
  };

  const mockPermissionsValidationService = {
    validatePermissions: jest.fn(),
    getValidModules: jest.fn(),
    getValidRoles: jest.fn(),
    getValidCombinations: jest.fn(),
    getValidRolesForModule: jest.fn(),
    getValidModulesForRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountUsersService,
        {
          provide: AccountUsersRepository,
          useValue: mockRepository,
        },
        {
          provide: PermissionsValidationService,
          useValue: mockPermissionsValidationService,
        },
        {
          provide: AccountsService,
          useValue: mockAccountsService,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    service = module.get<AccountUsersService>(AccountUsersService);
    repository = module.get<AccountUsersRepository>(AccountUsersRepository);
    accountsService = module.get<AccountsService>(AccountsService);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAccountUser', () => {
    const baseCreateDto: CreateAccountUserDto = {
      accountId: '507f1f77bcf86cd799439011',
      name: 'Test User',
      emailAddress: 'test@example.com',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      permissions: [
        { module: 'DealDesk', role: 'Supervisor' },
      ],
    };

    it('should create account user with SIWE auth method', async () => {
      mockAccountsService.accountExists.mockResolvedValue(true);
      mockRepository.create.mockResolvedValue({
        id: '507f1f77bcf86cd799439012',
        ...baseCreateDto,
        status: 'Active',
        authMethod: AuthMethod.SIWE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createAccountUser({
        ...baseCreateDto,
        authMethod: AuthMethod.SIWE,
      });

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...baseCreateDto,
        authMethod: AuthMethod.SIWE,
      });
      expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
    });

    it('should create account user with email/password auth method and generate temporary password', async () => {
      const temporaryPassword = 'TempPass123!';
      const hashedPassword = '$2b$12$hashedpassword';
      
      mockAccountsService.accountExists.mockResolvedValue(true);
      mockPasswordService.generateSecurePassword.mockReturnValue(temporaryPassword);
      mockPasswordService.validatePassword.mockReturnValue({ isValid: true, errors: [] });
      mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
      mockRepository.create.mockResolvedValue({
        id: '507f1f77bcf86cd799439012',
        ...baseCreateDto,
        status: 'Active',
        authMethod: AuthMethod.EMAIL_PASSWORD,
        passwordHash: hashedPassword,
        passwordChanged: false,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createAccountUser({
        ...baseCreateDto,
        authMethod: AuthMethod.EMAIL_PASSWORD,
      });

      expect(result).toBeDefined();
      expect(mockPasswordService.generateSecurePassword).toHaveBeenCalled();
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(temporaryPassword);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...baseCreateDto,
        authMethod: AuthMethod.EMAIL_PASSWORD,
        passwordHash: hashedPassword,
        passwordChanged: false,
        failedLoginAttempts: 0,
      });
    });

    it('should create account user with email/password auth method using provided temporary password', async () => {
      const providedPassword = 'ProvidedPass123!';
      const hashedPassword = '$2b$12$hashedpassword';
      
      mockAccountsService.accountExists.mockResolvedValue(true);
      mockPasswordService.validatePassword.mockReturnValue({ isValid: true, errors: [] });
      mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
      mockRepository.create.mockResolvedValue({
        id: '507f1f77bcf86cd799439012',
        ...baseCreateDto,
        status: 'Active',
        authMethod: AuthMethod.EMAIL_PASSWORD,
        passwordHash: hashedPassword,
        passwordChanged: false,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createAccountUser({
        ...baseCreateDto,
        authMethod: AuthMethod.EMAIL_PASSWORD,
        temporaryPassword: providedPassword,
      });

      expect(result).toBeDefined();
      expect(mockPasswordService.generateSecurePassword).not.toHaveBeenCalled();
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(providedPassword);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...baseCreateDto,
        authMethod: AuthMethod.EMAIL_PASSWORD,
        temporaryPassword: providedPassword,
        passwordHash: hashedPassword,
        passwordChanged: false,
        failedLoginAttempts: 0,
      });
    });

    it('should throw error if temporary password does not meet policy', async () => {
      mockAccountsService.accountExists.mockResolvedValue(true);
      mockPasswordService.validatePassword.mockReturnValue({ 
        isValid: false, 
        errors: ['Password must be at least 8 characters long'] 
      });

      await expect(service.createAccountUser({
        ...baseCreateDto,
        authMethod: AuthMethod.EMAIL_PASSWORD,
        temporaryPassword: 'weak',
      })).rejects.toThrow(BadRequestException);

      expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if account does not exist', async () => {
      mockAccountsService.accountExists.mockResolvedValue(false);

      await expect(service.createAccountUser(baseCreateDto)).rejects.toThrow(NotFoundException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if account ID is invalid', async () => {
      await expect(service.createAccountUser({
        ...baseCreateDto,
        accountId: 'invalid-id',
      })).rejects.toThrow(BadRequestException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should handle BOTH auth method and generate temporary password', async () => {
      const temporaryPassword = 'TempPass123!';
      const hashedPassword = '$2b$12$hashedpassword';
      
      mockAccountsService.accountExists.mockResolvedValue(true);
      mockPasswordService.generateSecurePassword.mockReturnValue(temporaryPassword);
      mockPasswordService.validatePassword.mockReturnValue({ isValid: true, errors: [] });
      mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
      mockRepository.create.mockResolvedValue({
        id: '507f1f77bcf86cd799439012',
        ...baseCreateDto,
        status: 'Active',
        authMethod: AuthMethod.BOTH,
        passwordHash: hashedPassword,
        passwordChanged: false,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createAccountUser({
        ...baseCreateDto,
        authMethod: AuthMethod.BOTH,
      });

      expect(result).toBeDefined();
      expect(mockPasswordService.generateSecurePassword).toHaveBeenCalled();
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(temporaryPassword);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...baseCreateDto,
        authMethod: AuthMethod.BOTH,
        passwordHash: hashedPassword,
        passwordChanged: false,
        failedLoginAttempts: 0,
      });
    });

    it('should validate provided temporary password against policy', async () => {
      const weakPassword = 'weak';
      
      mockAccountsService.accountExists.mockResolvedValue(true);
      mockPasswordService.validatePassword.mockReturnValue({ 
        isValid: false, 
        errors: ['Password must be at least 8 characters long', 'Password must contain at least one uppercase letter'] 
      });

      await expect(service.createAccountUser({
        ...baseCreateDto,
        authMethod: AuthMethod.EMAIL_PASSWORD,
        temporaryPassword: weakPassword,
      })).rejects.toThrow(BadRequestException);

      expect(mockPasswordService.validatePassword).toHaveBeenCalledWith(weakPassword);
      expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should log when generating temporary password', async () => {
      const temporaryPassword = 'TempPass123!';
      const hashedPassword = '$2b$12$hashedpassword';
      
      mockAccountsService.accountExists.mockResolvedValue(true);
      mockPasswordService.generateSecurePassword.mockReturnValue(temporaryPassword);
      mockPasswordService.validatePassword.mockReturnValue({ isValid: true, errors: [] });
      mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
      mockRepository.create.mockResolvedValue({
        id: '507f1f77bcf86cd799439012',
        ...baseCreateDto,
        status: 'Active',
        authMethod: AuthMethod.EMAIL_PASSWORD,
        passwordHash: hashedPassword,
        passwordChanged: false,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.createAccountUser({
        ...baseCreateDto,
        authMethod: AuthMethod.EMAIL_PASSWORD,
      });

      expect(logSpy).toHaveBeenCalledWith(`Generated temporary password for user ${baseCreateDto.emailAddress}`);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
