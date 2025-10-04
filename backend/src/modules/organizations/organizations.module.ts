import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QrCodesModule } from '../qr-codes/qr-codes.module';

@Module({
  imports: [
    PrismaModule,
    QrCodesModule  // Importar módulo de QR
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}