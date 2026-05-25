import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class CreateMachineDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @Length(2, 255)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Número de série é obrigatório' })
  @Length(2, 255)
  serialNumber: string;

  @IsUUID('4', { message: 'companyId inválido' })
  companyId: string;
}
