import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SymptomsModule } from './symptoms/symptoms.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    // .env 파일을 전역으로 로드
    ConfigModule.forRoot({ isGlobal: true }),

    // Supabase 클라이언트 (전역 제공)
    SupabaseModule,

    // 증상 기록 CRUD
    SymptomsModule,
  ],
})
export class AppModule {}
