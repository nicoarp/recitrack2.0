import { Controller, Get, Post, Put, Param, Body, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  // ORGANIZACIONES

  @Post()
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: any,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden crear organizaciones');
    }
    return this.organizationsService.createOrganization(dto);
  }

  @Get()
  async findAllOrganizations(@CurrentUser() user: any) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden ver todas las organizaciones');
    }
    return this.organizationsService.findAllOrganizations();
  }

  @Get(':id')
  async findOneOrganization(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    // Admin ve todo, otros solo su propia organización
    if (user.role !== UserRole.ADMIN && user.organizationId !== id) {
      throw new ForbiddenException('No tienes permiso para ver esta organización');
    }
    return this.organizationsService.findOneOrganization(id);
  }

  @Put(':id')
  async updateOrganization(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser() user: any,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden actualizar organizaciones');
    }
    return this.organizationsService.updateOrganization(id, updateDto);
  }

  @Get(':id/stats')
  async getOrganizationStats(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role !== UserRole.ADMIN && user.organizationId !== id) {
      throw new ForbiddenException('No tienes permiso para ver estas estadísticas');
    }
    return this.organizationsService.getOrganizationStats(id);
  }

  // FACILITIES

  @Post('facilities')
  async createFacility(
    @Body() dto: CreateFacilityDto,
    @CurrentUser() user: any,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden crear facilities');
    }
    return this.organizationsService.createFacility(dto);
  }

  @Get('facilities/all')
  async findAllFacilities(
    @Query('organizationId') organizationId?: string,
    @CurrentUser() user?: any,
  ) {
    if (user.role !== UserRole.ADMIN && organizationId !== user.organizationId) {
      throw new ForbiddenException('No tienes permiso para ver estas facilities');
    }
    return this.organizationsService.findAllFacilities(organizationId);
  }

  @Get('facilities/:id')
  async findOneFacility(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const facility = await this.organizationsService.findOneFacility(id);
    
    if (user.role !== UserRole.ADMIN && user.organizationId !== facility.organizationId) {
      throw new ForbiddenException('No tienes permiso para ver esta facility');
    }
    
    return facility;
  }

  @Put('facilities/:id')
  async updateFacility(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser() user: any,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden actualizar facilities');
    }
    return this.organizationsService.updateFacility(id, updateDto);
  }
}