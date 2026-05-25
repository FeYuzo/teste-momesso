import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser: User): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    // USER role can only create users for their own company
    if (
      currentUser.role !== UserRole.ADMIN &&
      createUserDto.companyId !== currentUser.companyId
    ) {
      throw new ForbiddenException(
        'Você só pode criar usuários para sua empresa',
      );
    }

    const user = this.usersRepository.create(createUserDto);
    const saved = await this.usersRepository.save(user);
    const { password: _pw, ...result } = saved as any;
    return result;
  }

  async findAll(currentUser: User): Promise<User[]> {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.companyId',
        'user.createdAt',
        'company.id',
        'company.name',
      ])
      .orderBy('user.createdAt', 'DESC');

    if (currentUser.role !== UserRole.ADMIN) {
      query.where('user.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
    }

    return query.getMany();
  }

  async findOne(id: string, currentUser: User): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.companyId',
        'user.createdAt',
        'company.id',
        'company.name',
      ])
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      user.companyId !== currentUser.companyId
    ) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (
      currentUser.role !== UserRole.ADMIN &&
      user.companyId !== currentUser.companyId
    ) {
      throw new ForbiddenException('Acesso negado');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existing) throw new ConflictException('Email já cadastrado');
    }

    const { password, ...rest } = updateUserDto;
    Object.assign(user, rest);
    if (password) {
      user.password = password;
    }
    const saved = await this.usersRepository.save(user);
    const { password: _pw, ...result } = saved as any;
    return result;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (
      currentUser.role !== UserRole.ADMIN &&
      user.companyId !== currentUser.companyId
    ) {
      throw new ForbiddenException('Acesso negado');
    }

    await this.usersRepository.remove(user);
  }
}
