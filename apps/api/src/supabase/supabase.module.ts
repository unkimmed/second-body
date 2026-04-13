import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

// @Global() → 이 모듈을 한 번만 import 해도 앱 전체에서 사용 가능
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
