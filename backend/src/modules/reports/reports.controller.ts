import { Controller, Get, Post, Param, Query, UseGuards, Res, ForbiddenException } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('certificate/batch/:id')
  async generateBatchCertificate(
    @Param('id') batchId: string,
    @Res() res: Response,
    @CurrentUser() user: any,
  ) {
    // Solo admin y operadores pueden generar certificados
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OPERATOR) {
      throw new ForbiddenException('No tienes permiso para generar certificados');
    }

    const pdfBuffer = await this.reportsService.generateBatchCertificate(batchId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${batchId.slice(0, 8)}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get('monthly/:organizationId')
  async generateMonthlyReport(
    @Param('organizationId') organizationId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Res() res: Response,
    @CurrentUser() user: any,
  ) {
    // Verificar permisos
    if (user.role !== UserRole.ADMIN && user.organizationId !== organizationId) {
      throw new ForbiddenException('No tienes permiso para ver este reporte');
    }

    const pdfBuffer = await this.reportsService.generateMonthlyReport(
      organizationId,
      parseInt(year),
      parseInt(month),
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${year}-${month}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get('material/:organizationId')
  async getMaterialReport(
    @Param('organizationId') organizationId: string,
    @Query('material') material?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @CurrentUser() user?: any,
  ) {
    // Verificar permisos
    if (user.role !== UserRole.ADMIN && user.organizationId !== organizationId) {
      throw new ForbiddenException('No tienes permiso para ver este reporte');
    }

    const from = dateFrom ? new Date(dateFrom) : undefined;
    const to = dateTo ? new Date(dateTo) : undefined;

    return this.reportsService.getMaterialReport(organizationId, material, from, to);
  }

  @Get('verify/:certificateNumber')
  async verifyCertificate(@Param('certificateNumber') certificateNumber: string) {
    return this.reportsService.verifyCertificate(certificateNumber);
  }
}