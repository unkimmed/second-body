import { View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Text } from '@/components/Text'
import { Colors } from '@/constants/theme'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { BodyPartCode, Severity, SymptomRecord } from '@second-body/shared'
import { SEVERITY_COLOR } from '@/constants/symptom'
import { useAuth } from '@/lib/AuthContext'
import { fetchRecord, deleteRecord, patchRecord, resolveRecord } from '../api/records'
import { RecordDetailCard } from '@/components/RecordDetailCard'
import { RecordEditForm } from '@/components/RecordEditForm'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${dateStr}(${DAYS[date.getDay()]})`
}

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { userId } = useAuth()
  const [record, setRecord] = useState<SymptomRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editBodyPartCode, setEditBodyPartCode] = useState<BodyPartCode | null>(null)
  const [editSeverity, setEditSeverity] = useState<Severity>(3)
  const [editNote, setEditNote] = useState('')
  const [saving, setSaving] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetchRecord(id, userId)
      .then((data) => setRecord(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, userId])

  function startEditing() {
    if (!record) return
    setEditBodyPartCode(record.body_part_code)
    setEditSeverity(record.severity)
    setEditNote(record.note ?? '')
    setErrorMessage(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setErrorMessage(null)
  }

  async function saveEdit() {
    if (!userId || !editBodyPartCode) return
    setErrorMessage(null)
    setSaving(true)
    try {
      const updated = await patchRecord(id, userId, {
        body_part_code: editBodyPartCode,
        severity: editSeverity,
        note: editNote || undefined,
      })
      setRecord(updated)
      setIsEditing(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setErrorMessage(`저장 실패: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  async function toggleResolve() {
    if (!userId || !record) return
    setErrorMessage(null)
    setResolving(true)
    try {
      const updated = await resolveRecord(id, userId, !record.resolved_at)
      setRecord(updated)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setErrorMessage(`처리 실패: ${msg}`)
    } finally {
      setResolving(false)
    }
  }

  async function confirmDelete() {
    if (!userId) {
      setErrorMessage('로그인이 필요합니다. 다시 로그인해주세요.')
      return
    }
    setDeleting(true)
    try {
      const res = await deleteRecord(id, userId)
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setErrorMessage(`삭제 실패 (${res.status}): ${text || '원인 불명'}`)
        return
      }
      setConfirmOpen(false)
      router.back()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setErrorMessage(`네트워크 오류: ${msg}`)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (!record) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-on-surface-variant">기록을 찾을 수 없습니다.</Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-surface-lowest">
      <View className={`px-5 py-4 flex-row items-center gap-2`}>
        <Text className="text-sm font-medium">{formatDate(record.record_date)}</Text>
        {record.resolved_at && (
          <View className="bg-primary/10 border border-primary rounded-full px-2 py-0.5">
            <Text className="text-primary text-[11px] font-semibold">
              해결됨 · {record.resolved_at.slice(0, 10)}
            </Text>
          </View>
        )}
      </View>

      <View className="px-5 gap-4 mt-4">
        {isEditing ? (
          <RecordEditForm
            bodyPartCode={editBodyPartCode}
            onBodyPartChange={setEditBodyPartCode}
            severity={editSeverity}
            onSeverityChange={setEditSeverity}
            note={editNote}
            onNoteChange={setEditNote}
          />
        ) : (
          <RecordDetailCard
            bodyPartCode={record.body_part_code}
            severity={record.severity}
            note={record.note}
          />
        )}

        {errorMessage && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3">
            <Text className="text-danger text-xs">{errorMessage}</Text>
          </View>
        )}

        {!isEditing && (
          <TouchableOpacity
            onPress={toggleResolve}
            disabled={resolving}
            className={`py-3 rounded-md items-center ${
              record.resolved_at
                ? 'border border-outline-variant'
                : 'bg-primary'
            } ${resolving ? 'opacity-50' : ''}`}
          >
            <Text
              className={`text-sm font-semibold ${
                record.resolved_at ? 'text-on-surface-variant' : 'text-surface'
              }`}
            >
              {resolving
                ? '처리 중...'
                : record.resolved_at
                  ? '진행중으로 되돌리기'
                  : '✓ 해결 처리'}
            </Text>
          </TouchableOpacity>
        )}

        <View className="flex-row gap-2 w-full">
          {isEditing ? (
            <>
              <TouchableOpacity
                onPress={cancelEditing}
                disabled={saving}
                className="flex-1 border border-outline-variant py-2 rounded-md items-center mt-4"
              >
                <Text className="text-on-surface-variant text-xs font-medium">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                disabled={saving || !editBodyPartCode}
                className={`flex-1 py-2 rounded-md items-center mt-4 bg-primary ${saving || !editBodyPartCode ? 'opacity-50' : ''}`}
              >
                <Text className="text-surface text-xs font-medium">
                  {saving ? '저장 중...' : '저장'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={startEditing}
                className="flex-1 border border-outline-variant py-2 rounded-md items-center mt-4"
              >
                <Text className="text-primary text-xs font-medium">수정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setConfirmOpen(true)}
                className="flex-1 border border-red-200 py-2 rounded-md items-center mt-4"
              >
                <Text className="text-danger text-xs font-medium">기록 삭제</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <DeleteConfirmModal
        visible={confirmOpen}
        deleting={deleting}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </ScrollView>
  )
}
