import { Controller, Get, Post, Put, Param, Body, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { CollectionPointsService } from './collection-points.service';
import { CreateCollectionPointDto } from './dto/create-collection-point.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('collection-points')
@UseGuards(JwtAuthGuard)
export class CollectionPointsController {
  constructor(private collectionPointsService: CollectionPointsService) {}

  @Post()
  async create(
    @Body() dto: CreateCollectionPointDto,
    @CurrentUser() user: any,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden crear puntos de reciclaje');
    }
    return this.collectionPointsService.create(dto);
  }

  @Get()
  async findAll(
    @Query('facilityId') facilityId?: string,
    @Query('active') active?: string,
  ) {
    const isActive = active === 'false' ? false : true;
    return this.collectionPointsService.findAll(facilityId, isActive);
  }

  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = radius ? parseFloat(radius) : 5;

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Latitud y longitud deben ser números válidos');
    }

    return this.collectionPointsService.findNearby(latitude, longitude, radiusKm);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.collectionPointsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser() user: any,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo administradores pueden actualizar puntos de reciclaje');
    }
    return this.collectionPointsService.update(id, updateDto);
  }
}