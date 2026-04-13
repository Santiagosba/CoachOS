import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import ExercisePicker from '@/components/ExercisePicker'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface DayExercise {
  id: number
  order: number
  sets: number
  reps: string
  rpe?: number
  notes?: string
  exercise: { id: string; name: string; muscleGroup?: string }
}

interface DayDetail {
  id: number
  dayOfWeek: number
  label?: string
  exercises: DayExercise[]
}

interface EditingExercise {
  id: number
  sets: string
  reps: string
  rpe: string
  notes: string
}

export default function DayEditorScreen() {
  const { id: programId, dayId } = useLocalSearchParams<{ id: string; dayId: string }>()
  const router = useRouter()

  const [day, setDay] = useState<DayDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [editing, setEditing] = useState<EditingExercise | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    if (!programId || !dayId) {
      setDay(null)
      setLoading(false)
      return
    }

    try {
      setLoadError('')
      const { data } = await api.get(`/programs/${programId}`)
      let foundDay: DayDetail | null = null
      for (const week of data.weeks) {
        const found = week.days.find((d: DayDetail) => d.id === Number(dayId))
        if (found) {
          foundDay = found
          break
        }
      }
      setDay(foundDay)
      if (!foundDay) {
        setLoadError('Día no encontrado')
      }
    } catch (error: any) {
      setDay(null)
      setLoadError(error?.response?.data?.error ?? 'No se pudo cargar el día')
    } finally {
      setLoading(false)
    }
  }, [programId, dayId])

  useEffect(() => { load() }, [load])

  async function handleAddExercise(exercise: { id: string; name: string }) {
    try {
      await api.post(`/programs/${programId}/days/${dayId}/exercises`, {
        exerciseId: exercise.id,
        sets: 3,
        reps: '8-10',
      })
      load()
    } catch {
      Alert.alert('Error', 'No se pudo añadir el ejercicio')
    }
  }

  async function handleDeleteExercise(exId: number) {
    Alert.alert('Eliminar', '¿Eliminar este ejercicio del día?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/programs/${programId}/days/${dayId}/exercises/${exId}`)
          load()
        },
      },
    ])
  }

  function startEditing(ex: DayExercise) {
    setEditing({
      id: ex.id,
      sets: String(ex.sets),
      reps: ex.reps,
      rpe: ex.rpe ? String(ex.rpe) : '',
      notes: ex.notes ?? '',
    })
  }

  async function saveEditing() {
    if (!editing) return
    setSaving(true)
    try {
      await api.patch(`/programs/${programId}/days/${dayId}/exercises/${editing.id}`, {
        sets: Number(editing.sets) || 3,
        reps: editing.reps || '8-10',
        rpe: editing.rpe ? Number(editing.rpe) : undefined,
        notes: editing.notes || undefined,
      })
      setEditing(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>
  }
  if (!day) {
    return <View style={styles.center}><Text style={styles.empty}>{loadError || 'Día no encontrado'}</Text></View>
  }

  return (
    <LiquidGlassBackground>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#6366f1" />
          <Text style={styles.backText}>Programa</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>Day Editor</Text>
        <Text style={styles.title}>{DAYS[day.dayOfWeek]}</Text>
        {day.label && <Text style={styles.label}>{day.label}</Text>}

        {/* Ejercicios */}
        {day.exercises.length === 0 && (
          <Text style={styles.empty}>Sin ejercicios — pulsa "+" para añadir</Text>
        )}

        {day.exercises.map((ex, idx) => (
          <View key={ex.id} style={[glass.card, styles.exCard]}>
            {/* Nombre + acciones */}
            <View style={styles.exHeader}>
              <View style={styles.exOrder}>
                <Text style={styles.exOrderText}>{idx + 1}</Text>
              </View>
              <Text style={styles.exName} numberOfLines={1}>{ex.exercise.name}</Text>
              <TouchableOpacity onPress={() => startEditing(ex)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="pencil" size={18} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteExercise(ex.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Inline editor */}
            {editing?.id === ex.id ? (
              <View style={styles.editor}>
                <View style={styles.editorRow}>
                  <Field label="Series" value={editing.sets} onChangeText={(v) => setEditing({ ...editing, sets: v })} keyboardType="numeric" />
                  <Field label="Reps" value={editing.reps} onChangeText={(v) => setEditing({ ...editing, reps: v })} />
                  <Field label="RPE" value={editing.rpe} onChangeText={(v) => setEditing({ ...editing, rpe: v })} keyboardType="numeric" />
                </View>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Notas (opcional)"
                  placeholderTextColor="#475569"
                  value={editing.notes}
                  onChangeText={(v) => setEditing({ ...editing, notes: v })}
                />
                <View style={styles.editorActions}>
                  <TouchableOpacity onPress={() => setEditing(null)} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveEditing} style={styles.saveBtn} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.exMeta}>
                <MetaTag label={`${ex.sets} series`} />
                <MetaTag label={`${ex.reps} reps`} />
                {ex.rpe && <MetaTag label={`RPE ${ex.rpe}`} accent />}
                {ex.notes && <Text style={styles.exNotes}>{ex.notes}</Text>}
              </View>
            )}
          </View>
        ))}
        </ScrollView>

        {/* FAB añadir ejercicio */}
        <TouchableOpacity style={styles.fab} onPress={() => setPickerVisible(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

        <ExercisePicker
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onSelect={handleAddExercise}
        />
      </View>
    </LiquidGlassBackground>
  )
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  keyboardType?: 'default' | 'numeric'
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        selectTextOnFocus
      />
    </View>
  )
}

function MetaTag({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View style={[styles.metaTag, accent && styles.metaTagAccent]}>
      <Text style={[styles.metaTagText, accent && styles.metaTagTextAccent]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { color: '#113b7a', fontSize: 16, fontWeight: '700' },
  eyebrow: { color: '#5d6f85', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', color: '#10213a' },
  label: { fontSize: 14, color: '#234675', backgroundColor: '#dce8ff', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: 'hidden', marginTop: 6, marginBottom: 24, fontWeight: '700' },
  empty: { color: '#5d6f85', fontSize: 14, marginTop: 32, textAlign: 'center' },
  exCard: { marginBottom: 10, overflow: 'hidden' },
  exHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  exOrder: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  exOrderText: { color: '#55687e', fontSize: 12, fontWeight: '700' },
  exName: { flex: 1, color: '#10213a', fontSize: 15, fontWeight: '700' },
  exMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 12 },
  metaTag: { backgroundColor: 'rgba(255,255,255,0.42)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  metaTagAccent: { backgroundColor: '#dce8ff' },
  metaTagText: { color: '#55687e', fontSize: 13 },
  metaTagTextAccent: { color: '#234675' },
  exNotes: { color: '#5d6f85', fontSize: 13, width: '100%' },
  // Editor inline
  editor: { padding: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)' },
  editorRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  field: { flex: 1 },
  fieldLabel: { color: '#55687e', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', fontWeight: '700' },
  fieldInput: { backgroundColor: 'rgba(255,255,255,0.42)', color: '#10213a', borderRadius: 12, padding: 10, fontSize: 15, textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.48)' },
  notesInput: { backgroundColor: 'rgba(255,255,255,0.42)', color: '#10213a', borderRadius: 12, padding: 10, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.48)' },
  editorActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center' },
  cancelBtnText: { color: '#55687e', fontWeight: '700' },
  saveBtn: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: '#113b7a', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
})
