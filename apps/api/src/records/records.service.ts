import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { SymptomRecord } from '@second-body/shared'
import { CreateRecordDto } from './dto/create-record.dto'
import { UpdateRecordDto } from './dto/update-record.dto'

@Injectable()
export class RecordsService {
  constructor(private supabase: SupabaseService) {}

  async findAll(userId: string): Promise<SymptomRecord[]> {
    const { data, error } = await this.supabase.client
      .from('symptom_records')
      .select('*')
      .eq('user_id', userId)
      .order('record_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data as SymptomRecord[]
  }

  async findToday(userId: string): Promise<SymptomRecord[]> {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await this.supabase.client
      .from('symptom_records')
      .select('*')
      .eq('user_id', userId)
      .eq('record_date', today)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as SymptomRecord[]
  }

  async findOne(id: string, userId: string): Promise<SymptomRecord> {
    const { data, error } = await this.supabase.client
      .from('symptom_records')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) throw new NotFoundException('기록을 찾을 수 없습니다.')
    return data as SymptomRecord
  }

  async create(userId: string, dto: CreateRecordDto): Promise<SymptomRecord> {
    const { data, error } = await this.supabase.client
      .from('symptom_records')
      .insert({ ...dto, user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as SymptomRecord
  }

  async update(id: string, userId: string, dto: UpdateRecordDto): Promise<SymptomRecord> {
    // 클라이언트의 resolved(boolean)를 저장 컬럼 resolved_at(timestamp)로 매핑
    const { resolved, ...rest } = dto
    const payload: Record<string, unknown> = { ...rest }
    if (resolved !== undefined) {
      payload.resolved_at = resolved ? new Date().toISOString() : null
    }

    const { error } = await this.supabase.client
      .from('symptom_records')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    return this.findOne(id, userId)
  }

  async remove(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('symptom_records')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }
}
