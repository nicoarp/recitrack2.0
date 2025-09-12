import { Module } from '@nestjs/common';
import { CollectionPointsController } from './collection-points.controller';
import { CollectionPointsService } from './collection-points.service';
import { QrCodesModule } from '../qr-codes/qr-codes.module';

@Module({
  imports: [QrCodesModule],
  controllers: [CollectionPointsController],
  providers: [CollectionPointsService],
  exports: [CollectionPointsService],
})
export class CollectionPointsModule {}