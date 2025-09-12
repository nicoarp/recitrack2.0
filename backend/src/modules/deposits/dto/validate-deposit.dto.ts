import { IsString, IsEnum, IsOptional } from 'class-validator';
import { Material } from '@prisma/client';

export class ValidateDepositDto {
  @IsEnum(Material)
  @IsOptional()
  correctedMaterial?: Material;

  @IsString()
  @IsOptional()
  observations?: string;
}