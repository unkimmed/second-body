import { Module } from '@nestjs/common';
import { BodyPartsController } from './body-parts.controller';
import { BodyPartsService } from './body-parts.service';

@Module({
  controllers: [BodyPartsController],
  providers: [BodyPartsService],
})
export class BodyPartsModule {}
