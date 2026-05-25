import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Modal,
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated as RNAnimated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { Text } from '@/components/Text'
import { BodyPartCode, Severity } from '@second-body/shared'
import { BODY_PART_LABELS, SEVERITY_LABELS } from '@/constants/symptom'
import { Colors, Radius } from '@/constants/theme'

// ─── Severity chip colours ────────────────────────────────────────────────────
const SEV_BG: Record<Severity, string> = {
  1: '#dcfce7',
  2: '#ecfccb',
  3: '#fef9c3',
  4: '#ffedd5',
  5: '#fee2e2',
}
const SEV_ACTIVE: Record<Severity, string> = {
  1: '#86efac',
  2: '#bef264',
  3: '#fde047',
  4: '#fb923c',
  5: '#ef4444',
}
const SEV_TEXT: Record<Severity, string> = {
  1: '#166534',
  2: '#3f6212',
  3: '#713f12',
  4: '#7c2d12',
  5: '#7f1d1d',
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean
  partCode: BodyPartCode | null
  initialSeverity?: Severity
  onSave: (severity: Severity, note: string) => Promise<void>
  onClose: () => void
}

const SEVERITIES: Severity[] = [1, 2, 3, 4, 5]

export function SymptomSheet({ visible, partCode, initialSeverity, onSave, onClose }: Props) {
  const [severity, setSeverity] = useState<Severity | null>(initialSeverity ?? null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset state when the sheet opens for a new part
  useEffect(() => {
    if (visible) {
      setSeverity(initialSeverity ?? null)
      setNote('')
      setSaving(false)
    }
  }, [visible, partCode, initialSeverity])

  // ── Slide-up animation ────────────────────────────────────────────────────
  const slideAnim = useRef(new RNAnimated.Value(0)).current
  useEffect(() => {
    RNAnimated.spring(slideAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 180,
      mass: 0.6,
    }).start()
  }, [visible, slideAnim])

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  })

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!severity || saving) return
    setSaving(true)
    try {
      await onSave(severity, note.trim())
    } finally {
      setSaving(false)
    }
  }, [severity, note, onSave, saving])

  if (!partCode) return null

  const partLabel = BODY_PART_LABELS[partCode]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        {/* Sheet */}
        <RNAnimated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.partName}>{partLabel}</Text>
              <Text style={styles.subTitle}>증상 강도를 선택해 주세요</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Severity selector */}
          <View style={styles.severityRow}>
            {SEVERITIES.map((sev) => {
              const active = severity === sev
              return (
                <TouchableOpacity
                  key={sev}
                  style={[
                    styles.sevChip,
                    { backgroundColor: active ? SEV_ACTIVE[sev] : SEV_BG[sev] },
                    active && styles.sevChipActive,
                  ]}
                  onPress={() => setSeverity(sev)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.sevNum, { color: SEV_TEXT[sev] }]}>{sev}</Text>
                  <Text style={[styles.sevLabel, { color: SEV_TEXT[sev] }]}>
                    {SEVERITY_LABELS[sev]}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Note */}
          <View style={styles.noteWrap}>
            <TextInput
              style={styles.noteInput}
              placeholder="메모 (선택사항)"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={200}
              returnKeyType="done"
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !severity && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={!severity || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <Text style={styles.saveText}>저장</Text>
              )}
            </TouchableOpacity>
          </View>
        </RNAnimated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(31, 33, 29, 0.4)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  partName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  subTitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
  },
  severityRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  sevChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  sevChipActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  sevNum: {
    fontSize: 16,
    fontWeight: '700',
  },
  sevLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  noteWrap: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 72,
  },
  noteInput: {
    fontSize: 14,
    color: Colors.onSurface,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.surface,
  },
})
