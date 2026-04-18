import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { RecordsModule } from './records/records.module';
import { BodyPartsModule } from './body-parts/body-parts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    RecordsModule,
    BodyPartsModule,
  ],
})
export class AppModule {}
