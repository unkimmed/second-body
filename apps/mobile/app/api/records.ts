import { CreateSymptomRecordDto, UpdateSymptomRecordDto, SymptomRecord } from '@second-body/shared'
import { API_URL } from '@/lib/config'

function authHeaders(userId: string) {
  return { 'x-user-id': userId }
}

function jsonHeaders(userId: string) {
  return { 'Content-Type': 'application/json', 'x-user-id': userId }
}

export async function fetchRecords(userId: string): Promise<SymptomRecord[]> {
  const res = await fetch(`${API_URL}/records`, { headers: authHeaders(userId) })
  return res.json() as Promise<SymptomRecord[]>
}

export async function fetchRecord(id: string, userId: string): Promise<SymptomRecord> {
  const res = await fetch(`${API_URL}/records/${id}`, { headers: authHeaders(userId) })
  return res.json() as Promise<SymptomRecord>
}

export async function createRecord(
  userId: string,
  payload: CreateSymptomRecordDto,
): Promise<Response> {
  return fetch(`${API_URL}/records`, {
    method: 'POST',
    headers: jsonHeaders(userId),
    body: JSON.stringify(payload),
  })
}

export async function patchRecord(
  id: string,
  userId: string,
  payload: UpdateSymptomRecordDto,
): Promise<SymptomRecord> {
  const res = await fetch(`${API_URL}/records/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(userId),
    body: JSON.stringify(payload),
  })
  return res.json() as Promise<SymptomRecord>
}

export async function resolveRecord(
  id: string,
  userId: string,
  resolved: boolean,
): Promise<SymptomRecord> {
  return patchRecord(id, userId, { resolved })
}

export async function deleteRecord(id: string, userId: string): Promise<Response> {
  return fetch(`${API_URL}/records/${id}`, {
    method: 'DELETE',
    headers: authHeaders(userId),
  })
}
