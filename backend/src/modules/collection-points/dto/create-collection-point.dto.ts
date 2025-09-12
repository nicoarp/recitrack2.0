import { IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';

export class CreateCollectionPointDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsUUID()
  facilityId: string;
}