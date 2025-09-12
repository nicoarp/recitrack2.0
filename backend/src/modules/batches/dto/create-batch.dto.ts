import { IsEnum, IsUUID } from 'class-validator';
import { Material } from '@prisma/client';

export class CreateBatchDto {
  @IsEnum(Material)
  materialType: Material;

  @IsUUID()
  facilityId: string;
}