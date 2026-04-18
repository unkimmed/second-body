import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { BodyPart } from '@second-body/shared';

@Injectable()
export class BodyPartsService {
  constructor(private supabase: SupabaseService) {}

  async findAll(): Promise<BodyPart[]> {
    const { data, error } = await this.supabase.client
      .from('body_parts')
      .select('*')
      .order('code');

    if (error) throw new Error(error.message);
    return data as BodyPart[];
  }
}
