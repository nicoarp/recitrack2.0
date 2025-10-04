import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { QrCodesService } from './qr-codes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('qr')
@UseGuards(JwtAuthGuard)
export class QrCodesController {
  constructor(private qrCodesService: QrCodesService) {}

  @Post('resolve')
  async resolveQr(@Body('qrCode') qrCode: string) {
    return this.qrCodesService.resolveQr(qrCode);
  }

  @Post('generate-deposit')
  async generateDepositQr() {
    return this.qrCodesService.createDepositQr();
  }
}