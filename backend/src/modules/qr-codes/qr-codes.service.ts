import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';
import { QrType, QrStatus } from '@prisma/client';

@Injectable()
export class QrCodesService {
  constructor(private prisma: PrismaService) {}

  async generateQrImage(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data);
    } catch (error) {
      throw new Error('Error generando imagen QR');
    }
  }

  async resolveQr(qrId: string): Promise<any> {
    const qr = await this.prisma.qrCode.findUnique({
      where: { id: qrId },
      include: {
        collectionPoint: {
          include: {
            facility: true,
          },
        },
        deposit: {
          include: {
            collector: true,
            collectionPoint: true,
          },
        },
      },
    });

    if (!qr) {
      throw new NotFoundException('Código QR no válido');
    }

    if (qr.type === QrType.COLLECTION_POINT && qr.collectionPoint) {
  return {
    type: 'COLLECTION_POINT',
    status: 'ACTIVE',
    data: {
      pointId: qr.collectionPoint.id,
      name: qr.collectionPoint.name,
      address: qr.collectionPoint.address,
      facilityId: qr.collectionPoint.facilityId,
    },
    action: 'CREATE_DEPOSIT',
  };
}

    if (qr.type === QrType.DEPOSIT) {
      return {
        type: 'DEPOSIT', 
        status: qr.status,
        data: {
          depositId: qr.deposit?.id,
          material: qr.deposit?.materialType,
          estimatedWeight: qr.deposit?.estimatedWeight,
          collectorName: `${qr.deposit?.collector.firstName} ${qr.deposit?.collector.lastName}`,
          createdAt: qr.deposit?.createdAt,
        },
        action: qr.deposit?.status === 'CREATED' ? 'VALIDATE_DEPOSIT' : 'VIEW_ONLY',
      };
    }

    return {
      type: qr.type,
      status: qr.status,
      action: 'UNKNOWN',
    };
  }

  async createCollectionPointQr(collectionPointId: string): Promise<any> {
    const point = await this.prisma.collectionPoint.findUnique({
      where: { id: collectionPointId },
    });

    if (!point) {
      throw new NotFoundException('Punto de reciclaje no encontrado');
    }

    const qr = await this.prisma.qrCode.create({
      data: {
        type: QrType.COLLECTION_POINT,
        status: QrStatus.USED,
        collectionPoint: {
          connect: { id: collectionPointId },
        },
      },
    });

    const qrImage = await this.generateQrImage(qr.id);

    return {
      id: qr.id,
      type: qr.type,
      pointName: point.name,
      qrImage,
    };
  }

  async createDepositQr(): Promise<any> {
    const qr = await this.prisma.qrCode.create({
      data: {
        type: QrType.DEPOSIT,
        status: QrStatus.AVAILABLE,
      },
    });

    const qrImage = await this.generateQrImage(qr.id);

    return {
      id: qr.id,
      type: qr.type,
      status: qr.status,
      qrImage,
    };
  }

  async claimQr(qrId: string, depositId: string): Promise<any> {
    const qr = await this.prisma.qrCode.findUnique({
      where: { id: qrId },
    });

    if (!qr) {
      throw new NotFoundException('QR no encontrado');
    }

    if (qr.status !== QrStatus.AVAILABLE) {
      throw new Error('Este QR ya fue utilizado');
    }

    const updatedQr = await this.prisma.qrCode.update({
      where: { id: qrId },
      data: {
        status: QrStatus.CLAIMED,
        claimedAt: new Date(),
        deposit: {
          connect: { id: depositId },
        },
      },
    });

    return updatedQr;
  }
}