import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'
import { api } from '@/lib/api'

const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface Exercise {
  id: number
  order: number
  sets: number
  reps: string
  rpe?: number
  notes?: string
  exercise: {
    id: string
    name: string
    muscleGroup?: string
    category?: string
    equipment?: string
  }
}

interface ProgramDay {
  id: number
  dayOfWeek: number
  label?: string
  exercises: Exercise[]
}

interface ProgramWeek {
  id: number
  weekNumber: number
  days: ProgramDay[]
}

interface ProgramData {
  program: {
    id: string
    name: string
    description?: string | null
    startDate?: string | null
    endDate?: string | null
    weeks: ProgramWeek[]
  } | null
  currentWeekNumber: number | null
}

export default function ClientProgramScreen() {
  const [data, setData] = useState<ProgramData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | null>(null)
  const [expandedDayId, setExpandedDayId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async () => {
    try {
      setErrorMessage('')
      const { data: response } = await api.get('/client/program')
      setData(response)
      const initialWeek = response.currentWeekNumber ?? response.program?.weeks?.[0]?.weekNumber ?? null
      setSelectedWeekNumber(initialWeek)
      setExpandedDayId(response.program?.weeks?.[0]?.days?.[0]?.id ?? null)
    } catch (error: any) {
      setData(null)
      setSelectedWeekNumber(null)
      setExpandedDayId(null)
      setErrorMessage(
        error?.response?.data?.error ??
        error?.message ??
        'No se pudo cargar el programa'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const selectedWeek = useMemo(() => {
    if (!data?.program || selectedWeekNumber == null) return null
    return data.program.weeks.find((week) => week.weekNumber === selectedWeekNumber) ?? null
  }, [data, selectedWeekNumber])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>
  }

  if (!data?.program) {
    return (
      <LiquidGlassBackground>
        <View style={styles.centeredContent}>
          <View style={[glass.card, styles.emptyCard]}>
            <Ionicons name="barbell-outline" size={40} color="#334155" />
            <Text style={styles.emptyTitle}>
              {errorMessage ? 'No se pudo cargar el programa' : 'Sin programa asignado'}
            </Text>
            <Text style={styles.emptySub}>
              {errorMessage || 'Tu entrenador todavía no te ha asignado una rutina.'}
            </Text>
          </View>
        </View>
      </LiquidGlassBackground>
    )
  }

  return (
    <LiquidGlassBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#113b7a" />}
      >
        <Text style={styles.eyebrow}>Assigned Program</Text>
        <Text style={styles.title}>Mi programa</Text>
        <Text style={styles.subtitle}>
          Aquí puedes ver toda tu rutina asignada aunque hoy no tengas sesión con tu entrenador.
        </Text>

        <View style={[glass.card, styles.heroCard]}>
          <Text style={styles.programName}>{data.program.name}</Text>
          {data.program.description ? <Text style={styles.programDescription}>{data.program.description}</Text> : null}
          {data.currentWeekNumber ? (
            <View style={styles.currentWeekBadge}>
              <Text style={styles.currentWeekText}>Semana actual: {data.currentWeekNumber}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Semanas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekChipsRow}>
          {data.program.weeks.map((week) => {
            const isSelected = week.weekNumber === selectedWeekNumber
            const isCurrent = week.weekNumber === data.currentWeekNumber
            return (
              <TouchableOpacity
                key={week.id}
                style={[
                  styles.weekChip,
                  isSelected && styles.weekChipSelected,
                  isCurrent && !isSelected && styles.weekChipCurrent,
                ]}
                onPress={() => {
                  setSelectedWeekNumber(week.weekNumber)
                  setExpandedDayId(week.days[0]?.id ?? null)
                }}
              >
                <Text style={[styles.weekChipText, isSelected && styles.weekChipTextSelected]}>
                  Semana {week.weekNumber}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Rutina semanal</Text>
        {!selectedWeek || selectedWeek.days.length === 0 ? (
          <View style={[glass.card, styles.emptyDayCard]}>
            <Text style={styles.emptySub}>Esta semana todavía no tiene días configurados.</Text>
          </View>
        ) : (
          selectedWeek.days.map((day) => {
            const expanded = expandedDayId === day.id
            return (
              <View key={day.id} style={[glass.card, styles.dayCard]}>
                <TouchableOpacity
                  style={styles.dayHeader}
                  onPress={() => setExpandedDayId(expanded ? null : day.id)}
                >
                  <View>
                    <Text style={styles.dayTitle}>{DAYS_ES[day.dayOfWeek]}</Text>
                    {day.label ? <Text style={styles.dayLabel}>{day.label}</Text> : null}
                  </View>
                  <View style={styles.dayHeaderRight}>
                    <Text style={styles.exerciseCounter}>
                      {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                    </Text>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#64748b"
                    />
                  </View>
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.dayBody}>
                    {day.exercises.length === 0 ? (
                      <Text style={styles.emptySub}>Este día no tiene ejercicios todavía.</Text>
                    ) : (
                      day.exercises.map((exercise, index) => (
                        <View key={exercise.id} style={[glass.softCard, styles.exerciseCard]}>
                          <View style={styles.exerciseIndex}>
                            <Text style={styles.exerciseIndexText}>{index + 1}</Text>
                          </View>
                          <View style={styles.exerciseBody}>
                            <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                            <Text style={styles.exerciseMeta}>
                              {exercise.sets} x {exercise.reps}
                              {exercise.rpe ? ` · RPE ${exercise.rpe}` : ''}
                            </Text>
                            {exercise.notes ? <Text style={styles.exerciseNotes}>{exercise.notes}</Text> : null}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
    </LiquidGlassBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 62, paddingBottom: 130 },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  centeredContent: { flex: 1, padding: 20, justifyContent: 'center' },
  eyebrow: { color: '#5d6f85', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '800', color: '#10213a' },
  subtitle: { color: '#5d6f85', fontSize: 14, marginTop: 6, marginBottom: 18 },
  heroCard: { padding: 18, marginBottom: 18 },
  programName: { color: '#10213a', fontSize: 22, fontWeight: '800' },
  programDescription: { color: '#5d6f85', fontSize: 14, marginTop: 8 },
  currentWeekBadge: { alignSelf: 'flex-start', marginTop: 12, backgroundColor: '#dce8ff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  currentWeekText: { color: '#234675', fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 14, color: '#5d6f85', fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  weekChipsRow: { gap: 8, paddingBottom: 14 },
  weekChip: { backgroundColor: 'rgba(255,255,255,0.42)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  weekChipSelected: { backgroundColor: '#113b7a' },
  weekChipCurrent: { borderWidth: 1, borderColor: '#93c5fd' },
  weekChipText: { color: '#40556e', fontSize: 13, fontWeight: '700' },
  weekChipTextSelected: { color: '#fff' },
  dayCard: { marginBottom: 10, padding: 14 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  dayHeaderRight: { alignItems: 'flex-end', gap: 4 },
  dayTitle: { color: '#10213a', fontSize: 17, fontWeight: '800' },
  dayLabel: { color: '#234675', fontSize: 13, marginTop: 4, fontWeight: '700' },
  exerciseCounter: { color: '#5d6f85', fontSize: 12, fontWeight: '700' },
  dayBody: { marginTop: 14, gap: 8 },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
  exerciseIndex: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center' },
  exerciseIndexText: { color: '#40556e', fontSize: 12, fontWeight: '700' },
  exerciseBody: { flex: 1 },
  exerciseName: { color: '#10213a', fontSize: 15, fontWeight: '700' },
  exerciseMeta: { color: '#5d6f85', fontSize: 13, marginTop: 4 },
  exerciseNotes: { color: '#4c6079', fontSize: 12, marginTop: 4 },
  emptyCard: { alignItems: 'center', padding: 40, gap: 12 },
  emptyDayCard: { padding: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#2c4560' },
  emptySub: { fontSize: 14, color: '#5d6f85' },
})
