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
      .select('*, details:symptom_details(*)')
      .eq('user_id', userId)
      .eq('record_date', today)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as SymptomRecord[]
  }

  async findOne(id: string, userId: string): Promise<SymptomRecord> {
    const { data, error } = await this.supabase.client
      .from('symptom_records')
      .select('*, details:symptom_details(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) throw new NotFoundException('기록을 찾을 수 없습니다.')
    return data as SymptomRecord
  }

  async create(userId: string, dto: CreateRecordDto): Promise<SymptomRecord> {
    const { details, ...recordData } = dto

    const { data: record, error: recordError } = await this.supabase.client
      .from('symptom_records')
      .insert({ ...recordData, user_id: userId })
      .select()
      .single()

    if (recordError) {
      throw new Error(recordError.message)
    }

    if (details.length > 0) {
      const detailRows = details.map((d) => ({ ...d, record_id: record.id }))
      const { error: detailError } = await this.supabase.client
        .from('symptom_details')
        .insert(detailRows)

      if (detailError) throw new Error(detailError.message)
    }

    return this.findOne(record.id, userId)
  }

  async update(id: string, userId: string, dto: UpdateRecordDto): Promise<SymptomRecord> {
    const { details, overall_note } = dto

    if (overall_note !== undefined) {
      const { error } = await this.supabase.client
        .from('symptom_records')
        .update({ overall_note })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw new Error(error.message)
    }

    if (details !== undefined) {
      await this.supabase.client.from('symptom_details').delete().eq('record_id', id)

      if (details.length > 0) {
        const detailRows = details.map((d) => ({ ...d, record_id: id }))
        const { error } = await this.supabase.client.from('symptom_details').insert(detailRows)

        if (error) throw new Error(error.message)
      }
    }

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
