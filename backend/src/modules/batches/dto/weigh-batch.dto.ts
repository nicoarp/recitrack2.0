import { IsNumber, Min } from 'class-validator';

export class WeighBatchDto {
  @IsNumber()
  @Min(0)
  grossWeight: number;

  @IsNumber()
  @Min(0)
  tareWeight: number;
}