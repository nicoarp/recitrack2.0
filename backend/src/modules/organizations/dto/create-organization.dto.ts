import { IsString, IsEnum } from 'class-validator';
import { OrgType } from '@prisma/client';

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsEnum(OrgType)
  type: OrgType;

  @IsString()
  rut: string;
}