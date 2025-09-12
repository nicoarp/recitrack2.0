import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los usuarios (solo admin)
  async findAll(role?: UserRole) {
    const where = role ? { role } : {};
    
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        organization: true,
        facility: true,
        createdAt: true,
        _count: {
          select: {
            depositsCreated: true,
            validations: true,
            batchesCreated: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Obtener un usuario por ID
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        rut: true,
        phone: true,
        active: true,
        emailVerified: true,
        organization: true,
        facility: true,
        createdAt: true,
        _count: {
          select: {
            depositsCreated: true,
            validations: true,
            batchesCreated: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  // Crear nuevo usuario (solo admin)
  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    rut?: string;
    phone?: string;
    organizationId?: string;
    facilityId?: string;
  }) {
    // Verificar si el email ya existe
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crear usuario
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organization: true,
        facility: true,
      },
    });

    return user;
  }

  // Actualizar usuario
  async update(id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    active?: boolean;
    organizationId?: string;
    facilityId?: string;
  }) {
    const user = await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        organization: true,
        facility: true,
      },
    });
  }

  // Cambiar contraseña
  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  // Activar/Desactivar usuario
  async toggleActive(id: string) {
    const user = await this.findOne(id);
    
    return this.prisma.user.update({
      where: { id },
      data: { active: !user.active },
      select: {
        id: true,
        email: true,
        active: true,
      },
    });
  }
}