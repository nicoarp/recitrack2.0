import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateFacilityDto {
  @IsUUID()
  organizationId: string;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}