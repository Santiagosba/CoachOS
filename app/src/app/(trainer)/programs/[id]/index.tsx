import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface Exercise { id: number; exercise: { name: string }; sets: number; reps: string; rpe?: number }
interface Day { id: number; dayOfWeek: number; label?: string; exercises: Exercise[] }
interface Week { id: number; weekNumber: number; days: Day[] }
interface Program { id: string; name: string; clientId: string; weeks: Week[] }

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)
  const [creatingWeekId, setCreatingWeekId] = useState<number | null>(null)
  const [newDayLabel, setNewDayLabel] = useState('')
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    if (!id) {
      setProgram(null)
      setLoading(false)
      return
    }

    try {
      setLoadError('')
      const { data } = await api.get(`/programs/${id}`)
      setProgram(data)
      if (data.weeks.length > 0) setExpandedWeek(data.weeks[0].id)
    } catch (error: any) {
      setProgram(null)
      setLoadError(error?.response?.data?.error ?? 'No se pudo cargar el programa')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function addWeek() {
    try {
      await api.post(`/programs/${id}/weeks`)
      load()
    } catch {
      Alert.alert('Error', 'No se pudo añadir la semana')
    }
  }

  async function deleteProgram() {
    if (!program) return

    const clientId = program.clientId

    confirmAction('Eliminar programa', '¿Seguro? Se borrarán semanas, días y ejercicios de este programa.', async () => {
      try {
        await api.delete(`/programs/${id}`)
        router.replace({
          pathname: '/(trainer)/clients/[id]',
          params: { id: clientId },
        })
      } catch {
        Alert.alert('Error', 'No se pudo eliminar el programa')
      }
    })
  }

  async function deleteWeek(weekId: number) {
    Alert.alert('Eliminar semana', '¿Seguro? Se borrarán todos los días y ejercicios.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/programs/${id}/weeks/${weekId}`)
          load()
        },
      },
    ])
  }

  async function addDay(weekId: number, dayOfWeek: number) {
    try {
      await api.post(`/programs/${id}/weeks/${weekId}/days`, {
        dayOfWeek,
        label: newDayLabel.trim() || undefined,
      })
      setCreatingWeekId(null)
      setNewDayLabel('')
      load()
    } catch {
      Alert.alert('Error', 'No se pudo añadir el día')
    }
  }

  async function deleteDay(weekId: number, dayId: number) {
    Alert.alert('Eliminar día', '¿Seguro? Se borrarán sus ejercicios.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/programs/${id}/weeks/${weekId}/days/${dayId}`)
          load()
        },
      },
    ])
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>
  }
  if (!program) {
    return <View style={styles.center}><Text style={styles.empty}>{loadError || 'Programa no encontrado'}</Text></View>
  }

  return (
    <LiquidGlassBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color="#113b7a" />
        <Text style={styles.backText}>Cliente</Text>
      </TouchableOpacity>
      <Text style={styles.eyebrow}>Program Structure</Text>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{program.name}</Text>
          <Text style={styles.subtitle}>{program.weeks.length} semanas</Text>
        </View>
        <TouchableOpacity style={styles.deleteProgramButton} onPress={deleteProgram}>
          <Ionicons name="trash-outline" size={18} color="#fca5a5" />
        </TouchableOpacity>
      </View>

      {/* Semanas */}
      {program.weeks.map((week) => (
        <View key={week.id} style={[glass.card, styles.weekCard]}>
          <TouchableOpacity
            style={styles.weekHeader}
            onPress={() => setExpandedWeek(expandedWeek === week.id ? null : week.id)}
          >
            <Text style={styles.weekTitle}>Semana {week.weekNumber}</Text>
            <View style={styles.weekHeaderRight}>
              <TouchableOpacity onPress={() => deleteWeek(week.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="trash-outline" size={18} color="#475569" />
              </TouchableOpacity>
              <Ionicons
                name={expandedWeek === week.id ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748b"
                style={{ marginLeft: 12 }}
              />
            </View>
          </TouchableOpacity>

          {expandedWeek === week.id && (
            <View style={styles.weekBody}>
              {week.days.length === 0 && (
                <Text style={styles.empty}>Sin días configurados</Text>
              )}
              {week.days.map((day) => (
                <View
                  key={day.id}
                  style={styles.dayRow}
                >
                  <TouchableOpacity
                    style={styles.dayPressable}
                    onPress={() => router.push(`/(trainer)/programs/${id}/day/${day.id}`)}
                  >
                    <View style={styles.dayLeft}>
                      <Text style={styles.dayName}>{DAYS[day.dayOfWeek]}</Text>
                      {day.label && <Text style={styles.dayLabel}>{day.label}</Text>}
                    </View>
                    <View style={styles.dayRight}>
                      <Text style={styles.exerciseCount}>
                        {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#475569" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteDay(week.id, day.id)} style={styles.dayDelete}>
                    <Ionicons name="trash-outline" size={16} color="#475569" />
                  </TouchableOpacity>
                </View>
              ))}

              {creatingWeekId === week.id ? (
                <View style={styles.addDayCard}>
                  <Text style={styles.addDayTitle}>Añadir día</Text>
                  <View style={styles.daysWrap}>
                    {DAYS.map((dayName, index) => {
                      const exists = week.days.some((day) => day.dayOfWeek === index)
                      return (
                        <TouchableOpacity
                          key={dayName}
                          disabled={exists}
                          style={[styles.dayChip, exists && styles.dayChipDisabled]}
                          onPress={() => addDay(week.id, index)}
                        >
                          <Text style={[styles.dayChipText, exists && styles.dayChipTextDisabled]}>
                            {dayName}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                  <TextInput
                    value={newDayLabel}
                    onChangeText={setNewDayLabel}
                    style={styles.dayInput}
                    placeholder="Etiqueta opcional: Push, Pull, Piernas..."
                    placeholderTextColor="#475569"
                  />
                  <TouchableOpacity onPress={() => { setCreatingWeekId(null); setNewDayLabel('') }}>
                    <Text style={styles.cancelAddDay}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addDayButton} onPress={() => setCreatingWeekId(week.id)}>
                  <Ionicons name="add" size={16} color="#6366f1" />
                  <Text style={styles.addDayButtonText}>Añadir día a la semana</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ))}

      {/* Añadir semana */}
      <TouchableOpacity style={[glass.card, styles.addWeekBtn]} onPress={addWeek}>
        <Ionicons name="add" size={20} color="#6366f1" />
        <Text style={styles.addWeekText}>Añadir semana</Text>
      </TouchableOpacity>
      </ScrollView>
    </LiquidGlassBackground>
  )
}

function confirmAction(title: string, message: string, onConfirm: () => void | Promise<void>) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      void onConfirm()
    }
    return
  }

  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Eliminar',
      style: 'destructive',
      onPress: () => {
        void onConfirm()
      },
    },
  ])
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { color: '#113b7a', fontSize: 16, fontWeight: '700' },
  eyebrow: { color: '#5d6f85', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 30, fontWeight: '800', color: '#10213a' },
  subtitle: { fontSize: 14, color: '#5d6f85', marginBottom: 24, marginTop: 4 },
  deleteProgramButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4d4dc',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  weekCard: { borderRadius: 24, marginBottom: 12, overflow: 'hidden' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  weekTitle: { fontSize: 16, fontWeight: '700', color: '#10213a' },
  weekHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  weekBody: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)', paddingVertical: 4 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  dayPressable: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dayDelete: { paddingHorizontal: 16, paddingVertical: 12 },
  dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayName: { fontSize: 15, fontWeight: '700', color: '#10213a', width: 36 },
  dayLabel: {
    fontSize: 12,
    color: '#234675',
    backgroundColor: '#dce8ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dayRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exerciseCount: { fontSize: 13, color: '#55687e' },
  addDayButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  addDayButtonText: { color: '#113b7a', fontSize: 14, fontWeight: '700' },
  addDayCard: { padding: 16, gap: 12 },
  addDayTitle: { color: '#10213a', fontSize: 14, fontWeight: '700' },
  daysWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  dayChipDisabled: { opacity: 0.4 },
  dayChipText: { color: '#55687e', fontSize: 13, fontWeight: '700' },
  dayChipTextDisabled: { color: '#7e90a4' },
  dayInput: { backgroundColor: 'rgba(255,255,255,0.42)', color: '#10213a', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 12, paddingVertical: 12, fontSize: 14 },
  cancelAddDay: { color: '#55687e', fontSize: 13, fontWeight: '700' },
  addWeekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    marginTop: 4,
  },
  addWeekText: { color: '#113b7a', fontSize: 15, fontWeight: '700' },
  empty: { color: '#5d6f85', fontSize: 14, padding: 12 },
})
