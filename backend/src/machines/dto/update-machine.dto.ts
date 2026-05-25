import { IsString, IsOptional, IsUUID, Length } from 'class-validator';

export class UpdateMachineDto {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  serialNumber?: string;

  @IsOptional()
  @IsUUID('4')
  companyId?: string;
}
