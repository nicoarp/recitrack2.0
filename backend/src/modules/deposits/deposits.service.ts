import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrCodesService } from '../qr-codes/qr-codes.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { ValidateDepositDto } from './dto/validate-deposit.dto';
import { DepositStatus, Material, UserRole } from '@prisma/client';


@Injectable()
export class DepositsService {
  constructor(
    private prisma: PrismaService,
    private qrService: QrCodesService,
  ) {}

  // Crear depósito (María escanea QR del punto)
  async createDeposit(dto: CreateDepositDto, collectorId: string) {
  // Solo verificar si se proporciona collectionPointId
  if (dto.collectionPointId) {
    const collectionPoint = await this.prisma.collectionPoint.findUnique({
      where: { id: dto.collectionPointId },
    });

    if (!collectionPoint) {
      throw new NotFoundException('Punto de reciclaje no encontrado');
    }
  }
    // Crear QR para este depósito
    const qr = await this.qrService.createDepositQr();

    // Crear depósito
    const deposit = await this.prisma.deposit.create({
      data: {
        qrCodeId: qr.id,
        collectorId,
        collectionPointId: dto.collectionPointId || null, 
        materialType: dto.materialType,
        estimatedWeight: dto.estimatedWeight,
        photos: dto.photos,
        observations: dto.observations,
        status: DepositStatus.CREATED,
      },
      include: {
        collector: true,
        collectionPoint: true,
      },
    });

    // Reclamar el QR para este depósito
    await this.qrService.claimQr(qr.id, deposit.id);

    return {
      deposit,
      qr: {
        id: qr.id,
        image: qr.qrImage,
      },
    };
  }

  // Validar depósito (Centro de acopio escanea y valida)
  async validateDeposit(
    depositId: string, 
    dto: ValidateDepositDto, 
    validatorId: string,
    validatorRole: string,
    facilityId?: string,
  ) {
    // Solo operadores pueden validar
    if (validatorRole !== UserRole.OPERATOR) {
      throw new ForbiddenException('Solo operadores pueden validar depósitos');
    }

    const deposit = await this.prisma.deposit.findUnique({
      where: { id: depositId },
      include: {
        validation: true,
        collectionPoint: true,
      },
    });

    if (!deposit) {
      throw new NotFoundException('Depósito no encontrado');
    }

    // Verificar que no esté ya validado
    if (deposit.validation) {
      throw new BadRequestException('Este depósito ya fue validado');
    }

    // Verificar que el depósito corresponde al facility del operador
    if (facilityId && deposit.collectionPoint && deposit.collectionPoint.facilityId !== facilityId) {
      throw new ForbiddenException('No puedes validar depósitos de otros centros');
    }

    // Crear validación y actualizar depósito
    const [validation, updatedDeposit] = await this.prisma.$transaction([
      // Crear registro de validación
      this.prisma.validation.create({
        data: {
          depositId,
          validatedBy: validatorId,
          originalMaterial: deposit.materialType,
          correctedMaterial: dto.correctedMaterial,
          observations: dto.observations,
        },
      }),
      // Actualizar depósito
      this.prisma.deposit.update({
        where: { id: depositId },
        data: {
          status: DepositStatus.VALIDATED,
          materialType: dto.correctedMaterial || deposit.materialType,
          observations: dto.observations || deposit.observations,
        },
      }),
    ]);

    return {
      validation,
      deposit: updatedDeposit,
      message: 'Depósito validado correctamente',
    };
  }

  // Obtener depósitos pendientes de validación para un centro
  async getPendingValidation(facilityId: string) {
    return this.prisma.deposit.findMany({
      where: {
        status: DepositStatus.CREATED,
        collectionPoint: {
          facilityId,
        },
      },
      include: {
        collector: true,
        collectionPoint: true,
        qrCode: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Obtener depósitos validados disponibles para agrupar en lote
  async getValidatedDeposits(facilityId: string, materialType?: string) {
    return this.prisma.deposit.findMany({
      where: {
        status: DepositStatus.VALIDATED,
        collectionPoint: {
          facilityId,
        },
        ...(materialType && { materialType: materialType as Material}),
        batchItem: null, // No están en ningún lote aún
      },
      include: {
        collector: true,
        validation: {
          include: {
            validator: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  // Obtener mis depósitos (para recolectores)
  async getMyDeposits(collectorId: string) {
    const deposits = await this.prisma.deposit.findMany({
      where: { collectorId },
      include: {
        collectionPoint: true,
        validation: true,
        batchItem: {
          include: {
            batch: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular estadísticas
    const stats = {
      total: deposits.length,
      created: deposits.filter(d => d.status === DepositStatus.CREATED).length,
      validated: deposits.filter(d => d.status === DepositStatus.VALIDATED).length,
      batched: deposits.filter(d => d.status === DepositStatus.BATCHED).length,
    };

    return { deposits, stats };
  }
}