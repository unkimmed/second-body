import { CreateSymptomRecordDto, UpdateSymptomRecordDto, SymptomRecord } from '@second-body/shared'
import { API_URL } from '@/lib/config'
import { supabase } from '@/lib/supabase'

/** 현재 세션의 Supabase access token 을 Authorization 헤더로 (없으면 빈 헤더) */
async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function jsonHeaders(): Promise<Record<string, string>> {
  return { 'Content-Type': 'application/json', ...(await authHeader()) }
}

export async function fetchRecords(): Promise<SymptomRecord[]> {
  const res = await fetch(`${API_URL}/records`, { headers: await authHeader() })
  return res.json() as Promise<SymptomRecord[]>
}

export async function fetchRecord(id: string): Promise<SymptomRecord> {
  const res = await fetch(`${API_URL}/records/${id}`, { headers: await authHeader() })
  return res.json() as Promise<SymptomRecord>
}

export async function createRecord(payload: CreateSymptomRecordDto): Promise<Response> {
  return fetch(`${API_URL}/records`, {
    method: 'POST',
    headers: await jsonHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function patchRecord(
  id: string,
  payload: UpdateSymptomRecordDto,
): Promise<SymptomRecord> {
  const res = await fetch(`${API_URL}/records/${id}`, {
    method: 'PATCH',
    headers: await jsonHeaders(),
    body: JSON.stringify(payload),
  })
  return res.json() as Promise<SymptomRecord>
}

export async function resolveRecord(id: string, resolved: boolean): Promise<SymptomRecord> {
  return patchRecord(id, { resolved })
}

export async function deleteRecord(id: string): Promise<Response> {
  return fetch(`${API_URL}/records/${id}`, {
    method: 'DELETE',
    headers: await authHeader(),
  })
}
