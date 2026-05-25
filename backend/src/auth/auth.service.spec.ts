import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/entities/user.entity';

const mockUser = {
  id: 'uuid-1',
  name: 'Test User',
  email: 'test@test.com',
  password: '$2a$10$hashedpassword',
  role: UserRole.USER,
  companyId: 'company-1',
  company: { id: 'company-1', name: 'Test Co' },
  validatePassword: jest.fn(),
} as any;

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersRepository: any;

  beforeEach(async () => {
    mockUsersRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('deve retornar token e dados do usuário ao fazer login com sucesso', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword = jest.fn().mockResolvedValue(true);

      const result = await service.login({
        email: 'test@test.com',
        password: '123456',
      });

      expect(result.access_token).toBe('mock-token');
      expect(result.user.email).toBe('test@test.com');
    });

    it('deve lançar UnauthorizedException para usuário inexistente', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nao@existe.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para senha inválida', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword = jest.fn().mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
