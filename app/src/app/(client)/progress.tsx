import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

interface LogSet {
  id: number
  setNumber: number
  reps: number
  weight: number
  rpe?: number
  exercise: { id: string; name: string; muscleGroup?: string }
}

interface WorkoutLog {
  id: string
  date: string
  notes?: string
  sets: LogSet[]
}

export default function ProgressScreen() {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async () => {
    try {
      setErrorMessage('')
      const { data } = await api.get('/client/workouts')
      setLogs(data)
      if (data.length > 0) setExpanded(data[0].id)
    } catch (error: any) {
      setLogs([])
      setErrorMessage(error?.response?.data?.error ?? 'No se pudo cargar el historial')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#5b9cf6" size="large" /></View>
  }

  return (
    <LiquidGlassBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#5b9cf6" />}
      >
        <Text style={styles.eyebrow}>Performance Archive</Text>
        <Text style={styles.title}>Historial</Text>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {logs.length === 0 && (
          <View style={[glass.card as any, styles.emptyCard]}>
            <Ionicons name="trending-up-outline" size={44} color="rgba(160, 185, 230, 0.45)" />
            <Text style={styles.emptyTitle}>Sin entrenamientos todavía</Text>
            <Text style={styles.emptySub}>Registra tu primer entrenamiento desde la pestaña Hoy</Text>
          </View>
        )}

        {logs.map((log) => {
          const date = new Date(log.date)
          const dateStr = `${date.getDate()} ${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`
          const isExpanded = expanded === log.id

          const byExercise: Record<string, { name: string; muscleGroup?: string; sets: LogSet[] }> = {}
          for (const s of log.sets) {
            if (!byExercise[s.exercise.id]) {
              byExercise[s.exercise.id] = { name: s.exercise.name, muscleGroup: s.exercise.muscleGroup, sets: [] }
            }
            byExercise[s.exercise.id].sets.push(s)
          }

          const totalVolume = log.sets.reduce((acc, s) => acc + s.weight * s.reps, 0)
          const exercises = Object.values(byExercise)

          return (
            <View key={log.id} style={[glass.card as any, styles.logCard]}>
              <TouchableOpacity
                style={styles.logHeader}
                onPress={() => setExpanded(isExpanded ? null : log.id)}
              >
                <View style={styles.dateBadge}>
                  <Text style={styles.dateDay}>{date.getDate()}</Text>
                  <Text style={styles.dateMonth}>{MONTHS_ES[date.getMonth()].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logDate}>{dateStr}</Text>
                  <Text style={styles.logMeta}>
                    {exercises.length} ejercicios · {log.sets.length} series · {totalVolume.toLocaleString('es-ES')} kg
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="rgba(160, 185, 230, 0.45)"
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.logBody}>
                  {exercises.map((ex, i) => {
                    const maxWeight = Math.max(...ex.sets.map((s) => s.weight))
                    return (
                      <View key={i} style={styles.exRow}>
                        <View style={styles.exRowLeft}>
                          <Text style={styles.exRowName}>{ex.name}</Text>
                          {ex.muscleGroup && <Text style={styles.exRowMuscle}>{ex.muscleGroup}</Text>}
                        </View>
                        <View style={styles.exRowSets}>
                          {ex.sets.map((s) => (
                            <View key={s.id} style={[glass.pill as any, styles.setChip]}>
                              <Text style={styles.setChipText}>{s.weight}kg × {s.reps}</Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.maxWeight}>{maxWeight} kg</Text>
                      </View>
                    )
                  })}
                  {log.notes && <Text style={styles.notes}>{log.notes}</Text>}
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>
    </LiquidGlassBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 62, paddingBottom: 130 },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  eyebrow: { color: 'rgba(160, 185, 230, 0.60)', fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '800', color: 'rgba(240, 244, 255, 0.95)', marginBottom: 20, letterSpacing: -0.5 },
  errorText: { color: '#f87171', fontSize: 13, marginBottom: 12, fontWeight: '600' },
  emptyCard: { alignItems: 'center', padding: 44, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: 'rgba(240, 244, 255, 0.80)' },
  emptySub: { fontSize: 14, color: 'rgba(160, 185, 230, 0.50)', textAlign: 'center' },
  logCard: { marginBottom: 10, overflow: 'hidden' },
  logHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  dateBadge: { width: 44, alignItems: 'center' },
  dateDay: { fontSize: 22, fontWeight: '800', color: 'rgba(240, 244, 255, 0.92)', letterSpacing: -0.5 },
  dateMonth: { fontSize: 10, color: 'rgba(160, 185, 230, 0.55)', fontWeight: '700', letterSpacing: 1 },
  logDate: { fontSize: 15, fontWeight: '700', color: 'rgba(240, 244, 255, 0.88)' },
  logMeta: { fontSize: 12, color: 'rgba(160, 185, 230, 0.55)', marginTop: 2 },
  logBody: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', padding: 16, gap: 12 },
  exRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  exRowLeft: { width: 110 },
  exRowName: { color: 'rgba(240, 244, 255, 0.88)', fontSize: 13, fontWeight: '700' },
  exRowMuscle: { color: 'rgba(160, 185, 230, 0.50)', fontSize: 11 },
  exRowSets: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  setChip: { paddingHorizontal: 8, paddingVertical: 4 },
  setChipText: { color: 'rgba(200, 220, 255, 0.70)', fontSize: 12, fontWeight: '600' },
  maxWeight: { color: '#5b9cf6', fontSize: 13, fontWeight: '800', minWidth: 50, textAlign: 'right' },
  notes: { color: 'rgba(160, 185, 230, 0.50)', fontSize: 13, fontStyle: 'italic' },
})
