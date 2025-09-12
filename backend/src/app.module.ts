import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { QrCodesModule } from './modules/qr-codes/qr-codes.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { BatchesModule } from './modules/batches/batches.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { CollectionPointsModule } from './modules/collection-points/collection-points.module';
import { ReportsModule } from './modules/reports/reports.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    QrCodesModule,
    DepositsModule,
    BatchesModule,
    MetricsModule,
    UsersModule,
    OrganizationsModule,
    CollectionPointsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}