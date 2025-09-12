import { IsArray, IsUUID } from 'class-validator';

export class AddItemsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  depositIds: string[];
}