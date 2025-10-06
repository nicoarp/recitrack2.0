// backend/src/modules/qr-codes/qr-codes.controller.ts
import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { QrCodesService } from './qr-codes.service';

@Controller('qr')
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) {}

  // Endpoint público para resolver QR escaneado
  @Post('resolve')
  async resolveQr(@Body('qrCode') qrCode: string) {
    return this.qrCodesService.resolveQr(qrCode);
  }

  // Generar QR para punto de recolección (requiere auth)
  @Post('collection-point')
  @UseGuards(JwtAuthGuard)
  async createCollectionPointQr(@Body('collectionPointId') collectionPointId: string) {
    return this.qrCodesService.createCollectionPointQr(collectionPointId);
  }

  // Generar QR para depósito (requiere auth)
  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  async createDepositQr() {
    return this.qrCodesService.createDepositQr();
  }

  // Obtener mis códigos QR (requiere auth)
  @Get('my-codes')
  @UseGuards(JwtAuthGuard)
  async getMyQRCodes(@Req() req: any) {
    const userId = req.user.id;
    return this.qrCodesService.getUserQRCodes(userId);
  }

  // MANTENER el endpoint existente para compatibilidad
  @Post('generate-deposit')
  @UseGuards(JwtAuthGuard)
  async generateDepositQr() {
    return this.qrCodesService.createDepositQr();
  }
}