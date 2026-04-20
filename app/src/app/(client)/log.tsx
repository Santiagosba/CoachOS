import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'

interface ProgramExercise {
  id: number
  order: number
  sets: number
  reps: string
  rpe?: number
  exercise: { id: string; name: string; muscleGroup?: string }
}

interface LoggedSet {
  exerciseId: string
  setNumber: number
  weight: string
  reps: string
  rpe: string
}

type LogState = Record<string, LoggedSet[]>

export default function LogScreen() {
  const { dayId, logId } = useLocalSearchParams<{ dayId: string; logId: string }>()
  const router = useRouter()

  const [exercises, setExercises] = useState<ProgramExercise[]>([])
  const [log, setLog] = useState<LogState>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeExercise, setActiveExercise] = useState<string | null>(null)
  const [lastWeights, setLastWeights] = useState<Record<string, number>>({})
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoadError('')
      const todayRes = await api.get('/client/today')
      const day = todayRes.data.day
      if (day) {
        setExercises(day.exercises)
        const initial: LogState = {}
        for (const ex of day.exercises as ProgramExercise[]) {
          initial[ex.exercise.id] = Array.from({ length: ex.sets }, (_, i) => ({
            exerciseId: ex.exercise.id,
            setNumber: i + 1,
            weight: '',
            reps: ex.reps.includes('-') ? ex.reps.split('-')[0] : ex.reps,
            rpe: ex.rpe ? String(ex.rpe) : '',
          }))
        }
        setLog(initial)
        setActiveExercise(day.exercises[0]?.exercise.id ?? null)
      }

      if (logId) {
        const logRes = await api.get(`/client/workouts/${logId}`)
        const existingSets: LogState = {}
        for (const s of logRes.data.sets) {
          if (!existingSets[s.exerciseId]) existingSets[s.exerciseId] = []
          existingSets[s.exerciseId].push({
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            weight: String(s.weight),
            reps: String(s.reps),
            rpe: s.rpe ? String(s.rpe) : '',
          })
        }
        setLog((prev) => {
          const merged = { ...prev }
          for (const [exId, sets] of Object.entries(existingSets)) {
            if (merged[exId]) {
              merged[exId] = merged[exId].map((s) => {
                const saved = sets.find((ss) => ss.setNumber === s.setNumber)
                return saved ?? s
              })
            }
          }
          return merged
        })
      }

      const workoutsRes = await api.get('/client/workouts')
      const weights: Record<string, number> = {}
      for (const wl of workoutsRes.data) {
        for (const s of wl.sets) {
          if (!weights[s.exerciseId] || s.weight > weights[s.exerciseId]) {
            weights[s.exerciseId] = s.weight
          }
        }
      }
      setLastWeights(weights)
    } catch (error: any) {
      setExercises([])
      setLog({})
      setLoadError(error?.response?.data?.error ?? 'No se pudo cargar el entrenamiento')
    } finally {
      setLoading(false)
    }
  }, [logId])

  useEffect(() => { load() }, [load])

  function updateSet(exId: string, setIdx: number, field: 'weight' | 'reps' | 'rpe', value: string) {
    setLog((prev) => {
      const sets = [...(prev[exId] ?? [])]
      sets[setIdx] = { ...sets[setIdx], [field]: value }
      return { ...prev, [exId]: sets }
    })
  }

  function isSetComplete(set: LoggedSet) {
    return set.weight !== '' && set.reps !== ''
  }

  function exerciseProgress(exId: string) {
    return (log[exId] ?? []).filter(isSetComplete).length
  }

  function totalProgress() {
    let done = 0, total = 0
    for (const ex of exercises) {
      const sets = log[ex.exercise.id] ?? []
      done += sets.filter(isSetComplete).length
      total += sets.length
    }
    return { done, total }
  }

  async function handleFinish() {
    const { done, total } = totalProgress()
    if (done < total) {
      Alert.alert(
        'Series incompletas',
        `Faltan ${total - done} series. ¿Guardar igualmente?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Guardar', onPress: save },
        ]
      )
    } else {
      save()
    }
  }

  async function save() {
    setSaving(true)
    try {
      const sets: object[] = []
      for (const exId of Object.keys(log)) {
        for (const s of log[exId]) {
          if (!isSetComplete(s)) continue
          sets.push({
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            reps: parseInt(s.reps) || 0,
            weight: parseFloat(s.weight) || 0,
            rpe: s.rpe ? parseFloat(s.rpe) : undefined,
          })
        }
      }
      if (sets.length === 0) {
        Alert.alert('Sin series', 'Registra al menos una serie antes de guardar')
        return
      }
      await api.post('/client/workouts', { sets })
      Alert.alert('Entrenamiento guardado', '¡Buen trabajo!', [
        { text: 'OK', onPress: () => router.replace('/(client)/') },
      ])
    } catch {
      Alert.alert('Error', 'No se pudo guardar el entrenamiento')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#5b9cf6" size="large" /></View>
  }

  if (loadError && exercises.length === 0) {
    return <View style={styles.center}><Text style={styles.empty}>{loadError}</Text></View>
  }

  const { done, total } = totalProgress()
  const progress = total > 0 ? done / total : 0

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LiquidGlassBackground>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#5b9cf6" />
            </TouchableOpacity>
            <View>
              <Text style={styles.eyebrow}>Workout Logger</Text>
              <Text style={styles.headerTitle}>Registro</Text>
            </View>
            <TouchableOpacity
              style={[styles.finishBtn, saving && { opacity: 0.6 }]}
              onPress={handleFinish}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.finishBtnText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={styles.progressText}>{done} / {total} series</Text>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {exercises.map((ex) => {
              const exId = ex.exercise.id
              const sets = log[exId] ?? []
              const doneSets = exerciseProgress(exId)
              const isActive = activeExercise === exId

              return (
                <View key={ex.id} style={[glass.card as any, styles.exCard, isActive && styles.exCardActive]}>
                  <TouchableOpacity
                    style={styles.exHeader}
                    onPress={() => setActiveExercise(isActive ? null : exId)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exName}>{ex.exercise.name}</Text>
                      {ex.exercise.muscleGroup && (
                        <Text style={styles.exMuscle}>{ex.exercise.muscleGroup}</Text>
                      )}
                    </View>
                    <View style={styles.exBadge}>
                      <Text style={[styles.exBadgeText, doneSets === sets.length && sets.length > 0 && styles.exBadgeComplete]}>
                        {doneSets}/{sets.length}
                      </Text>
                    </View>
                    <Ionicons
                      name={isActive ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="rgba(160, 185, 230, 0.55)"
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>

                  {isActive && (
                    <View style={styles.setsContainer}>
                      {lastWeights[exId] && (
                        <Text style={styles.lastWeight}>
                          Último: {lastWeights[exId]} kg
                        </Text>
                      )}

                      <View style={styles.setHeader}>
                        <Text style={[styles.setHeaderText, { width: 28 }]}>Serie</Text>
                        <Text style={[styles.setHeaderText, { flex: 1 }]}>Peso (kg)</Text>
                        <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
                        <Text style={[styles.setHeaderText, { width: 52 }]}>RPE</Text>
                      </View>

                      {sets.map((s, idx) => (
                        <SetRow
                          key={idx}
                          set={s}
                          index={idx}
                          complete={isSetComplete(s)}
                          onWeight={(v) => updateSet(exId, idx, 'weight', v)}
                          onReps={(v) => updateSet(exId, idx, 'reps', v)}
                          onRpe={(v) => updateSet(exId, idx, 'rpe', v)}
                          suggestWeight={lastWeights[exId]}
                        />
                      ))}

                      <Text style={styles.target}>
                        Objetivo: {ex.sets} × {ex.reps}{ex.rpe ? ` @ RPE ${ex.rpe}` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              )
            })}
          </ScrollView>
        </View>
      </LiquidGlassBackground>
    </KeyboardAvoidingView>
  )
}

interface SetRowProps {
  set: LoggedSet
  index: number
  complete: boolean
  onWeight: (v: string) => void
  onReps: (v: string) => void
  onRpe: (v: string) => void
  suggestWeight?: number
}

function SetRow({ set, index, complete, onWeight, onReps, onRpe, suggestWeight }: SetRowProps) {
  return (
    <View style={[styles.setRow, complete && styles.setRowComplete]}>
      <View style={[styles.setNumber, complete && styles.setNumberComplete]}>
        {complete ? (
          <Ionicons name="checkmark" size={14} color="#4ade80" />
        ) : (
          <Text style={styles.setNumberText}>{index + 1}</Text>
        )}
      </View>

      <TextInput
        style={[styles.setInput, { flex: 1 }]}
        placeholder={suggestWeight ? String(suggestWeight) : '0'}
        placeholderTextColor="rgba(160, 185, 230, 0.35)"
        keyboardType="decimal-pad"
        value={set.weight}
        onChangeText={onWeight}
        selectTextOnFocus
      />
      <TextInput
        style={[styles.setInput, { flex: 1 }]}
        placeholder={set.reps}
        placeholderTextColor="rgba(160, 185, 230, 0.35)"
        keyboardType="numeric"
        value={set.reps}
        onChangeText={onReps}
        selectTextOnFocus
      />
      <TextInput
        style={[styles.setInput, { width: 52 }]}
        placeholder="—"
        placeholderTextColor="rgba(160, 185, 230, 0.35)"
        keyboardType="decimal-pad"
        value={set.rpe}
        onChangeText={onRpe}
        selectTextOnFocus
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  empty: { color: 'rgba(160, 185, 230, 0.55)', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  eyebrow: { color: 'rgba(160, 185, 230, 0.55)', fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: 'rgba(240, 244, 255, 0.95)', textAlign: 'center' },
  finishBtn: { backgroundColor: '#2b5fd9', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, shadowColor: '#3b72f5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 16 },
  finishBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, borderRadius: 999 },
  progressFill: { height: 4, backgroundColor: '#5b9cf6', borderRadius: 999, shadowColor: '#5b9cf6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8 },
  progressText: { color: 'rgba(160, 185, 230, 0.55)', fontSize: 12, textAlign: 'right', marginHorizontal: 20, marginTop: 5, marginBottom: 12, fontWeight: '600' },
  scroll: { padding: 20, paddingTop: 4, paddingBottom: 120 },
  exCard: { borderRadius: 24, marginBottom: 10, overflow: 'hidden', borderWidth: 1 },
  exCardActive: { borderColor: 'rgba(91, 156, 246, 0.35)' },
  exHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  exName: { fontSize: 15, fontWeight: '700', color: 'rgba(240, 244, 255, 0.92)' },
  exMuscle: { fontSize: 12, color: 'rgba(160, 185, 230, 0.55)', marginTop: 2 },
  exBadge: { backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  exBadgeText: { color: 'rgba(160, 185, 230, 0.65)', fontSize: 13, fontWeight: '700' },
  exBadgeComplete: { color: '#4ade80' },
  setsContainer: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', padding: 16, paddingTop: 12 },
  lastWeight: { color: 'rgba(160, 185, 230, 0.55)', fontSize: 12, marginBottom: 10, textAlign: 'right', fontWeight: '600' },
  setHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  setHeaderText: { color: 'rgba(160, 185, 230, 0.45)', fontSize: 10, textTransform: 'uppercase', textAlign: 'center', fontWeight: '700', letterSpacing: 0.5 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setRowComplete: { opacity: 0.75 },
  setNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  setNumberComplete: { backgroundColor: 'rgba(74, 222, 128, 0.15)', borderColor: 'rgba(74,222,128,0.25)' },
  setNumberText: { color: 'rgba(160, 185, 230, 0.65)', fontSize: 12, fontWeight: '700' },
  setInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    color: 'rgba(240, 244, 255, 0.92)',
    borderRadius: 14,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  target: { color: 'rgba(160, 185, 230, 0.45)', fontSize: 12, marginTop: 10, textAlign: 'center', fontWeight: '600' },
})
