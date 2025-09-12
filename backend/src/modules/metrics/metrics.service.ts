import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  // Métricas para un recolector específico
  async getCollectorMetrics(collectorId: string) {
    const deposits = await this.prisma.deposit.findMany({
      where: { collectorId },
      include: {
        batchItem: {
          include: {
            batch: true,
          },
        },
      },
    });

    // Calcular peso total de depósitos en lotes cerrados
    const totalWeight = deposits
      .filter(d => d.batchItem?.batch?.status === 'CLOSED')
      .reduce((sum, d) => {
        return sum + Number(d.estimatedWeight);
      }, 0);

    // Agrupar por estado
    const byStatus = {
      created: deposits.filter(d => d.status === 'CREATED').length,
      validated: deposits.filter(d => d.status === 'VALIDATED').length,
      batched: deposits.filter(d => d.status === 'BATCHED').length,
    };

    // Agrupar por material
    const byMaterial = deposits.reduce((acc, d) => {
      acc[d.materialType] = (acc[d.materialType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDeposits: deposits.length,
      totalWeight: totalWeight.toFixed(2),
      estimatedCO2Saved: (totalWeight * 2.5).toFixed(2), // Factor ejemplo: 2.5 kg CO2 por kg PET
      depositsByStatus: byStatus,
      depositsByMaterial: byMaterial,
    };
  }

  // Métricas para un centro de acopio
  async getFacilityMetrics(facilityId: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = { facilityId };
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const batches = await this.prisma.batch.findMany({
      where,
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    const totalWeight = batches
      .filter(b => b.status === 'CLOSED')
      .reduce((sum, b) => sum + Number(b.netWeight || 0), 0);

    const byStatus = {
      open: batches.filter(b => b.status === 'OPEN').length,
      weighed: batches.filter(b => b.status === 'WEIGHED').length,
      closed: batches.filter(b => b.status === 'CLOSED').length,
    };

    const byMaterial = batches.reduce((acc, b) => {
      acc[b.materialType] = (acc[b.materialType] || 0) + Number(b.netWeight || 0);
      return acc;
    }, {} as Record<string, number>);

    // Depósitos pendientes de validación
    const pendingValidation = await this.prisma.deposit.count({
      where: {
        status: 'CREATED',
        collectionPoint: {
          facilityId,
        },
      },
    });

    return {
      totalBatches: batches.length,
      totalWeight: totalWeight.toFixed(2),
      batchesByStatus: byStatus,
      weightByMaterial: byMaterial,
      pendingValidation,
      averageItemsPerBatch: (
        batches.reduce((sum, b) => sum + b._count.items, 0) / batches.length || 0
      ).toFixed(1),
    };
  }

  // Métricas globales del sistema
  async getGlobalMetrics() {
    const [
      totalUsers,
      totalDeposits,
      totalBatches,
      totalOrganizations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.deposit.count(),
      this.prisma.batch.count(),
      this.prisma.organization.count(),
    ]);

    const closedBatches = await this.prisma.batch.findMany({
      where: { status: 'CLOSED' },
    });

    const totalWeight = closedBatches.reduce(
      (sum, b) => sum + Number(b.netWeight || 0),
      0
    );

    // Métricas por rol
    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // Top recolectores
    const topCollectors = await this.prisma.deposit.groupBy({
      by: ['collectorId'],
      _count: true,
      orderBy: {
        _count: {
          collectorId: 'desc',
        },
      },
      take: 5,
    });

    // Obtener nombres de los top collectors
    const collectorIds = topCollectors.map(tc => tc.collectorId);
    const collectors = await this.prisma.user.findMany({
      where: { id: { in: collectorIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const topCollectorsWithNames = topCollectors.map(tc => {
      const collector = collectors.find(c => c.id === tc.collectorId);
      return {
        name: collector ? `${collector.firstName} ${collector.lastName}` : 'Unknown',
        deposits: tc._count,
      };
    });

    return {
      overview: {
        totalUsers,
        totalDeposits,
        totalBatches,
        totalOrganizations,
        totalWeight: totalWeight.toFixed(2),
        estimatedCO2Saved: (totalWeight * 2.5).toFixed(2),
      },
      usersByRole: usersByRole.map(ur => ({
        role: ur.role,
        count: ur._count,
      })),
      topCollectors: topCollectorsWithNames,
    };
  }
}