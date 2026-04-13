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
interface Template { id: string; name: string; weeks: Week[] }

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)
  const [creatingWeekId, setCreatingWeekId] = useState<number | null>(null)
  const [newDayLabel, setNewDayLabel] = useState('')
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [savingMeta, setSavingMeta] = useState(false)

  const load = useCallback(async () => {
    if (!id) {
      setTemplate(null)
      setLoading(false)
      return
    }

    try {
      setLoadError('')
      const { data } = await api.get(`/program-templates/${id}`)
      setTemplate(data)
      setName(data.name ?? '')
      setDescription(data.description ?? '')
      if (data.weeks.length > 0) setExpandedWeek(data.weeks[0].id)
    } catch (error: any) {
      setTemplate(null)
      setLoadError(error?.response?.data?.error ?? 'No se pudo cargar la plantilla')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function addWeek() {
    try {
      await api.post(`/program-templates/${id}/weeks`)
      load()
    } catch {
      Alert.alert('Error', 'No se pudo añadir la semana')
    }
  }

  async function deleteTemplate() {
    confirmAction('Eliminar plantilla', '¿Seguro? Perderás esta plantilla reutilizable.', async () => {
      try {
        await api.delete(`/program-templates/${id}`)
        router.replace('/(trainer)/programs')
      } catch {
        Alert.alert('Error', 'No se pudo eliminar la plantilla')
      }
    })
  }

  async function saveTemplateMeta() {
    setSavingMeta(true)
    try {
      const { data } = await api.patch(`/program-templates/${id}`, {
        name: name.trim(),
        description: description.trim() || undefined,
      })
      setTemplate(data)
      Alert.alert('Plantilla guardada', 'La información de la plantilla se ha actualizado')
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'No se pudo guardar la plantilla'
      Alert.alert('Error', message)
    } finally {
      setSavingMeta(false)
    }
  }

  async function deleteWeek(weekId: number) {
    confirmAction('Eliminar semana', '¿Seguro? Se borrarán todos los días y ejercicios de esta semana.', async () => {
      await api.delete(`/program-templates/${id}/weeks/${weekId}`)
      load()
    })
  }

  async function addDay(weekId: number, dayOfWeek: number) {
    try {
      await api.post(`/program-templates/${id}/weeks/${weekId}/days`, {
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
    confirmAction('Eliminar día', '¿Seguro? Se borrarán sus ejercicios.', async () => {
      await api.delete(`/program-templates/${id}/weeks/${weekId}/days/${dayId}`)
      load()
    })
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>
  }
  if (!template) {
    return <View style={styles.center}><Text style={styles.empty}>{loadError || 'Plantilla no encontrada'}</Text></View>
  }

  return (
    <LiquidGlassBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#113b7a" />
          <Text style={styles.backText}>Biblioteca</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>Template Structure</Text>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{template.name}</Text>
            <Text style={styles.subtitle}>{template.weeks.length} semanas</Text>
          </View>
          <TouchableOpacity style={styles.deleteTemplateButton} onPress={deleteTemplate}>
            <Ionicons name="trash-outline" size={18} color="#fca5a5" />
          </TouchableOpacity>
        </View>

        <View style={[glass.card, styles.metaCard]}>
          <Text style={styles.metaTitle}>Datos de la plantilla</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.metaInput}
            placeholder="Nombre de la plantilla"
            placeholderTextColor="#475569"
          />
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.metaInput, styles.metaDescriptionInput]}
            placeholder="Descripción opcional"
            placeholderTextColor="#475569"
            multiline
          />
          <TouchableOpacity
            style={[styles.saveMetaButton, savingMeta && { opacity: 0.7 }]}
            onPress={saveTemplateMeta}
            disabled={savingMeta}
          >
            <Text style={styles.saveMetaButtonText}>
              {savingMeta ? 'Guardando...' : 'Guardar plantilla'}
            </Text>
          </TouchableOpacity>
        </View>

        {template.weeks.map((week) => (
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
                {week.days.length === 0 && <Text style={styles.empty}>Sin días configurados</Text>}
                {week.days.map((day) => (
                  <View key={day.id} style={styles.dayRow}>
                    <TouchableOpacity
                      style={styles.dayPressable}
                      onPress={() =>
                        router.push({
                          pathname: '/(trainer)/programs/template/[id]/day/[dayId]',
                          params: { id: template.id, dayId: String(day.id) },
                        })
                      }
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
                    <Text style={styles.addDayButtonText}>Añadir día a la plantilla</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}

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
  title: { fontSize: 30, fontWeight: '800', color: '#10213a' },
  subtitle: { fontSize: 14, color: '#5d6f85' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  deleteTemplateButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#3f1d24', alignItems: 'center', justifyContent: 'center' },
  metaCard: { padding: 14, marginBottom: 16 },
  metaTitle: { color: '#10213a', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  metaInput: { backgroundColor: 'rgba(255,255,255,0.42)', color: '#10213a', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.48)', paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10, fontSize: 15 },
  metaDescriptionInput: { minHeight: 82, textAlignVertical: 'top' },
  saveMetaButton: { alignSelf: 'flex-start', backgroundColor: '#113b7a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  saveMetaButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  weekCard: { marginBottom: 14, padding: 14 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  weekTitle: { color: '#10213a', fontSize: 17, fontWeight: '800' },
  weekBody: { marginTop: 14 },
  empty: { color: '#5d6f85', fontSize: 14 },
  dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  dayPressable: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.24)', borderRadius: 16, padding: 12 },
  dayLeft: { flex: 1 },
  dayName: { color: '#10213a', fontSize: 15, fontWeight: '700' },
  dayLabel: { color: '#5d6f85', fontSize: 12, marginTop: 2 },
  dayRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exerciseCount: { color: '#5d6f85', fontSize: 12, fontWeight: '700' },
  dayDelete: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  addDayCard: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, padding: 14, marginTop: 10 },
  addDayTitle: { color: '#10213a', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  daysWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  dayChipDisabled: { opacity: 0.35 },
  dayChipText: { color: '#cbd5e1', fontSize: 12, fontWeight: '700' },
  dayChipTextDisabled: { color: '#94a3b8' },
  dayInput: { backgroundColor: 'rgba(255,255,255,0.42)', color: '#10213a', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.48)', paddingHorizontal: 12, paddingVertical: 12, marginTop: 12 },
  cancelAddDay: { color: '#113b7a', fontSize: 13, fontWeight: '700', marginTop: 12 },
  addDayButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 10 },
  addDayButtonText: { color: '#113b7a', fontSize: 13, fontWeight: '700' },
  addWeekBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  addWeekText: { color: '#113b7a', fontSize: 15, fontWeight: '800' },
})
