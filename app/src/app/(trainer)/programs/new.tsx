import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DAY_LABELS = ['Push', 'Pull', 'Piernas', 'Full Body', 'Upper', 'Lower', 'Cardio', 'Descanso']

interface DayConfig {
  dayOfWeek: number
  label: string
  enabled: boolean
}

export default function NewProgramScreen() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [numWeeks, setNumWeeks] = useState(4)
  const [days, setDays] = useState<DayConfig[]>(
    DAYS.map((_, i) => ({ dayOfWeek: i, label: '', enabled: false }))
  )
  const [saving, setSaving] = useState(false)

  function toggleDay(i: number) {
    setDays((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, enabled: !d.enabled } : d))
    )
  }

  function setDayLabel(i: number, label: string) {
    setDays((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, label } : d))
    )
  }

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Ponle un nombre a la plantilla')
      return
    }
    setSaving(true)
    try {
      const activeDays = days.filter((d) => d.enabled)
      const weeks = Array.from({ length: numWeeks }, (_, wi) => ({
        weekNumber: wi + 1,
        days: activeDays.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          label: d.label.trim() || undefined,
          exercises: [],
        })),
      }))

      const { data } = await api.post('/program-templates', {
        name: name.trim(),
        description: description.trim() || undefined,
        weeks,
      })

      const firstWeek = data.weeks?.[0]
      const firstDay = firstWeek?.days?.[0]

      if (firstDay?.id) {
        router.replace({
          pathname: '/(trainer)/programs/template/[id]/day/[dayId]',
          params: { id: data.id, dayId: String(firstDay.id) },
        })
        return
      }

      router.replace({
        pathname: '/(trainer)/programs/template/[id]',
        params: { id: data.id },
      })
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'No se pudo crear la plantilla'
      Alert.alert('Error', message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <LiquidGlassBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color="#6366f1" />
        <Text style={styles.backText}>Cancelar</Text>
      </TouchableOpacity>

      <Text style={styles.eyebrow}>Template Builder</Text>
      <Text style={styles.title}>Nueva plantilla</Text>

      {/* Nombre */}
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Fuerza 4 días / Hipertrofia Push-Pull"
        placeholderTextColor="#475569"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Opcional: objetivo, nivel, disciplina, notas base..."
        placeholderTextColor="#475569"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Semanas */}
      <Text style={styles.label}>Duración (semanas)</Text>
      <View style={[glass.softCard, styles.stepper]}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => setNumWeeks((n) => Math.max(1, n - 1))}
        >
          <Ionicons name="remove" size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.stepValue}>{numWeeks}</Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => setNumWeeks((n) => Math.min(24, n + 1))}
        >
          <Ionicons name="add" size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {/* Días de entrenamiento */}
      <Text style={styles.label}>Días de entrenamiento</Text>
      <Text style={styles.helperText}>
        Puedes dejar la plantilla vacía y estructurarla después, o crear solo una base rápida ahora.
      </Text>
      <View style={styles.daysGrid}>
        {days.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.dayChip, d.enabled && styles.dayChipActive]}
            onPress={() => toggleDay(i)}
          >
            <Text style={[styles.dayChipText, d.enabled && styles.dayChipTextActive]}>
              {DAYS[i]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Etiqueta por día */}
      {days.some((d) => d.enabled) && (
        <>
          <Text style={styles.label}>Nombre de trabajo por día</Text>
          {days
            .filter((d) => d.enabled)
            .map((d) => (
              <View key={d.dayOfWeek} style={styles.dayLabelRow}>
                <Text style={styles.dayLabelName}>{DAYS[d.dayOfWeek]}</Text>
                <View style={styles.dayLabelEditor}>
                  <TextInput
                    style={[styles.input, styles.dayLabelInput]}
                    placeholder="Ej. Push, SBD, Torso, Pierna, Skill..."
                    placeholderTextColor="#475569"
                    value={d.label}
                    onChangeText={(value) => setDayLabel(d.dayOfWeek, value)}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.labelsScroll}>
                    {DAY_LABELS.map((lbl) => (
                      <TouchableOpacity
                        key={lbl}
                        style={[styles.labelChip, d.label === lbl && styles.labelChipActive]}
                        onPress={() => setDayLabel(d.dayOfWeek, d.label === lbl ? '' : lbl)}
                      >
                        <Text style={[styles.labelChipText, d.label === lbl && styles.labelChipTextActive]}>
                          {lbl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ))}

          <View style={[glass.card, styles.infoCard]}>
            <Text style={styles.infoTitle}>Siguiente paso</Text>
            <Text style={styles.infoText}>
              Al crear la plantilla te llevaré al editor para añadir ejercicios de máquina, barra, mancuerna, powerlifting, calistenia o ejercicios personalizados.
            </Text>
          </View>
        </>
      )}

      {!days.some((d) => d.enabled) && (
        <View style={[glass.card, styles.infoCard]}>
          <Text style={styles.infoTitle}>Plantilla abierta</Text>
          <Text style={styles.infoText}>
            Si la creas sin días, tendrás una plantilla en blanco para estructurar semanas y añadir días después con total libertad.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.createBtn, saving && styles.createBtnDisabled]}
        onPress={handleCreate}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createBtnText}>Crear plantilla</Text>
        )}
      </TouchableOpacity>
      </ScrollView>
    </LiquidGlassBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { color: '#113b7a', fontSize: 16, fontWeight: '700' },
  eyebrow: { color: '#5d6f85', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', color: '#10213a', marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '700', color: '#55687e', marginBottom: 10, marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    color: '#10213a',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  descriptionInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  helperText: { color: '#5d6f85', fontSize: 13, marginTop: -2, marginBottom: 10 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  stepBtn: { padding: 14 },
  stepValue: { fontSize: 22, fontWeight: '800', color: '#10213a', paddingHorizontal: 24 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
  },
  dayChipActive: { backgroundColor: '#dce8ff', borderColor: '#97b8eb' },
  dayChipText: { color: '#55687e', fontSize: 14, fontWeight: '700' },
  dayChipTextActive: { color: '#234675' },
  dayLabelRow: { marginBottom: 12 },
  dayLabelName: { color: '#10213a', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  dayLabelEditor: { gap: 8 },
  dayLabelInput: { marginBottom: 0 },
  labelsScroll: { flexGrow: 0 },
  labelChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.28)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
  },
  labelChipActive: { backgroundColor: '#dce8ff', borderColor: '#97b8eb' },
  labelChipText: { color: '#55687e', fontSize: 13, fontWeight: '600' },
  labelChipTextActive: { color: '#234675' },
  infoCard: {
    marginTop: 18,
    padding: 14,
  },
  infoTitle: { color: '#234675', fontSize: 14, fontWeight: '800', marginBottom: 6 },
  infoText: { color: '#55687e', fontSize: 13, lineHeight: 19 },
  createBtn: {
    backgroundColor: '#113b7a',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
