import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor(private config: ConfigService) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const key = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    // service_role 키는 서버에서만 사용 — RLS(Row Level Security)를 우회해서
    // 모든 데이터에 접근 가능. 절대 클라이언트(앱)에 노출하면 안 됨.
    this.client = createClient(url, key);
  }
}
