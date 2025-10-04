import { IsString, IsNumber, IsArray, IsEnum, IsUUID, IsOptional, Min } from 'class-validator';
import { Material } from '@prisma/client';

export class CreateDepositDto {
  @IsUUID()
  @IsOptional()
  collectionPointId?: string;

  @IsEnum(Material)
  materialType: Material;

  @IsNumber()
  @Min(0.1)
  estimatedWeight: number;

  @IsArray()
  @IsString({ each: true })
  photos: string[];

  @IsString()
  @IsOptional()
  observations?: string;
}