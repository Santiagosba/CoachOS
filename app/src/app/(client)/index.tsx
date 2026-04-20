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
    return <View style={styles.center}><ActivityIndicator color="#5b9cf6" size="large" /></View>
  }

  const { program, week, day, existingLog } = data ?? {}
  const alreadyLogged = !!existingLog

  return (
    <LiquidGlassBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#5b9cf6" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Workout Today</Text>
            <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]}</Text>
            <Text style={styles.dateText}>{DAYS_ES[todayIndex]}, {dateStr}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={[glass.pill as any, styles.logoutButton]}>
            <Ionicons name="log-out-outline" size={18} color="#5b9cf6" />
          </TouchableOpacity>
        </View>

        {/* Sin programa */}
        {!program && (
          <View style={[glass.card as any, styles.emptyCard]}>
            <Ionicons name="barbell-outline" size={44} color="rgba(160, 185, 230, 0.55)" />
            <Text style={styles.emptyTitle}>Sin programa asignado</Text>
            <Text style={styles.emptySub}>Tu entrenador todavía no te ha asignado un programa</Text>
          </View>
        )}

        {/* Descanso */}
        {program && !day && (
          <View style={[glass.card as any, styles.restCard]}>
            <Text style={styles.restEmoji}>😴</Text>
            <Text style={styles.restTitle}>Día de descanso</Text>
            <Text style={styles.restSub}>{program.name} · Sem. {week?.weekNumber}</Text>
          </View>
        )}

        {/* Entrenamiento */}
        {program && day && (
          <>
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

            {alreadyLogged && (
              <TouchableOpacity
                style={styles.loggedBanner}
                onPress={() => router.push({ pathname: '/(client)/log', params: { logId: existingLog!.id } })}
              >
                <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                <Text style={styles.loggedBannerText}>
                  Entrenamiento registrado · {(existingLog!.sets as unknown[]).length} series
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#4ade80" />
              </TouchableOpacity>
            )}

            <Text style={styles.sectionTitle}>{day.exercises.length} ejercicios</Text>

            {day.exercises.map((ex, idx) => (
              <View key={ex.id} style={[glass.softCard as any, styles.exCard]}>
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

            <TouchableOpacity
              style={[styles.startBtn, alreadyLogged && styles.startBtnSecondary]}
              onPress={() =>
                router.push({
                  pathname: '/(client)/log',
                  params: { dayId: String(day.id), logId: existingLog?.id ?? '' },
                })
              }
            >
              <Ionicons name={alreadyLogged ? 'pencil' : 'play'} size={18} color="#fff" />
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
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 62, paddingBottom: 130 },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  eyebrow: { color: 'rgba(160, 185, 230, 0.60)', fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 },
  greeting: { fontSize: 30, fontWeight: '800', color: 'rgba(240, 244, 255, 0.95)', letterSpacing: -0.5 },
  dateText: { fontSize: 14, color: 'rgba(160, 185, 230, 0.55)', marginTop: 2 },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 11 },
  // Sin programa
  emptyCard: { alignItems: 'center', padding: 44, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: 'rgba(240, 244, 255, 0.80)' },
  emptySub: { fontSize: 14, color: 'rgba(160, 185, 230, 0.50)', textAlign: 'center' },
  // Descanso
  restCard: { alignItems: 'center', padding: 44, gap: 8 },
  restEmoji: { fontSize: 52 },
  restTitle: { fontSize: 20, fontWeight: '800', color: 'rgba(240, 244, 255, 0.90)' },
  restSub: { fontSize: 14, color: 'rgba(160, 185, 230, 0.55)' },
  // Programa info
  programBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  programBadge: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  programBadgeText: { color: 'rgba(200, 220, 255, 0.75)', fontSize: 13, fontWeight: '700' },
  weekBadge: { color: 'rgba(160, 185, 230, 0.55)', fontSize: 13, paddingVertical: 7 },
  labelBadge: { backgroundColor: 'rgba(91, 156, 246, 0.15)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(91,156,246,0.25)' },
  labelBadgeText: { color: '#5b9cf6', fontSize: 13, fontWeight: '700' },
  // Ya registrado
  loggedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.20)',
  },
  loggedBannerText: { flex: 1, color: '#4ade80', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 12, color: 'rgba(160, 185, 230, 0.55)', fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  // Ejercicios
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  exLeft: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  exNumber: { color: 'rgba(160, 185, 230, 0.70)', fontSize: 12, fontWeight: '700' },
  exBody: { flex: 1 },
  exName: { color: 'rgba(240, 244, 255, 0.92)', fontSize: 15, fontWeight: '700' },
  exMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 },
  exMuscle: { color: 'rgba(160, 185, 230, 0.55)', fontSize: 12, marginTop: 2 },
  exTag: { color: 'rgba(160, 185, 230, 0.60)', fontSize: 11, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  exRight: { alignItems: 'flex-end' },
  exSets: { color: '#5b9cf6', fontSize: 15, fontWeight: '800' },
  exRpe: { color: 'rgba(160, 185, 230, 0.55)', fontSize: 12, marginTop: 2 },
  // CTA
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2b5fd9',
    borderRadius: 22,
    padding: 18,
    marginTop: 20,
    shadowColor: '#3b72f5',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.50,
    shadowRadius: 28,
    elevation: 12,
  },
  startBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.10)', shadowOpacity: 0 },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
