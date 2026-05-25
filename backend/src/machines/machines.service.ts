import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from './entities/machine.entity';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private machinesRepository: Repository<Machine>,
  ) {}

  async create(
    createMachineDto: CreateMachineDto,
    currentUser: User,
  ): Promise<Machine> {
    const existing = await this.machinesRepository.findOne({
      where: { serialNumber: createMachineDto.serialNumber },
    });
    if (existing) {
      throw new ConflictException('Número de série já cadastrado');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      createMachineDto.companyId !== currentUser.companyId
    ) {
      throw new ForbiddenException(
        'Você só pode criar máquinas para sua empresa',
      );
    }

    const machine = this.machinesRepository.create(createMachineDto);
    return this.machinesRepository.save(machine);
  }

  async findAll(currentUser: User): Promise<Machine[]> {
    const query = this.machinesRepository
      .createQueryBuilder('machine')
      .leftJoinAndSelect('machine.company', 'company')
      .orderBy('machine.createdAt', 'DESC');

    if (currentUser.role !== UserRole.ADMIN) {
      query.where('machine.company_id = :companyId', {
        companyId: currentUser.companyId,
      });
    }

    return query.getMany();
  }

  async findOne(id: string, currentUser: User): Promise<Machine> {
    const machine = await this.machinesRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!machine) {
      throw new NotFoundException('Máquina não encontrada');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      machine.companyId !== currentUser.companyId
    ) {
      throw new NotFoundException('Máquina não encontrada');
    }

    return machine;
  }

  async update(
    id: string,
    updateMachineDto: UpdateMachineDto,
    currentUser: User,
  ): Promise<Machine> {
    const machine = await this.findOne(id, currentUser);

    if (
      updateMachineDto.serialNumber &&
      updateMachineDto.serialNumber !== machine.serialNumber
    ) {
      const existing = await this.machinesRepository.findOne({
        where: { serialNumber: updateMachineDto.serialNumber },
      });
      if (existing) throw new ConflictException('Número de série já cadastrado');
    }

    Object.assign(machine, updateMachineDto);
    return this.machinesRepository.save(machine);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const machine = await this.findOne(id, currentUser);
    await this.machinesRepository.remove(machine);
  }
}
