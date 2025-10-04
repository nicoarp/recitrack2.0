import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrCodesService } from '../qr-codes/qr-codes.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateFacilityDto } from './dto/create-facility.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService,
    private qrCodesService: QrCodesService
  ) {}

  // Crear organización
  async createOrganization(dto: CreateOrganizationDto) {
    // Verificar si RUT ya existe
    const existing = await this.prisma.organization.findUnique({
      where: { rut: dto.rut },
    });

    if (existing) {
      throw new BadRequestException('Ya existe una organización con ese RUT');
    }

    return this.prisma.organization.create({
      data: dto,
      include: {
        _count: {
          select: {
            facilities: true,
            users: true,
          },
        },
      },
    });
  }

  // Obtener todas las organizaciones
  async findAllOrganizations() {
    return this.prisma.organization.findMany({
      include: {
        facilities: true,
        _count: {
          select: {
            facilities: true,
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Obtener una organización
  async findOneOrganization(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        facilities: {
          include: {
            _count: {
              select: {
                users: true,
                batches: true,
                collectionPoints: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organización no encontrada');
    }

    return org;
  }

  // Actualizar organización
  async updateOrganization(id: string, data: { name?: string; active?: boolean }) {
    await this.findOneOrganization(id);

    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  // Crear facility
  async createFacility(dto: CreateFacilityDto) {
    // Verificar que la organización existe
    await this.findOneOrganization(dto.organizationId);

    const facility = await this.prisma.facility.create({
      data: dto,
      include: {
        organization: true,
        _count: {
          select: {
            users: true,
            batches: true,
            collectionPoints: true,
          },
        },
      },
    });

    // Crear automáticamente el punto de recepción directa
    try {
      await this.createReceptionPointForFacility(facility);
    } catch (error) {
      console.error('Error creando punto de recepción:', error);
      // No fallar la creación de facility si falla el punto
    }

    return facility;
  }

  // Método privado para crear punto de recepción
private async createReceptionPointForFacility(facility: any) {
  // 1. Primero crear el QR
  const qrCode = await this.prisma.qrCode.create({
    data: {
      type: 'COLLECTION_POINT',
      status: 'USED',
    },
  });

  // 2. Crear el punto de recolección con el QR
  const collectionPoint = await this.prisma.collectionPoint.create({
    data: {
      name: `Recepción Directa - ${facility.name}`,
      description: 'Entrega directa de materiales reciclables en el centro de acopio',
      address: facility.address,
      latitude: facility.latitude || -33.4372,
      longitude: facility.longitude || -70.6506,
      facilityId: facility.id,
      qrCodeId: qrCode.id,  // Asignar el QR creado
      active: true,
    },
  });

  // 3. Actualizar el QR con la referencia al punto
  await this.prisma.qrCode.update({
    where: { id: qrCode.id },
    data: {
      collectionPoint: {
        connect: { id: collectionPoint.id }
      }
    },
  });

  // 4. Generar la imagen QR
  const qrImage = await this.qrCodesService.generateQrImage(qrCode.id);

  console.log(`✅ Punto de recepción creado para facility: ${facility.name}`);
  console.log(`✅ QR generado con ID: ${qrCode.id}`);
  
  return {
    collectionPoint,
    qr: { ...qrCode, qrImage }
  };
}



  // Obtener todas las facilities
  async findAllFacilities(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};

    return this.prisma.facility.findMany({
      where,
      include: {
        organization: true,
        _count: {
          select: {
            users: true,
            batches: true,
            collectionPoints: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Obtener una facility
  async findOneFacility(id: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: {
        organization: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        batches: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        collectionPoints: true,
      },
    });

    if (!facility) {
      throw new NotFoundException('Facility no encontrada');
    }

    return facility;
  }

  // Actualizar facility
  async updateFacility(id: string, data: { 
    name?: string; 
    address?: string; 
    latitude?: number;
    longitude?: number;
    active?: boolean;
  }) {
    await this.findOneFacility(id);

    return this.prisma.facility.update({
      where: { id },
      data,
    });
  }

  // Obtener estadísticas de organización
  async getOrganizationStats(id: string) {
    const [totalUsers, totalBatches, totalWeight] = await Promise.all([
      this.prisma.user.count({ where: { organizationId: id } }),
      this.prisma.batch.count({ 
        where: { 
          facility: { organizationId: id } 
        } 
      }),
      this.prisma.batch.aggregate({
        where: { 
          facility: { organizationId: id },
          status: 'CLOSED'
        },
        _sum: { netWeight: true }
      }),
    ]);

    return {
      totalUsers,
      totalBatches,
      totalWeight: totalWeight._sum.netWeight || 0,
    };
  }
}