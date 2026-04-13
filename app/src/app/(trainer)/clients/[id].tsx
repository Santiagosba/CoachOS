import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '@/lib/api'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'
import PasswordField from '@/components/PasswordField'

interface ClientDetail {
  id: string
  height: number | null
  weight: number | null
  goal: string | null
  notes: string | null
  birthDate?: string | null
  user: { name: string; email: string }
  programs: { id: string; name: string; active: boolean }[]
  sessions: { id: string; date: string; status: string; type: string }[]
}

interface WorkoutLogSet {
  id: number
  setNumber: number
  reps: number
  weight: number
  rpe: number | null
  notes: string | null
  exercise: { id: string; name: string; muscleGroup: string | null }
}

interface WorkoutLog {
  id: string
  date: string
  notes: string | null
  sets: WorkoutLogSet[]
}

interface ProgramTemplateSummary {
  id: string
  name: string
  weeksCount: number
  daysCount: number
  exercisesCount: number
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [goal, setGoal] = useState('')
  const [notes, setNotes] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [deletingClient, setDeletingClient] = useState(false)
  const [sessionDate, setSessionDate] = useState('')
  const [sessionTime, setSessionTime] = useState('')
  const [sessionDuration, setSessionDuration] = useState('60')
  const [sessionType, setSessionType] = useState<'PRESENCIAL' | 'ONLINE'>('PRESENCIAL')
  const [sessionNotes, setSessionNotes] = useState('')
  const [showProgramForm, setShowProgramForm] = useState(false)
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false)
  const [programSaving, setProgramSaving] = useState(false)
  const [activatingProgramId, setActivatingProgramId] = useState<string | null>(null)
  const [assigningTemplateId, setAssigningTemplateId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')
  const [templates, setTemplates] = useState<ProgramTemplateSummary[]>([])
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [workoutsLoading, setWorkoutsLoading] = useState(false)
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)
  const [programName, setProgramName] = useState('')
  const [programWeeks, setProgramWeeks] = useState('4')
  const [programDays, setProgramDays] = useState([
    { dayOfWeek: 0, shortLabel: 'Lun', workLabel: '', enabled: false },
    { dayOfWeek: 1, shortLabel: 'Mar', workLabel: '', enabled: false },
    { dayOfWeek: 2, shortLabel: 'Mié', workLabel: '', enabled: false },
    { dayOfWeek: 3, shortLabel: 'Jue', workLabel: '', enabled: false },
    { dayOfWeek: 4, shortLabel: 'Vie', workLabel: '', enabled: false },
    { dayOfWeek: 5, shortLabel: 'Sáb', workLabel: '', enabled: false },
    { dayOfWeek: 6, shortLabel: 'Dom', workLabel: '', enabled: false },
  ])

  const loadClient = useCallback(async () => {
    if (!id) {
      setClient(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      setLoadError('')
      const { data } = await api.get(`/clients/${id}`)
      setClient(data)
      setName(data.user.name ?? '')
      setWeight(data.weight ? String(data.weight) : '')
      setHeight(data.height ? String(data.height) : '')
      setGoal(data.goal ?? '')
      setNotes(data.notes ?? '')
    } catch (error: any) {
      setClient(null)
      setLoadError(error?.response?.data?.error ?? 'No se pudo cargar el cliente')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadClient()
  }, [id])

  useEffect(() => {
    loadTemplates()
    loadWorkouts()
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadClient()
    }, [loadClient])
  )

  async function loadTemplates() {
    try {
      const { data } = await api.get('/program-templates')
      setTemplates(data)
    } catch {
      setTemplates([])
    }
  }

  async function loadWorkouts() {
    if (!id) return
    setWorkoutsLoading(true)
    try {
      const { data } = await api.get(`/clients/${id}/workouts`)
      setWorkouts(data)
    } catch {
      setWorkouts([])
    } finally {
      setWorkoutsLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data } = await api.patch(`/clients/${id}`, {
        name: name.trim(),
        weight: weight.trim() ? parseFloat(weight) : undefined,
        height: height.trim() ? parseFloat(height) : undefined,
        goal: goal.trim(),
        notes: notes.trim(),
      })
      setClient(data)
      Alert.alert('Cambios guardados', 'La ficha del cliente se ha actualizado')
    } catch {
      Alert.alert('Error', 'No se pudo guardar la ficha del cliente')
    } finally {
      setSaving(false)
    }
  }

  async function createSession() {
    if (!sessionDate.trim() || !sessionTime.trim()) {
      Alert.alert('Faltan datos', 'Introduce fecha y hora para crear la sesión')
      return
    }

    const sessionDateTime = buildSessionDateTime(sessionDate, sessionTime)
    if (!sessionDateTime) {
      Alert.alert('Fecha inválida', 'Usa formato YYYY-MM-DD y hora HH:MM')
      return
    }

    try {
      await api.post('/sessions', {
        clientId: id,
        date: sessionDateTime.toISOString(),
        duration: parseInt(sessionDuration, 10) || 60,
        type: sessionType,
        notes: sessionNotes.trim() || undefined,
      })
      setSessionDate('')
      setSessionTime('')
      setSessionDuration('60')
      setSessionType('PRESENCIAL')
      setSessionNotes('')
      await loadClient()
      Alert.alert('Sesión creada', 'La sesión ya aparece en el calendario')
    } catch {
      Alert.alert('Error', 'No se pudo crear la sesión')
    }
  }

  function toggleProgramDay(index: number) {
    setProgramDays((prev) =>
      prev.map((day, currentIndex) =>
        currentIndex === index ? { ...day, enabled: !day.enabled } : day
      )
    )
  }

  function setProgramDayWorkLabel(index: number, value: string) {
    setProgramDays((prev) =>
      prev.map((day, currentIndex) =>
        currentIndex === index ? { ...day, workLabel: value } : day
      )
    )
  }

  async function createProgram() {
    if (!programName.trim()) {
      Alert.alert('Falta el nombre', 'Ponle un nombre al programa')
      return
    }

    const activeDays = programDays.filter((day) => day.enabled)
    if (activeDays.length === 0) {
      Alert.alert('Sin días', 'Selecciona al menos un día para el programa')
      return
    }

    setProgramSaving(true)
    try {
      const weeksCount = Math.max(1, parseInt(programWeeks, 10) || 4)
      const weeks = Array.from({ length: weeksCount }, (_, index) => ({
        weekNumber: index + 1,
        days: activeDays.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          label: day.workLabel.trim() || undefined,
          exercises: [],
        })),
      }))

      await api.post('/programs', {
        clientId: String(id),
        name: programName.trim(),
        weeks,
      })

      setProgramName('')
      setProgramWeeks('4')
      setProgramDays((prev) => prev.map((day) => ({ ...day, enabled: false, workLabel: '' })))
      setShowProgramForm(false)
      await loadClient()
      Alert.alert('Programa creado', 'Ya está asignado y es el que verá el cliente al entrar')
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'No se pudo crear el programa'
      Alert.alert('Error', message)
    } finally {
      setProgramSaving(false)
    }
  }

  function deleteProgram(programId: string) {
    confirmAction('Eliminar programa', '¿Seguro que quieres borrar este programa?', async () => {
      try {
        await api.delete(`/programs/${programId}`)
        setClient((prev) =>
          prev
            ? {
                ...prev,
                programs: prev.programs.filter((program) => program.id !== programId),
              }
            : prev
        )
        await loadClient()
      } catch (error: any) {
        const message = error?.response?.data?.error ?? 'No se pudo eliminar el programa'
        Alert.alert('Error', message)
      }
    })
  }

  async function updateClientPassword() {
    if (newPassword.trim().length === 0) {
      Alert.alert('Falta la contraseña', 'Introduce una nueva contraseña para el cliente')
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('No coincide', 'La confirmación de contraseña no coincide')
      return
    }

    setPasswordSaving(true)
    try {
      await api.patch(`/clients/${id}/password`, { password: newPassword })
      setNewPassword('')
      setConfirmPassword('')
      Alert.alert('Contraseña actualizada', 'El cliente ya puede entrar con su nueva contraseña')
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'No se pudo actualizar la contraseña'
      Alert.alert('Error', message)
    } finally {
      setPasswordSaving(false)
    }
  }

  function deleteClient() {
    confirmAction(
      'Eliminar cliente',
      'Se borrarán su ficha, programas, sesiones y registros de entrenamiento. Esta acción no se puede deshacer.',
      async () => {
        setDeletingClient(true)
        try {
          await api.delete(`/clients/${id}`)
          Alert.alert('Cliente eliminado', 'El cliente se ha borrado correctamente')
          router.replace('/(trainer)/clients')
        } catch (error: any) {
          const message = error?.response?.data?.error ?? 'No se pudo eliminar el cliente'
          Alert.alert('Error', message)
        } finally {
          setDeletingClient(false)
        }
      }
    )
  }

  async function activateProgram(programId: string) {
    setActivatingProgramId(programId)
    try {
      await api.patch(`/programs/${programId}/activate`)
      await loadClient()
      Alert.alert('Programa asignado', 'Este es el programa que verá el cliente')
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'No se pudo activar el programa'
      Alert.alert('Error', message)
    } finally {
      setActivatingProgramId(null)
    }
  }

  async function assignTemplate(templateId: string) {
    setAssigningTemplateId(templateId)
    try {
      await api.post(`/program-templates/${templateId}/assign`, {
        clientId: String(id),
      })
      await loadClient()
      setShowTemplateLibrary(false)
      Alert.alert('Plantilla asignada', 'Se ha creado una copia del programa para este cliente')
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'No se pudo asignar la plantilla'
      Alert.alert('Error', message)
    } finally {
      setAssigningTemplateId(null)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>
  }
  if (!client) {
    return <View style={styles.center}><Text style={styles.empty}>{loadError || 'Cliente no encontrado'}</Text></View>
  }

  return (
    <LiquidGlassBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color="#6366f1" />
        <Text style={styles.backText}>Clientes</Text>
      </TouchableOpacity>

      <Text style={styles.eyebrow}>Client Profile</Text>
      <Text style={styles.name}>{client.user.name}</Text>
      <Text style={styles.email}>{client.user.email}</Text>

      <TouchableOpacity
        style={[styles.deleteClientButton, deletingClient && { opacity: 0.7 }]}
        onPress={deleteClient}
        disabled={deletingClient}
      >
        <Ionicons name="trash-outline" size={16} color="#fecaca" />
        <Text style={styles.deleteClientButtonText}>
          {deletingClient ? 'Eliminando cliente...' : 'Eliminar cliente'}
        </Text>
      </TouchableOpacity>

      <View style={[glass.card, styles.section]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ficha</Text>
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Nombre</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor="#475569"
        />

        <View style={styles.inputsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Peso (kg)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              style={styles.input}
              placeholder="75"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Altura (cm)</Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              style={styles.input}
              placeholder="180"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Objetivo</Text>
        <TextInput
          value={goal}
          onChangeText={setGoal}
          style={styles.input}
          placeholder="Ej. ganar masa muscular"
          placeholderTextColor="#475569"
        />

        <Text style={styles.inputLabel}>Notas</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, styles.notesInput]}
          placeholder="Lesiones, disponibilidad, observaciones..."
          placeholderTextColor="#475569"
          multiline
        />
      </View>

      {/* Métricas */}
      <View style={styles.metricsRow}>
        <MetricBox label="Peso" value={client.weight ? `${client.weight} kg` : '—'} />
        <MetricBox label="Altura" value={client.height ? `${client.height} cm` : '—'} />
      </View>

      {client.goal && (
        <View style={[glass.card, styles.section]}>
          <Text style={styles.sectionTitle}>Objetivo</Text>
          <Text style={styles.sectionText}>{client.goal}</Text>
        </View>
      )}

      <View style={[glass.card, styles.section]}>
        <Text style={styles.sectionTitle}>Contraseña del cliente</Text>
        <Text style={styles.sectionHint}>
          Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.
        </Text>

        <Text style={styles.inputLabel}>Nueva contraseña</Text>
        <PasswordField
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
          placeholder="Nueva contraseña segura"
          placeholderTextColor="#475569"
        />

        <Text style={styles.inputLabel}>Confirmar contraseña</Text>
        <PasswordField
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          placeholder="Repite la contraseña"
          placeholderTextColor="#475569"
        />

        <TouchableOpacity
          style={[styles.primaryButton, passwordSaving && { opacity: 0.7 }]}
          onPress={updateClientPassword}
          disabled={passwordSaving}
        >
          <Text style={styles.primaryButtonText}>
            {passwordSaving ? 'Guardando...' : 'Actualizar contraseña'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Programas */}
      <View style={[glass.card, styles.section]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Programas</Text>
          <View style={styles.programHeaderActions}>
            <TouchableOpacity onPress={() => setShowTemplateLibrary((prev) => !prev)}>
              <Ionicons name={showTemplateLibrary ? 'library' : 'library-outline'} size={22} color="#113b7a" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowProgramForm((prev) => !prev)}>
              <Ionicons name={showProgramForm ? 'close-circle' : 'add-circle'} size={24} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionHint}>
          El programa activo es el que verá el cliente en su pantalla de hoy.
        </Text>

        {showTemplateLibrary && (
          <View style={[glass.softCard, styles.templateLibraryCard]}>
            <Text style={styles.templateLibraryTitle}>Asignar desde plantilla</Text>
            {templates.length === 0 ? (
              <Text style={styles.empty}>No hay plantillas todavía en la biblioteca.</Text>
            ) : (
              templates.map((template) => (
                <View key={template.id} style={styles.templateRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateMeta}>
                      {template.weeksCount} semanas · {template.daysCount} días · {template.exercisesCount} ejercicios
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.assignTemplateButton,
                      assigningTemplateId === template.id && { opacity: 0.7 },
                    ]}
                    onPress={() => assignTemplate(template.id)}
                    disabled={assigningTemplateId === template.id}
                  >
                    <Text style={styles.assignTemplateButtonText}>
                      {assigningTemplateId === template.id ? 'Asignando...' : 'Usar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {showProgramForm && (
          <View style={[glass.softCard, styles.programForm]}>
            <Text style={styles.inputLabel}>Nombre del programa</Text>
            <TextInput
              value={programName}
              onChangeText={setProgramName}
              style={styles.input}
              placeholder="Ej. Hipertrofia 4 días"
              placeholderTextColor="#475569"
            />

            <Text style={styles.inputLabel}>Duración (semanas)</Text>
            <TextInput
              value={programWeeks}
              onChangeText={setProgramWeeks}
              style={styles.input}
              keyboardType="number-pad"
              placeholder="4"
              placeholderTextColor="#475569"
            />

            <Text style={styles.inputLabel}>Días de entrenamiento</Text>
            <View style={styles.daysRow}>
              {programDays.map((day, index) => (
                <TouchableOpacity
                  key={day.dayOfWeek}
                  style={[styles.dayToggle, day.enabled && styles.dayToggleActive]}
                  onPress={() => toggleProgramDay(index)}
                >
                  <Text style={[styles.dayToggleText, day.enabled && styles.dayToggleTextActive]}>
                    {day.shortLabel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {programDays.filter((day) => day.enabled).length > 0 && (
              <View style={styles.dayLabelsSection}>
                <Text style={styles.inputLabel}>Nombre de trabajo por día</Text>
                {programDays
                  .filter((day) => day.enabled)
                  .map((day) => {
                    const index = programDays.findIndex((item) => item.dayOfWeek === day.dayOfWeek)
                    return (
                      <View key={day.dayOfWeek} style={styles.dayLabelEditor}>
                        <Text style={styles.dayLabelShort}>{day.shortLabel}</Text>
                        <TextInput
                          value={day.workLabel}
                          onChangeText={(value) => setProgramDayWorkLabel(index, value)}
                          style={[styles.input, styles.dayLabelInput]}
                          placeholder="Ej. Push, Pull, Piernas, Full body"
                          placeholderTextColor="#475569"
                        />
                      </View>
                    )
                  })}
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, programSaving && { opacity: 0.7 }]}
              onPress={createProgram}
              disabled={programSaving}
            >
              <Text style={styles.primaryButtonText}>
                {programSaving ? 'Creando...' : 'Crear programa'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {client.programs.length === 0 && <Text style={styles.empty}>Sin programas</Text>}
        {client.programs.map((p) => (
          <View key={p.id} style={styles.programCard}>
            <View style={styles.programCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.programCardTitle}>{p.name}</Text>
                <Text style={styles.programCardSubtitle}>
                  {p.active ? 'Visible ahora mismo para el cliente' : 'Disponible para asignar'}
                </Text>
              </View>
              {p.active && <Text style={styles.programActiveBadge}>Activo</Text>}
            </View>
            <View style={styles.programActions}>
              {!p.active && (
                <TouchableOpacity
                  style={[
                    styles.activateProgramButton,
                    activatingProgramId === p.id && { opacity: 0.7 },
                  ]}
                  onPress={() => activateProgram(p.id)}
                  disabled={activatingProgramId === p.id}
                >
                  <Ionicons name="eye-outline" size={16} color="#dbeafe" />
                  <Text style={styles.activateProgramButtonText}>
                    {activatingProgramId === p.id ? 'Asignando...' : 'Asignar'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.openProgramButton}
                onPress={() =>
                  router.push({
                    pathname: '/(trainer)/programs/[id]',
                    params: { id: p.id },
                  })
                }
              >
                <Ionicons name="open-outline" size={16} color="#c7d2fe" />
                <Text style={styles.openProgramButtonText}>Abrir</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteProgramRowButton} onPress={() => deleteProgram(p.id)}>
                <Ionicons name="trash-outline" size={16} color="#fecaca" />
                <Text style={styles.deleteProgramRowButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={[glass.card, styles.section]}>
        <Text style={styles.sectionTitle}>Crear sesión</Text>
        <View style={styles.inputsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Fecha</Text>
            <TextInput
              value={sessionDate}
              onChangeText={(value) => setSessionDate(formatDateInput(value))}
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Hora</Text>
            <TextInput
              value={sessionTime}
              onChangeText={(value) => setSessionTime(formatTimeInput(value))}
              style={styles.input}
              placeholder="HH:MM"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
            />
          </View>
        </View>
        <Text style={styles.sectionHint}>Escribe la fecha como `2026-04-12` y la hora como `18:30`.</Text>
        <View style={styles.inputsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Duración (min)</Text>
            <TextInput
              value={sessionDuration}
              onChangeText={setSessionDuration}
              style={styles.input}
              keyboardType="number-pad"
              placeholder="60"
              placeholderTextColor="#475569"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Tipo</Text>
            <View style={styles.typeRow}>
              {(['PRESENCIAL', 'ONLINE'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, sessionType === type && styles.typeChipActive]}
                  onPress={() => setSessionType(type)}
                >
                  <Text style={[styles.typeChipText, sessionType === type && styles.typeChipTextActive]}>
                    {type === 'PRESENCIAL' ? 'Presencial' : 'Online'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <Text style={styles.inputLabel}>Notas</Text>
        <TextInput
          value={sessionNotes}
          onChangeText={setSessionNotes}
          style={[styles.input, styles.notesInput]}
          placeholder="Opcional"
          placeholderTextColor="#475569"
          multiline
        />
        <TouchableOpacity style={styles.primaryButton} onPress={createSession}>
          <Text style={styles.primaryButtonText}>Crear sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Últimas sesiones */}
      <View style={[glass.card, styles.section]}>
        <Text style={styles.sectionTitle}>Últimas sesiones</Text>
        {client.sessions.length === 0 && <Text style={styles.empty}>Sin sesiones</Text>}
        {client.sessions.slice(0, 5).map((s) => (
          <View key={s.id} style={styles.listItem}>
            <Text style={styles.listItemText}>
              {new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
            <Text style={[styles.badge, s.status === 'COMPLETED' && styles.badgeGreen]}>
              {s.status}
            </Text>
          </View>
        ))}
      </View>

      {/* ── Historial de entrenamientos ── */}
      <View style={[glass.card, styles.section]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de entrenamientos</Text>
          <View style={styles.workoutCountBadge}>
            <Text style={styles.workoutCountText}>{workouts.length}</Text>
          </View>
        </View>
        <Text style={styles.sectionHint}>
          Registros del cliente con detalle de ejercicios, series, peso y RPE.
        </Text>

        {workoutsLoading && <ActivityIndicator color="#6366f1" style={{ marginVertical: 20 }} />}

        {!workoutsLoading && workouts.length === 0 && (
          <View style={styles.emptyWorkouts}>
            <Ionicons name="barbell-outline" size={32} color="#aac0d8" />
            <Text style={styles.empty}>El cliente aún no ha registrado entrenamientos</Text>
          </View>
        )}

        {!workoutsLoading && workouts.map((log) => {
          const d = new Date(log.date)
          const isExpanded = expandedWorkout === log.id
          // Agrupar sets por ejercicio
          const grouped: Record<string, { exercise: WorkoutLogSet['exercise']; sets: WorkoutLogSet[] }> = {}
          for (const s of log.sets) {
            if (!grouped[s.exercise.id]) grouped[s.exercise.id] = { exercise: s.exercise, sets: [] }
            grouped[s.exercise.id].sets.push(s)
          }
          const exerciseGroups = Object.values(grouped)
          const totalVolume = log.sets.reduce((sum, s) => sum + s.reps * s.weight, 0)
          const maxWeight = log.sets.length > 0 ? Math.max(...log.sets.map(s => s.weight)) : 0

          return (
            <TouchableOpacity
              key={log.id}
              style={styles.workoutCard}
              onPress={() => setExpandedWorkout(isExpanded ? null : log.id)}
              activeOpacity={0.7}
            >
              {/* Header */}
              <View style={styles.workoutHeader}>
                <View style={styles.workoutDateBadge}>
                  <Text style={styles.workoutDateDay}>{d.getDate()}</Text>
                  <Text style={styles.workoutDateMonth}>
                    {d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutTitle}>
                    {d.toLocaleDateString('es-ES', { weekday: 'long' })}
                  </Text>
                  <Text style={styles.workoutMeta}>
                    {exerciseGroups.length} ejercicio{exerciseGroups.length !== 1 ? 's' : ''} · {log.sets.length} series · {Math.round(totalVolume)} kg vol.
                  </Text>
                </View>
                <View style={styles.workoutStats}>
                  <Text style={styles.workoutStatValue}>{maxWeight}</Text>
                  <Text style={styles.workoutStatLabel}>kg máx</Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#5d6f85"
                />
              </View>

              {log.notes && (
                <Text style={styles.workoutNotes}>📝 {log.notes}</Text>
              )}

              {/* Detalle expandido */}
              {isExpanded && (
                <View style={styles.workoutDetail}>
                  {exerciseGroups.map((group) => (
                    <View key={group.exercise.id} style={styles.exerciseGroup}>
                      <View style={styles.exerciseGroupHeader}>
                        <Text style={styles.exerciseName}>{group.exercise.name}</Text>
                        {group.exercise.muscleGroup && (
                          <Text style={styles.exerciseMuscle}>{group.exercise.muscleGroup}</Text>
                        )}
                      </View>
                      <View style={styles.setsTable}>
                        <View style={styles.setsTableHeader}>
                          <Text style={[styles.setsTableCell, styles.setsTableHeaderText, { width: 40 }]}>Serie</Text>
                          <Text style={[styles.setsTableCell, styles.setsTableHeaderText, { flex: 1 }]}>Reps</Text>
                          <Text style={[styles.setsTableCell, styles.setsTableHeaderText, { flex: 1 }]}>Peso</Text>
                          <Text style={[styles.setsTableCell, styles.setsTableHeaderText, { flex: 1 }]}>RPE</Text>
                        </View>
                        {group.sets.map((s) => (
                          <View key={s.id} style={styles.setsTableRow}>
                            <Text style={[styles.setsTableCell, { width: 40, color: '#5d6f85' }]}>{s.setNumber}</Text>
                            <Text style={[styles.setsTableCell, { flex: 1, fontWeight: '700' }]}>{s.reps}</Text>
                            <Text style={[styles.setsTableCell, { flex: 1, fontWeight: '700', color: '#113b7a' }]}>{s.weight} kg</Text>
                            <Text style={[styles.setsTableCell, { flex: 1, color: s.rpe && s.rpe >= 9 ? '#dc2626' : '#5d6f85' }]}>
                              {s.rpe ? s.rpe : '—'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
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

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  )
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
}

function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function buildSessionDateTime(dateValue: string, timeValue: string) {
  const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const timeMatch = timeValue.match(/^(\d{2}):(\d{2})$/)
  if (!dateMatch || !timeMatch) return null

  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const hours = Number(timeMatch[1])
  const minutes = Number(timeMatch[2])

  const result = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (
    Number.isNaN(result.getTime()) ||
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day ||
    result.getHours() !== hours ||
    result.getMinutes() !== minutes
  ) {
    return null
  }

  return result
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { color: '#113b7a', fontSize: 16, fontWeight: '700' },
  eyebrow: { color: '#5d6f85', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  name: { fontSize: 30, fontWeight: '800', color: '#10213a' },
  email: { fontSize: 14, color: '#5d6f85', marginBottom: 20 },
  deleteClientButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(127,29,29,0.78)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  deleteClientButtonText: { color: '#fecaca', fontSize: 13, fontWeight: '800' },
  saveButton: { backgroundColor: '#113b7a', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  saveButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  inputLabel: { color: '#55687e', fontSize: 13, marginBottom: 6, marginTop: 10, fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    color: '#10213a',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputsRow: { flexDirection: 'row', gap: 10 },
  notesInput: { minHeight: 92, textAlignVertical: 'top' },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metricBox: { flex: 1, backgroundColor: 'rgba(244,248,255,0.34)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', padding: 16, alignItems: 'center' },
  metricValue: { fontSize: 22, fontWeight: '800', color: '#113b7a' },
  metricLabel: { fontSize: 13, color: '#55687e', marginTop: 4 },
  section: { marginBottom: 24, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  programHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#10213a', marginBottom: 10 },
  sectionHint: { color: '#5d6f85', fontSize: 13, marginBottom: 12 },
  sectionText: { color: '#55687e', fontSize: 15 },
  templateLibraryCard: { padding: 14, marginBottom: 12 },
  templateLibraryTitle: { color: '#10213a', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  templateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(149, 175, 204, 0.2)' },
  templateName: { color: '#0f2942', fontSize: 15, fontWeight: '800' },
  templateMeta: { color: '#4f6478', fontSize: 12, marginTop: 4, lineHeight: 18 },
  assignTemplateButton: { backgroundColor: '#113b7a', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  assignTemplateButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  programForm: {
    backgroundColor: 'rgba(246, 250, 255, 0.74)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: 14,
    marginBottom: 12,
  },
  dayLabelsSection: { marginBottom: 2 },
  dayLabelEditor: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dayLabelShort: { width: 34, color: '#113b7a', fontSize: 13, fontWeight: '800' },
  dayLabelInput: { flex: 1, marginBottom: 0 },
  programCard: {
    backgroundColor: 'rgba(248, 251, 255, 0.82)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.56)',
    padding: 14,
    marginBottom: 10,
  },
  programCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10 },
  programCardTitle: { color: '#0f2942', fontSize: 16, fontWeight: '800' },
  programCardSubtitle: { color: '#4f6478', fontSize: 12, marginTop: 4, lineHeight: 18 },
  programActiveBadge: {
    backgroundColor: '#d9f7e8',
    color: '#166534',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '800',
  },
  programActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.26)', borderRadius: 16, padding: 12, marginBottom: 8 },
  listItemText: { color: '#10213a', fontSize: 15, fontWeight: '600' },
  badge: { backgroundColor: 'rgba(255,255,255,0.44)', color: '#4f647b', fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  badgeGreen: { backgroundColor: '#14532d', color: '#4ade80' },
  empty: { color: '#5d6f85', fontSize: 14 },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: { backgroundColor: 'rgba(255,255,255,0.28)', borderColor: 'rgba(255,255,255,0.42)', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 10 },
  typeChipActive: { backgroundColor: '#dce8ff', borderColor: '#97b8eb' },
  typeChipText: { color: '#55687e', fontSize: 12, fontWeight: '700' },
  typeChipTextActive: { color: '#234675' },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  dayToggle: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  dayToggleActive: { backgroundColor: '#312e81', borderColor: '#4338ca' },
  dayToggleText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  dayToggleTextActive: { color: '#c7d2fe' },
  activateProgramButton: {
    flex: 1,
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
  },
  activateProgramButtonText: { color: '#dbeafe', fontSize: 13, fontWeight: '700' },
  openProgramButton: {
    flex: 1,
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#315f97',
    borderRadius: 10,
    paddingVertical: 10,
  },
  openProgramButtonText: { color: '#eef6ff', fontSize: 13, fontWeight: '800' },
  deleteProgramRowButton: {
    flex: 1,
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7f1d1d',
    borderRadius: 10,
    paddingVertical: 10,
  },
  deleteProgramRowButtonText: { color: '#fee2e2', fontSize: 13, fontWeight: '800' },
  primaryButton: { backgroundColor: '#113b7a', borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Historial de entrenamientos
  workoutCountBadge: { backgroundColor: '#113b7a', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 },
  workoutCountText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  emptyWorkouts: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  workoutCard: {
    backgroundColor: 'rgba(248,251,255,0.82)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.56)',
    padding: 14,
    marginBottom: 10,
  },
  workoutHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  workoutDateBadge: { alignItems: 'center', width: 44 },
  workoutDateDay: { fontSize: 22, fontWeight: '900', color: '#113b7a' },
  workoutDateMonth: { fontSize: 10, color: '#5d6f85', fontWeight: '700' },
  workoutTitle: { fontSize: 15, fontWeight: '700', color: '#10213a', textTransform: 'capitalize' },
  workoutMeta: { fontSize: 12, color: '#5d6f85', marginTop: 2 },
  workoutStats: { alignItems: 'center', marginRight: 4 },
  workoutStatValue: { fontSize: 18, fontWeight: '800', color: '#113b7a' },
  workoutStatLabel: { fontSize: 10, color: '#5d6f85', fontWeight: '700' },
  workoutNotes: { fontSize: 12, color: '#5d6f85', marginTop: 8, fontStyle: 'italic' },
  workoutDetail: { marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: 12 },
  exerciseGroup: { marginBottom: 14 },
  exerciseGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  exerciseName: { fontSize: 14, fontWeight: '800', color: '#10213a' },
  exerciseMuscle: { fontSize: 11, color: '#6366f1', fontWeight: '700', backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  setsTable: { borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.5)' },
  setsTableHeader: { flexDirection: 'row', backgroundColor: 'rgba(17,59,122,0.08)', paddingVertical: 6, paddingHorizontal: 8 },
  setsTableHeaderText: { fontSize: 11, fontWeight: '700', color: '#5d6f85', textTransform: 'uppercase' },
  setsTableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  setsTableCell: { fontSize: 13, color: '#10213a' },
})
