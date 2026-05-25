import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { User, UserRole } from '../users/entities/user.entity';

const mockCompany: Company = {
  id: 'uuid-1',
  name: 'Test Company',
  cnpj: '12.345.678/0001-90',
  createdAt: new Date(),
  users: [],
  machines: [],
};

const adminUser = { id: 'admin-1', role: UserRole.ADMIN, companyId: 'uuid-1' } as User;
const regularUser = { id: 'user-1', role: UserRole.USER, companyId: 'uuid-1' } as User;

describe('CompaniesService', () => {
  let service: CompaniesService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: getRepositoryToken(Company),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  describe('create', () => {
    it('deve criar uma empresa com sucesso', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockCompany);
      mockRepository.save.mockResolvedValue(mockCompany);

      const result = await service.create({
        name: 'Test Company',
        cnpj: '12.345.678/0001-90',
      });

      expect(result).toEqual(mockCompany);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('deve lançar ConflictException se CNPJ já existir', async () => {
      mockRepository.findOne.mockResolvedValue(mockCompany);

      await expect(
        service.create({ name: 'Test', cnpj: '12.345.678/0001-90' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('ADMIN deve ver todas as empresas', async () => {
      mockRepository.find.mockResolvedValue([mockCompany]);

      const result = await service.findAll(adminUser);
      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });

    it('USER deve ver apenas sua empresa', async () => {
      mockRepository.find.mockResolvedValue([mockCompany]);

      await service.findAll(regularUser);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { id: regularUser.companyId },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar empresa se encontrada e autorizada', async () => {
      mockRepository.findOne.mockResolvedValue(mockCompany);

      const result = await service.findOne('uuid-1', adminUser);
      expect(result).toEqual(mockCompany);
    });

    it('deve lançar NotFoundException se empresa não existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('uuid-999', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('USER não deve acessar empresa de outra companhia', async () => {
      const otherCompany = { ...mockCompany, id: 'other-id' };
      mockRepository.findOne.mockResolvedValue(otherCompany);

      const otherUser = { ...regularUser, companyId: 'uuid-1' } as User;
      await expect(service.findOne('other-id', otherUser)).rejects.toThrow(NotFoundException);
    });
  });
});
