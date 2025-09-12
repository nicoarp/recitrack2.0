import { Controller, Post, Get, Param, Body, UseGuards, Query, Patch } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { AddItemsDto } from './dto/add-items.dto';
import { WeighBatchDto } from './dto/weigh-batch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('batches')
@UseGuards(JwtAuthGuard)
export class BatchesController {
  constructor(private batchesService: BatchesService) {}

  @Post()
  async createBatch(
    @Body() dto: CreateBatchDto,
    @CurrentUser() user: any,
  ) {
    return this.batchesService.createBatch(dto, user.userId);
  }

  @Post(':id/items')
  async addItems(
    @Param('id') batchId: string,
    @Body() dto: AddItemsDto,
    @CurrentUser() user: any,
  ) {
    return this.batchesService.addItems(batchId, dto, user.userId);
  }

  @Post(':id/weigh')
  async weighBatch(
    @Param('id') batchId: string,
    @Body() dto: WeighBatchDto,
  ) {
    return this.batchesService.weighBatch(batchId, dto);
  }

  @Post(':id/close')
  async closeBatch(@Param('id') batchId: string) {
    return this.batchesService.closeBatch(batchId);
  }

  @Get('open')
  async getOpenBatches(
    @CurrentUser() user: any,
    @Query('facilityId') facilityId?: string,
  ) {
    const facility = facilityId || user.facilityId;
    if (!facility) {
      throw new Error('Facility ID requerido');
    }
    return this.batchesService.getOpenBatches(facility);
  }
}