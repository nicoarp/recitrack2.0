import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get('collector/:id')
  async getCollectorMetrics(@Param('id') collectorId: string) {
    return this.metricsService.getCollectorMetrics(collectorId);
  }

  @Get('my-metrics')
  async getMyMetrics(@CurrentUser() user: any) {
    return this.metricsService.getCollectorMetrics(user.userId);
  }

  @Get('facility/:id')
  async getFacilityMetrics(
    @Param('id') facilityId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const from = dateFrom ? new Date(dateFrom) : undefined;
    const to = dateTo ? new Date(dateTo) : undefined;
    return this.metricsService.getFacilityMetrics(facilityId, from, to);
  }

  @Get('global')
  async getGlobalMetrics() {
    return this.metricsService.getGlobalMetrics();
  }
}