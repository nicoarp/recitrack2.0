import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { BatchStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private pdfGenerator: PdfGeneratorService,
  ) {}

  // Generar certificado para un lote
  async generateBatchCertificate(batchId: string): Promise<Buffer> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        facility: {
          include: {
            organization: true,
          },
        },
        items: {
          include: {
            deposit: {
              include: {
                collector: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Lote no encontrado');
    }

    if (batch.status !== BatchStatus.CLOSED) {
      throw new Error('Solo se pueden generar certificados para lotes cerrados');
    }

    // Verificar si ya existe un certificado
let certificate = await this.prisma.certificate.findUnique({
  where: { batchId },
});

// Si no existe, crearlo
if (!certificate) {
  certificate = await this.prisma.certificate.create({
    data: {
      batchId,
      certificateNumber: `CERT-${batch.id.slice(0, 8).toUpperCase()}-${Date.now()}`,
      pdfUrl: 'generated-in-memory',
      metadata: {
        generatedAt: new Date(),
        organization: batch.facility.organization.name,
        facility: batch.facility.name,
        weight: batch.netWeight,
      },
    },
  });
}

    // Generar PDF
    const pdfBuffer = await this.pdfGenerator.generateBatchCertificate({
      batch,
      organization: batch.facility.organization,
      facility: batch.facility,
      itemCount: batch.items.length,
    });

    return pdfBuffer;
  }

  // Generar reporte mensual
  async generateMonthlyReport(organizationId: string, year: number, month: number): Promise<Buffer> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organización no encontrada');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Obtener todos los lotes del período
    const batches = await this.prisma.batch.findMany({
      where: {
        facility: {
          organizationId,
        },
        status: BatchStatus.CLOSED,
        closedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        facility: true,
      },
    });

    // Calcular estadísticas
    const totalWeight = batches.reduce((sum, b) => sum + Number(b.netWeight || 0), 0);
    
    const materialBreakdown = batches.reduce((acc, batch) => {
      const material = batch.materialType;
      const weight = Number(batch.netWeight || 0);
      acc[material] = (acc[material] || 0) + weight;
      return acc;
    }, {} as Record<string, number>);

    // Generar PDF
    const pdfBuffer = await this.pdfGenerator.generateMonthlyReport({
      organization,
      startDate,
      endDate,
      batches,
      totalWeight,
      materialBreakdown,
    });

    return pdfBuffer;
  }

  // Obtener reporte por tipo de material
  async getMaterialReport(
    organizationId: string,
    materialType?: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    const where: any = {
      facility: {
        organizationId,
      },
      status: BatchStatus.CLOSED,
    };

    if (materialType) {
      where.materialType = materialType;
    }

    if (dateFrom || dateTo) {
      where.closedAt = {};
      if (dateFrom) where.closedAt.gte = dateFrom;
      if (dateTo) where.closedAt.lte = dateTo;
    }

    const batches = await this.prisma.batch.findMany({
      where,
      include: {
        facility: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: {
        closedAt: 'desc',
      },
    });

    const totalWeight = batches.reduce((sum, b) => sum + Number(b.netWeight || 0), 0);
    const totalDeposits = batches.reduce((sum, b) => sum + b._count.items, 0);

    const byFacility = batches.reduce((acc, batch) => {
      const facilityName = batch.facility.name;
      if (!acc[facilityName]) {
        acc[facilityName] = {
          batches: 0,
          weight: 0,
          deposits: 0,
        };
      }
      acc[facilityName].batches++;
      acc[facilityName].weight += Number(batch.netWeight || 0);
      acc[facilityName].deposits += batch._count.items;
      return acc;
    }, {} as Record<string, any>);

    return {
      summary: {
        totalBatches: batches.length,
        totalWeight,
        totalDeposits,
        averageWeightPerBatch: batches.length > 0 ? (totalWeight / batches.length).toFixed(2) : 0,
      },
      byFacility,
      batches,
    };
  }

  // Verificar certificado
  async verifyCertificate(certificateNumber: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { certificateNumber },
      include: {
        batch: {
          include: {
            facility: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificado no encontrado');
    }

    return {
      valid: true,
      certificate,
      batch: certificate.batch,
      organization: certificate.batch.facility.organization,
    };
  }
}