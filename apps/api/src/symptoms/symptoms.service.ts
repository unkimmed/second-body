import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';
import { Symptom } from '@second-body/shared';

@Injectable()
export class SymptomsService {
  // Supabase의 테이블 이름
  private readonly TABLE = 'symptoms';

  constructor(private supabase: SupabaseService) {}

  /** 특정 유저의 모든 증상 조회 (날짜 내림차순) */
  async findAll(userId: string): Promise<Symptom[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Symptom[];
  }

  /** 단일 증상 조회 */
  async findOne(id: string, userId: string): Promise<Symptom> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('증상을 찾을 수 없습니다.');
    return data as Symptom;
  }

  /** 증상 생성 */
  async create(userId: string, dto: CreateSymptomDto): Promise<Symptom> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert({ ...dto, user_id: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Symptom;
  }

  /** 증상 수정 */
  async update(id: string, userId: string, dto: UpdateSymptomDto): Promise<Symptom> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update(dto)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('증상을 찾을 수 없습니다.');
    return data as Symptom;
  }

  /** 증상 삭제 */
  async remove(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }
}
