import { useEffect, useState, useCallback, useRef } from 'react'
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

// Estado por ejercicio: array de series logueadas
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

  // Carga ejercicios del día y log existente
  const load = useCallback(async () => {
    try {
      setLoadError('')
      // Sacamos los ejercicios del día desde el programa
      const todayRes = await api.get('/client/today')
      const day = todayRes.data.day
      if (day) {
        setExercises(day.exercises)
        // Inicializar log vacío por ejercicio
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

      // Si hay log existente, cargamos los valores guardados
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
        // Merge: mantener estructura del programa pero rellenar con valores guardados
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

      // Último peso usado por ejercicio (para sugerencia)
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
    const sets = log[exId] ?? []
    return sets.filter(isSetComplete).length
  }

  function totalProgress() {
    let done = 0
    let total = 0
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
        `Faltan ${total - done} series por registrar. ¿Guardar igualmente?`,
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
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>
  }

  if (loadError && exercises.length === 0) {
    return <View style={styles.center}><Text style={styles.empty}>{loadError}</Text></View>
  }

  const { done, total } = totalProgress()
  const progress = total > 0 ? done / total : 0

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LiquidGlassBackground>
        <View style={styles.container}>
        {/* Header fijo */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#113b7a" />
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
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{done} / {total} series</Text>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {exercises.map((ex) => {
            const exId = ex.exercise.id
            const sets = log[exId] ?? []
            const done = exerciseProgress(exId)
            const isActive = activeExercise === exId

            return (
              <View key={ex.id} style={[glass.card, styles.exCard, isActive && styles.exCardActive]}>
                {/* Cabecera ejercicio */}
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
                    <Text style={[styles.exBadgeText, done === sets.length && styles.exBadgeComplete]}>
                      {done}/{sets.length}
                    </Text>
                  </View>
                  <Ionicons
                    name={isActive ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748b"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>

                {/* Series — solo si activo */}
                {isActive && (
                  <View style={styles.setsContainer}>
                    {/* Sugerencia peso anterior */}
                    {lastWeights[exId] && (
                      <Text style={styles.lastWeight}>
                        Último registro: {lastWeights[exId]} kg
                      </Text>
                    )}

                    {/* Cabecera columnas */}
                    <View style={styles.setHeader}>
                      <Text style={[styles.setHeaderText, { width: 28 }]}>Serie</Text>
                      <Text style={[styles.setHeaderText, { flex: 1 }]}>Peso (kg)</Text>
                      <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
                      <Text style={[styles.setHeaderText, { width: 52 }]}>RPE</Text>
                      <View style={{ width: 24 }} />
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

                    {/* Objetivo */}
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
        placeholderTextColor="#334155"
        keyboardType="decimal-pad"
        value={set.weight}
        onChangeText={onWeight}
        selectTextOnFocus
      />

      <TextInput
        style={[styles.setInput, { flex: 1 }]}
        placeholder={set.reps}
        placeholderTextColor="#334155"
        keyboardType="numeric"
        value={set.reps}
        onChangeText={onReps}
        selectTextOnFocus
      />

      <TextInput
        style={[styles.setInput, { width: 52 }]}
        placeholder="—"
        placeholderTextColor="#334155"
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
  empty: { color: '#5d6f85', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  eyebrow: { color: '#5d6f85', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2, textAlign: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#10213a' },
  finishBtn: { backgroundColor: '#113b7a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  finishBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  // Progreso
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.45)', marginHorizontal: 20, borderRadius: 999 },
  progressFill: { height: 6, backgroundColor: '#113b7a', borderRadius: 999 },
  progressText: { color: '#55687e', fontSize: 12, textAlign: 'right', marginHorizontal: 20, marginTop: 4, marginBottom: 12, fontWeight: '600' },
  scroll: { padding: 20, paddingTop: 4, paddingBottom: 120 },
  // Ejercicio card
  exCard: { borderRadius: 20, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  exCardActive: { borderColor: 'rgba(17,59,122,0.28)' },
  exHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  exName: { fontSize: 15, fontWeight: '700', color: '#10213a' },
  exMuscle: { fontSize: 12, color: '#5d6f85', marginTop: 2 },
  exBadge: { backgroundColor: 'rgba(255,255,255,0.42)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  exBadgeText: { color: '#55687e', fontSize: 13, fontWeight: '700' },
  exBadgeComplete: { color: '#1f7a46' },
  // Series
  setsContainer: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)', padding: 14, paddingTop: 10 },
  lastWeight: { color: '#55687e', fontSize: 12, marginBottom: 10, textAlign: 'right', fontWeight: '600' },
  setHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 4 },
  setHeaderText: { color: '#55687e', fontSize: 11, textTransform: 'uppercase', textAlign: 'center', fontWeight: '700' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setRowComplete: { opacity: 0.8 },
  setNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.42)', alignItems: 'center', justifyContent: 'center' },
  setNumberComplete: { backgroundColor: '#daf8e5' },
  setNumberText: { color: '#55687e', fontSize: 12, fontWeight: '700' },
  setInput: {
    backgroundColor: 'rgba(255,255,255,0.46)',
    color: '#10213a',
    borderRadius: 12,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.48)',
  },
  target: { color: '#55687e', fontSize: 12, marginTop: 8, textAlign: 'center', fontWeight: '600' },
})
