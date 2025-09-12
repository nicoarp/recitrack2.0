import { Controller, Get, Post, Put, Patch, Param, Body, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('role') role?: UserRole,
  ) {
    // Solo admin puede ver todos los usuarios
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden ver todos los usuarios');
    }
    return this.usersService.findAll(role);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    // Admin puede ver cualquier usuario, otros solo su propio perfil
    if (user.role !== UserRole.ADMIN && user.userId !== id) {
      throw new ForbiddenException('No tienes permiso para ver este usuario');
    }
    return this.usersService.findOne(id);
  }

  @Post()
  async create(
    @Body() createUserDto: any,
    @CurrentUser() user: any,
  ) {
    // Solo admin puede crear usuarios
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden crear usuarios');
    }
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: any,
    @CurrentUser() user: any,
  ) {
    // Admin puede actualizar cualquier usuario
    if (user.role !== UserRole.ADMIN && user.userId !== id) {
      throw new ForbiddenException('No tienes permiso para actualizar este usuario');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() passwords: { oldPassword: string; newPassword: string },
    @CurrentUser() user: any,
  ) {
    // Solo el mismo usuario puede cambiar su contraseña
    if (user.userId !== id) {
      throw new ForbiddenException('Solo puedes cambiar tu propia contraseña');
    }
    return this.usersService.changePassword(id, passwords.oldPassword, passwords.newPassword);
  }

  @Patch(':id/toggle-active')
  async toggleActive(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    // Solo admin puede activar/desactivar usuarios
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden activar/desactivar usuarios');
    }
    return this.usersService.toggleActive(id);
  }
}