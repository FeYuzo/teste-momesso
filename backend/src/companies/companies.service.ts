import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const existing = await this.companiesRepository.findOne({
      where: { cnpj: createCompanyDto.cnpj },
    });
    if (existing) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    const company = this.companiesRepository.create(createCompanyDto);
    return this.companiesRepository.save(company);
  }

  async findAll(currentUser: User): Promise<Company[]> {
    if (currentUser.role === UserRole.ADMIN) {
      return this.companiesRepository.find({
        order: { createdAt: 'DESC' },
      });
    }
    return this.companiesRepository.find({
      where: { id: currentUser.companyId },
    });
  }

  async findOne(id: string, currentUser: User): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: { id },
      relations: ['users', 'machines'],
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      company.id !== currentUser.companyId
    ) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return company;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    currentUser: User,
  ): Promise<Company> {
    const company = await this.findOne(id, currentUser);

    if (updateCompanyDto.cnpj && updateCompanyDto.cnpj !== company.cnpj) {
      const existing = await this.companiesRepository.findOne({
        where: { cnpj: updateCompanyDto.cnpj },
      });
      if (existing) {
        throw new ConflictException('CNPJ já cadastrado');
      }
    }

    Object.assign(company, updateCompanyDto);
    return this.companiesRepository.save(company);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const company = await this.findOne(id, currentUser);
    await this.companiesRepository.remove(company);
  }

  async getStats() {
    const total = await this.companiesRepository.count();
    return { total };
  }
}
