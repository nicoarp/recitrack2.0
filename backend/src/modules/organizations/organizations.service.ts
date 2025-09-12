import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateFacilityDto } from './dto/create-facility.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.facility.create({
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