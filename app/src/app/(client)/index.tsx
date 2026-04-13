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
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/lib/auth-store'
import { api } from '@/lib/api'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'

const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

interface Exercise {
  id: number
  order: number
  sets: number
  reps: string
  rpe?: number
  notes?: string
  exercise: { id: string; name: string; muscleGroup?: string; category?: string; equipment?: string }
}

interface TodayData {
  program: { id: string; name: string } | null
  week: { id: number; weekNumber: number } | null
  day: {
    id: number
    dayOfWeek: number
    label?: string
    exercises: Exercise[]
  } | null
  existingLog: { id: string; sets: unknown[] } | null
}

export default function ClientTodayScreen() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data: res } = await api.get('/client/today')
      setData(res)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const today = new Date()
  const jsDay = today.getDay()
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1
  const dateStr = `${today.getDate()} ${MONTHS_ES[today.getMonth()]}`

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>
  }

  const { program, week, day, existingLog } = data ?? {}
  const alreadyLogged = !!existingLog

  return (
    <LiquidGlassBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#113b7a" />}
      >
      {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Workout Today</Text>
            <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]}</Text>
            <Text style={styles.dateText}>{DAYS_ES[todayIndex]}, {dateStr}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={[glass.pill, styles.logoutButton]}>
            <Ionicons name="log-out-outline" size={18} color="#113b7a" />
          </TouchableOpacity>
        </View>

      {/* Sin programa */}
      {!program && (
        <View style={[glass.card, styles.emptyCard]}>
          <Ionicons name="barbell-outline" size={40} color="#334155" />
          <Text style={styles.emptyTitle}>Sin programa asignado</Text>
          <Text style={styles.emptySub}>Tu entrenador todavía no te ha asignado un programa</Text>
        </View>
      )}

      {/* Hay programa pero hoy es descanso */}
      {program && !day && (
        <View style={[glass.card, styles.restCard]}>
          <Text style={styles.restEmoji}>😴</Text>
          <Text style={styles.restTitle}>Día de descanso</Text>
          <Text style={styles.restSub}>{program.name} · Sem. {week?.weekNumber}</Text>
        </View>
      )}

      {/* Entrenamiento del día */}
      {program && day && (
        <>
          {/* Info del programa */}
          <View style={styles.programBadgeRow}>
            <View style={styles.programBadge}>
              <Text style={styles.programBadgeText}>{program.name}</Text>
            </View>
            <Text style={styles.weekBadge}>Sem. {week?.weekNumber}</Text>
            {day.label && (
              <View style={styles.labelBadge}>
                <Text style={styles.labelBadgeText}>{day.label}</Text>
              </View>
            )}
          </View>

          {/* Estado del log */}
          {alreadyLogged && (
            <TouchableOpacity
              style={styles.loggedBanner}
              onPress={() => router.push({ pathname: '/(client)/log', params: { logId: existingLog!.id } })}
            >
              <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
              <Text style={styles.loggedBannerText}>
                Entrenamiento registrado hoy · {(existingLog!.sets as unknown[]).length} series
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#4ade80" />
            </TouchableOpacity>
          )}

          {/* Lista de ejercicios */}
          <Text style={styles.sectionTitle}>
            {day.exercises.length} ejercicios
          </Text>

          {day.exercises.map((ex, idx) => (
            <View key={ex.id} style={[glass.softCard, styles.exCard]}>
              <View style={styles.exLeft}>
                <Text style={styles.exNumber}>{idx + 1}</Text>
              </View>
              <View style={styles.exBody}>
                <Text style={styles.exName}>{ex.exercise.name}</Text>
                <View style={styles.exMetaRow}>
                  {ex.exercise.muscleGroup && (
                    <Text style={styles.exMuscle}>{ex.exercise.muscleGroup}</Text>
                  )}
                  {ex.exercise.category && (
                    <Text style={styles.exTag}>{formatMeta(ex.exercise.category)}</Text>
                  )}
                  {ex.exercise.equipment && (
                    <Text style={styles.exTag}>{ex.exercise.equipment}</Text>
                  )}
                </View>
              </View>
              <View style={styles.exRight}>
                <Text style={styles.exSets}>{ex.sets}×{ex.reps}</Text>
                {ex.rpe && <Text style={styles.exRpe}>RPE {ex.rpe}</Text>}
              </View>
            </View>
          ))}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.startBtn, alreadyLogged && styles.startBtnSecondary]}
            onPress={() =>
              router.push({
                pathname: '/(client)/log',
                params: {
                  dayId: String(day.id),
                  logId: existingLog?.id ?? '',
                },
              })
            }
          >
            <Ionicons
              name={alreadyLogged ? 'pencil' : 'play'}
              size={18}
              color="#fff"
            />
            <Text style={styles.startBtnText}>
              {alreadyLogged ? 'Ver / editar registro' : 'Registrar entrenamiento'}
            </Text>
          </TouchableOpacity>
        </>
      )}
      </ScrollView>
    </LiquidGlassBackground>
  )
}

function formatMeta(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 62, paddingBottom: 130 },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  eyebrow: { color: '#5d6f85', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  greeting: { fontSize: 30, fontWeight: '800', color: '#10213a' },
  dateText: { fontSize: 14, color: '#5d6f85', marginTop: 2 },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 11 },
  // Sin programa
  emptyCard: { alignItems: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#2c4560' },
  emptySub: { fontSize: 14, color: '#5d6f85', textAlign: 'center' },
  // Descanso
  restCard: { alignItems: 'center', padding: 40, gap: 8 },
  restEmoji: { fontSize: 48 },
  restTitle: { fontSize: 20, fontWeight: '800', color: '#10213a' },
  restSub: { fontSize: 14, color: '#5d6f85' },
  // Programa info
  programBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  programBadge: { backgroundColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  programBadgeText: { color: '#40556e', fontSize: 13, fontWeight: '700' },
  weekBadge: { color: '#5d6f85', fontSize: 13, paddingVertical: 7 },
  labelBadge: { backgroundColor: '#dce8ff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  labelBadgeText: { color: '#234675', fontSize: 13, fontWeight: '700' },
  // Ya registrado
  loggedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(216, 255, 232, 0.78)',
    borderRadius: 18,
    padding: 12,
    marginBottom: 20,
  },
  loggedBannerText: { flex: 1, color: '#1f7a46', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 14, color: '#5d6f85', fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Ejercicios
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  exLeft: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center' },
  exNumber: { color: '#40556e', fontSize: 12, fontWeight: '700' },
  exBody: { flex: 1 },
  exName: { color: '#10213a', fontSize: 15, fontWeight: '700' },
  exMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  exMuscle: { color: '#5d6f85', fontSize: 12, marginTop: 2 },
  exTag: { color: '#4c6079', fontSize: 11, backgroundColor: 'rgba(255,255,255,0.54)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  exRight: { alignItems: 'flex-end' },
  exSets: { color: '#113b7a', fontSize: 15, fontWeight: '800' },
  exRpe: { color: '#5d6f85', fontSize: 12, marginTop: 2 },
  // CTA
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#113b7a',
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
  },
  startBtnSecondary: { backgroundColor: '#5b7087' },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
