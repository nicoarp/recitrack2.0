import { Controller, Post, Get, Param, Body, UseGuards, Query } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { ValidateDepositDto } from './dto/validate-deposit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('deposits')
@UseGuards(JwtAuthGuard)
export class DepositsController {
  constructor(private depositsService: DepositsService) {}

  @Post()
  async createDeposit(
    @Body() dto: CreateDepositDto,
    @CurrentUser() user: any,
  ) {
    return this.depositsService.createDeposit(dto, user.userId);
  }

  @Post(':id/validate')
  async validateDeposit(
    @Param('id') id: string,
    @Body() dto: ValidateDepositDto,
    @CurrentUser() user: any,
  ) {
    return this.depositsService.validateDeposit(
      id,
      dto,
      user.userId,
      user.role,
      user.facilityId,
    );
  }

  @Get('pending-validation')
  async getPendingValidation(
    @CurrentUser() user: any,
    @Query('facilityId') facilityId?: string,
  ) {
    const facility = facilityId || user.facilityId;
    if (!facility) {
      throw new Error('Facility ID requerido');
    }
    return this.depositsService.getPendingValidation(facility);
  }

  @Get('validated')
  async getValidatedDeposits(
    @CurrentUser() user: any,
    @Query('facilityId') facilityId?: string,
    @Query('materialType') materialType?: string,
  ) {
    const facility = facilityId || user.facilityId;
    if (!facility) {
      throw new Error('Facility ID requerido');
    }
    return this.depositsService.getValidatedDeposits(facility, materialType);
  }

  @Get('my-deposits')
  async getMyDeposits(@CurrentUser() user: any) {
    return this.depositsService.getMyDeposits(user.userId);
  }
}