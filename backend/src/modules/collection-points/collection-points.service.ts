import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrCodesService } from '../qr-codes/qr-codes.service';
import { CreateCollectionPointDto } from './dto/create-collection-point.dto';

@Injectable()
export class CollectionPointsService {
  constructor(
    private prisma: PrismaService,
    private qrService: QrCodesService,
  ) {}

  async create(dto: CreateCollectionPointDto) {
  // Verificar que facility existe
  const facility = await this.prisma.facility.findUnique({
    where: { id: dto.facilityId },
  });

  if (!facility) {
    throw new NotFoundException('Facility no encontrada');
  }

  // Crear QR sin asociar aún
  const qr = await this.qrService.createDepositQr(); // Usa este método temporalmente

  // Crear punto de reciclaje
  const point = await this.prisma.collectionPoint.create({
    data: {
      ...dto,
      qrCodeId: qr.id,
    },
    include: {
      facility: true,
      qrCode: true,
    },
  });

  // Actualizar el QR para que sea tipo COLLECTION_POINT
  await this.prisma.qrCode.update({
    where: { id: qr.id },
    data: {
      type: 'COLLECTION_POINT',
      status: 'USED',
    },
  });

  return { 
    ...point, 
    qrImage: qr.qrImage 
  };
}

  // Obtener todos los puntos
  async findAll(facilityId?: string, active: boolean = true) {
    const where: any = { active };
    if (facilityId) where.facilityId = facilityId;

    return this.prisma.collectionPoint.findMany({
      where,
      include: {
        facility: {
          include: {
            organization: true,
          },
        },
        _count: {
          select: {
            deposits: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Obtener un punto
  async findOne(id: string) {
    const point = await this.prisma.collectionPoint.findUnique({
      where: { id },
      include: {
        facility: {
          include: {
            organization: true,
          },
        },
        qrCode: true,
        deposits: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            collector: true,
          },
        },
        _count: {
          select: {
            deposits: true,
          },
        },
      },
    });

    if (!point) {
      throw new NotFoundException('Punto de reciclaje no encontrado');
    }

    // Generar imagen QR si se solicita
    const qrImage = await this.qrService.generateQrImage(point.qrCodeId);

    return { ...point, qrImage };
  }

  // Actualizar punto
  async update(id: string, data: {
    name?: string;
    description?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    active?: boolean;
  }) {
    await this.findOne(id);

    return this.prisma.collectionPoint.update({
      where: { id },
      data,
    });
  }

  // Obtener puntos cercanos
  async findNearby(latitude: number, longitude: number, radiusKm: number = 5) {
    // Fórmula simple de distancia (no es 100% precisa pero sirve para este caso)
    const points = await this.prisma.collectionPoint.findMany({
      where: { active: true },
      include: {
        facility: {
          include: {
            organization: true,
          },
        },
      },
    });

    // Filtrar por distancia
    const nearbyPoints = points.filter(point => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        point.latitude,
        point.longitude
      );
      return distance <= radiusKm;
    }).map(point => ({
      ...point,
      distance: this.calculateDistance(
        latitude,
        longitude,
        point.latitude,
        point.longitude
      ),
    }));

    return nearbyPoints.sort((a, b) => a.distance - b.distance);
  }

  // Cálculo simple de distancia
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Redondear a 1 decimal
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  // Obtener QR Code del punto
  async getQRCode(id: string) {
    const point = await this.prisma.collectionPoint.findUnique({
      where: { id },
      include: {
        qrCode: true,
      },
    });

    if (!point) {
      throw new NotFoundException('Punto de reciclaje no encontrado');
    }

    // Generar imagen QR
    const qrImage = await this.qrService.generateQrImage(point.qrCodeId);

    return {
      id: point.id,
      name: point.name,
      address: point.address,
      qrCodeId: point.qrCodeId,
      qrImage: qrImage,
    };
  }

  // Desactivar punto (soft delete)
  async deactivate(id: string) {
    await this.findOne(id); // Verificar que existe

    return this.prisma.collectionPoint.update({
      where: { id },
      data: {
        active: false,
      },
      include: {
        facility: true,
        _count: {
          select: {
            deposits: true,
          },
        },
      },
    });
  }
}