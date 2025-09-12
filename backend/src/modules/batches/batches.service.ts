import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { AddItemsDto } from './dto/add-items.dto';
import { WeighBatchDto } from './dto/weigh-batch.dto';
import { BatchStatus, DepositStatus, UserRole } from '@prisma/client';

@Injectable()
export class BatchesService {
  constructor(private prisma: PrismaService) {}

  // Crear nuevo lote
  async createBatch(dto: CreateBatchDto, creatorId: string) {
    const batch = await this.prisma.batch.create({
      data: {
        facilityId: dto.facilityId,
        materialType: dto.materialType,
        status: BatchStatus.OPEN,
        createdBy: creatorId,
      },
      include: {
        facility: true,
        creator: true,
      },
    });

    return {
      batch,
      message: `Lote creado para material ${dto.materialType}`,
    };
  }

  // Agregar depósitos al lote
  async addItems(batchId: string, dto: AddItemsDto, userId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Lote no encontrado');
    }

    if (batch.status !== BatchStatus.OPEN) {
      throw new BadRequestException('Solo se pueden agregar items a lotes abiertos');
    }

    // Verificar que todos los depósitos existen y son válidos
    const deposits = await this.prisma.deposit.findMany({
      where: {
        id: { in: dto.depositIds },
        status: DepositStatus.VALIDATED,
        batchItem: null, // No están en ningún lote
      },
    });

    if (deposits.length !== dto.depositIds.length) {
      throw new BadRequestException('Algunos depósitos no son válidos o ya están en un lote');
    }

    // Verificar que todos son del mismo material
    const wrongMaterial = deposits.find(d => d.materialType !== batch.materialType);
    if (wrongMaterial) {
      throw new BadRequestException(`El depósito ${wrongMaterial.id} es de tipo ${wrongMaterial.materialType}, pero el lote es de ${batch.materialType}`);
    }

    // Agregar en transacción
    const result = await this.prisma.$transaction([
      // Crear batch items
      ...deposits.map(deposit => 
        this.prisma.batchItem.create({
          data: {
            batchId,
            depositId: deposit.id,
            addedBy: userId,
          },
        })
      ),
      // Actualizar estado de depósitos
      this.prisma.deposit.updateMany({
        where: { id: { in: dto.depositIds } },
        data: { status: DepositStatus.BATCHED },
      }),
    ]);

    return {
      added: deposits.length,
      message: `${deposits.length} depósitos agregados al lote`,
    };
  }

  // Registrar pesaje
  async weighBatch(batchId: string, dto: WeighBatchDto) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { _count: { select: { items: true } } },
    });

    if (!batch) {
      throw new NotFoundException('Lote no encontrado');
    }

    if (batch.status !== BatchStatus.OPEN) {
      throw new BadRequestException('Solo se pueden pesar lotes abiertos');
    }

    if (batch._count.items === 0) {
      throw new BadRequestException('No se puede pesar un lote vacío');
    }

    const netWeight = dto.grossWeight - dto.tareWeight;
    if (netWeight < 0) {
      throw new BadRequestException('El peso neto no puede ser negativo');
    }

    const updated = await this.prisma.batch.update({
      where: { id: batchId },
      data: {
        grossWeight: dto.grossWeight,
        tareWeight: dto.tareWeight,
        netWeight,
        status: BatchStatus.WEIGHED,
      },
    });

    return {
      batch: updated,
      message: `Lote pesado: ${netWeight} kg neto`,
    };
  }

  // Cerrar lote
  async closeBatch(batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Lote no encontrado');
    }

    if (batch.status !== BatchStatus.WEIGHED) {
      throw new BadRequestException('Solo se pueden cerrar lotes que han sido pesados');
    }

    const closed = await this.prisma.batch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    // Aquí se dispararía el envío a blockchain (más adelante)

    return {
      batch: closed,
      message: 'Lote cerrado exitosamente. Enviando a blockchain...',
    };
  }

  // Obtener lotes abiertos
  async getOpenBatches(facilityId: string) {
    return this.prisma.batch.findMany({
      where: {
        facilityId,
        status: BatchStatus.OPEN,
      },
      include: {
        _count: {
          select: { items: true },
        },
        creator: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}