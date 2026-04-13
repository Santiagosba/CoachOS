import { useEffect, useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'

interface Session {
  id: string
  date: string
  duration: number
  type: string
  status: string
  createdByRole?: 'TRAINER' | 'CLIENT'
  cancelledByRole?: 'TRAINER' | 'CLIENT' | null
  client: { user: { name: string } }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#ca8a04',
  CONFIRMED: '#16a34a',
  CANCELLED: '#dc2626',
  COMPLETED: '#6366f1',
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export default function CalendarScreen() {
  const today = new Date()
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today))
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async (monthDate: Date) => {
    try {
      setErrorMessage('')
      const from = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 0, 0, 0, 0)
      const to = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999)
      const { data } = await api.get(
        `/sessions?from=${from.toISOString()}&to=${to.toISOString()}`
      )
      setSessions(data)
    } catch (error: any) {
      const message =
        error?.response?.data?.error ??
        error?.message ??
        'No se pudo cargar el calendario'
      setSessions([])
      setErrorMessage(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load(visibleMonth)
  }, [load, visibleMonth])

  useFocusEffect(
    useCallback(() => {
      void load(visibleMonth)
    }, [load, visibleMonth])
  )

  useEffect(() => {
    const monthKey = `${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}`
    const todayKey = `${today.getFullYear()}-${today.getMonth()}`
    if (monthKey === todayKey) {
      setSelectedDateKey(toDateKey(today))
      return
    }

    setSelectedDateKey(toDateKey(visibleMonth))
  }, [visibleMonth])

  // ── Acciones de sesión (cross-platform: web usa confirm/alert) ──
  async function doUpdateStatus(id: string, status: string) {
    try {
      await api.patch(`/sessions/${id}/status`, { status })
      await load(visibleMonth)
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? 'No se pudo actualizar la sesión'
      if (Platform.OS === 'web') { window.alert(msg) } else { Alert.alert('Error', msg) }
    }
  }

  function confirmSession(id: string) {
    doUpdateStatus(id, 'CONFIRMED')
  }

  function completeSession(id: string) {
    doUpdateStatus(id, 'COMPLETED')
  }

  function cancelSession(id: string, clientName: string) {
    const msg = `¿Cancelar la sesión de ${clientName}?\nEl cliente será notificado.`
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doUpdateStatus(id, 'CANCELLED')
      return
    }
    Alert.alert('Cancelar sesión', msg, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => { doUpdateStatus(id, 'CANCELLED') } },
    ])
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>
  }

  const calendarDays = buildCalendarDays(visibleMonth)
  const sessionsByDay = sessions.reduce<Record<string, Session[]>>((acc, session) => {
    const key = toDateKey(new Date(session.date))
    acc[key] = acc[key] ? [...acc[key], session] : [session]
    return acc
  }, {})
  const selectedSessions = (sessionsByDay[selectedDateKey] ?? []).slice().sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
  const pendingCount = sessions.filter((session) => session.status === 'PENDING').length
  const confirmedCount = sessions.filter((session) => session.status === 'CONFIRMED').length
  const awaitingClientCount = sessions.filter(
    (session) => session.status === 'PENDING' && session.createdByRole === 'TRAINER'
  ).length
  const requestedByClientCount = sessions.filter(
    (session) => session.status === 'PENDING' && session.createdByRole === 'CLIENT'
  ).length
  const cancelledByClientCount = sessions.filter(
    (session) => session.status === 'CANCELLED' && session.cancelledByRole === 'CLIENT'
  ).length
  const cancelledSessions = sessions
    .filter((s) => s.status === 'CANCELLED')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const selectedDate = fromDateKey(selectedDateKey)

  return (
    <LiquidGlassBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              load(visibleMonth)
            }}
            tintColor="#113b7a"
          />
        }
      >
        <Text style={styles.eyebrow}>Session Planner</Text>
        <Text style={styles.title}>Calendario</Text>
        <Text style={styles.subtitle}>
          Vista mensual con todas las sesiones de tus clientes y acceso rápido al día seleccionado.
        </Text>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#9f1239" />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <StatCard label="Sesiones del mes" value={String(sessions.length)} />
          <StatCard label="Pendientes" value={String(pendingCount)} />
          <StatCard label="Confirmadas" value={String(confirmedCount)} />
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Pend. cliente" value={String(awaitingClientCount)} />
          <StatCard label="Solicitadas" value={String(requestedByClientCount)} />
          <StatCard
            label="Canceladas cliente"
            value={String(cancelledByClientCount)}
            alert={cancelledByClientCount > 0}
          />
        </View>

        <View style={[glass.card, styles.calendarCard]}>
          <View style={styles.monthHeader}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() =>
                setVisibleMonth(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
                )
              }
            >
              <Ionicons name="chevron-back" size={18} color="#113b7a" />
            </TouchableOpacity>

            <View style={styles.monthHeaderCenter}>
              <Text style={styles.monthTitle}>
                {MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() => setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
              >
                <Text style={styles.todayButtonText}>Hoy</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() =>
                setVisibleMonth(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
                )
              }
            >
              <Ionicons name="chevron-forward" size={18} color="#113b7a" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdaysRow}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.weekdayLabel}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((day) => {
              const key = toDateKey(day)
              const daySessions = sessionsByDay[key] ?? []
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth()
              const isSelected = key === selectedDateKey
              const isToday = key === toDateKey(today)

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    !isCurrentMonth && styles.dayCellMuted,
                  ]}
                  onPress={() => setSelectedDateKey(key)}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      !isCurrentMonth && styles.dayNumberMuted,
                      isSelected && styles.dayNumberSelected,
                    ]}
                  >
                    {day.getDate()}
                  </Text>

                  {isToday && <View style={styles.todayDot} />}

                  {daySessions.length > 0 && (
                    <>
                      <Text style={[styles.dayCount, isSelected && styles.dayCountSelected]}>
                        {daySessions.length} ses.
                      </Text>
                      <View style={styles.sessionDotsRow}>
                        {daySessions.slice(0, 3).map((session) => (
                          <View
                            key={session.id}
                            style={[
                              styles.sessionDot,
                              { backgroundColor: STATUS_COLORS[session.status] ?? '#7a8da5' },
                            ]}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={[glass.card, styles.dayPanel]}>
          <Text style={styles.dayPanelEyebrow}>Día seleccionado</Text>
          <Text style={styles.dayPanelTitle}>
            {selectedDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          {selectedSessions.length === 0 && (
            <Text style={styles.empty}>
              No tienes sesiones programadas para este día.
            </Text>
          )}

          {selectedSessions.map((item) => {
            const date = new Date(item.date)
            return (
              <View key={item.id} style={[glass.softCard, styles.sessionCard]}>
                <View style={styles.sessionCardTop}>
                  <View>
                    <Text style={styles.clientName}>{item.client.user.name}</Text>
                    <Text style={styles.meta}>
                      {date.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · {item.duration} min · {item.type}
                    </Text>
                    <Text style={styles.originMeta}>
                      {item.createdByRole === 'CLIENT'
                        ? 'Solicitada por el cliente'
                        : 'Asignada por el entrenador'}
                    </Text>
                    {item.status === 'CANCELLED' && (
                      <View style={[styles.originBadge, styles.originBadgeCancelled]}>
                        <Ionicons name="close-circle" size={12} color="#b91c1c" />
                        <Text style={[styles.originBadgeText, styles.originBadgeTextCancelled]}>
                          {item.cancelledByRole === 'CLIENT'
                            ? 'Cancelada por el cliente'
                            : item.cancelledByRole === 'TRAINER'
                            ? 'Cancelada por el entrenador'
                            : 'Cancelada'}
                        </Text>
                      </View>
                    )}
                    {item.status === 'PENDING' && (
                      <View
                        style={[
                          styles.originBadge,
                          item.createdByRole === 'CLIENT'
                            ? styles.originBadgeClient
                            : styles.originBadgeTrainer,
                        ]}
                      >
                        <Text
                          style={[
                            styles.originBadgeText,
                            item.createdByRole === 'CLIENT'
                              ? styles.originBadgeTextClient
                              : styles.originBadgeTextTrainer,
                          ]}
                        >
                          {item.createdByRole === 'CLIENT'
                            ? 'Solicitud del cliente'
                            : 'Pendiente del cliente'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.statusBadge,
                      { color: STATUS_COLORS[item.status] ?? '#7a8da5' },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>

                {item.status === 'PENDING' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={() => confirmSession(item.id)}
                    >
                      <Ionicons name="checkmark-circle" size={14} color="#fff" />
                      <Text style={styles.actionText}>Confirmar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => cancelSession(item.id, item.client.user.name)}
                    >
                      <Ionicons name="close-circle" size={14} color="#fff" />
                      <Text style={styles.actionText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === 'CONFIRMED' && (
                  <View style={styles.actions}>
                    {date.getTime() < Date.now() && (
                      <TouchableOpacity
                        style={styles.completeBtn}
                        onPress={() => completeSession(item.id)}
                      >
                        <Ionicons name="checkmark-circle" size={14} color="#fff" />
                        <Text style={styles.actionText}>Completada</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => cancelSession(item.id, item.client.user.name)}
                    >
                      <Ionicons name="close-circle" size={14} color="#fff" />
                      <Text style={styles.actionText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* ── Sesiones canceladas del mes ── */}
        {cancelledSessions.length > 0 && (
          <View style={[glass.card, styles.cancelledPanel]}>
            <View style={styles.cancelledHeader}>
              <Ionicons name="close-circle" size={18} color="#dc2626" />
              <Text style={styles.cancelledTitle}>Canceladas este mes</Text>
              <View style={styles.cancelledBadge}>
                <Text style={styles.cancelledBadgeText}>{cancelledSessions.length}</Text>
              </View>
            </View>

            {cancelledSessions.map((item) => {
              const date = new Date(item.date)
              const byClient = item.cancelledByRole === 'CLIENT'
              return (
                <View key={item.id} style={styles.cancelledRow}>
                  <View style={[
                    styles.cancelledIcon,
                    { backgroundColor: byClient ? '#fee2e2' : '#fef3c7' },
                  ]}>
                    <Ionicons
                      name={byClient ? 'person' : 'barbell'}
                      size={14}
                      color={byClient ? '#b91c1c' : '#92400e'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cancelledClientName}>{item.client.user.name}</Text>
                    <Text style={styles.cancelledMeta}>
                      {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      {' · '}{date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{item.duration} min · {item.type}
                    </Text>
                  </View>
                  <View style={[
                    styles.cancelledWho,
                    { backgroundColor: byClient ? '#fee2e2' : '#fef3c7' },
                  ]}>
                    <Text style={[
                      styles.cancelledWhoText,
                      { color: byClient ? '#b91c1c' : '#92400e' },
                    ]}>
                      {byClient ? 'Cliente' : 'Tú'}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

      </ScrollView>
    </LiquidGlassBackground>
  )
}

function StatCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <View style={[styles.statCard, alert && styles.statCardAlert]}>
      <Text style={[styles.statValue, alert && styles.statValueAlert]}>{value}</Text>
      <Text style={[styles.statLabel, alert && styles.statLabelAlert]}>{label}</Text>
    </View>
  )
}

function buildCalendarDays(visibleMonth: Date) {
  const firstDayOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7
  const firstGridDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1 - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstGridDay)
    day.setDate(firstGridDay.getDate() + index)
    return day
  })
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  eyebrow: { color: '#5d6f85', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '800', color: '#10213a' },
  subtitle: { color: '#5d6f85', fontSize: 14, marginTop: 6, marginBottom: 18 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,228,236,0.95)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
  },
  errorBannerText: { flex: 1, color: '#9f1239', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.34)', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)' },
  statValue: { color: '#113b7a', fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#5d6f85', fontSize: 12, marginTop: 4, fontWeight: '600' },
  calendarCard: { padding: 16, marginBottom: 18 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthHeaderCenter: { alignItems: 'center', gap: 10 },
  monthTitle: { fontSize: 20, fontWeight: '800', color: '#10213a' },
  monthNavButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.42)', alignItems: 'center', justifyContent: 'center' },
  todayButton: { backgroundColor: '#dce8ff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  todayButtonText: { color: '#234675', fontSize: 12, fontWeight: '700' },
  weekdaysRow: { flexDirection: 'row', marginBottom: 8 },
  weekdayLabel: { flex: 1, textAlign: 'center', color: '#5d6f85', fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayCell: {
    width: '13.3%',
    minHeight: 82,
    borderRadius: 18,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.36)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
  },
  dayCellSelected: {
    backgroundColor: '#113b7a',
    borderColor: '#113b7a',
  },
  dayCellMuted: {
    opacity: 0.45,
  },
  dayNumber: { color: '#10213a', fontSize: 14, fontWeight: '800' },
  dayNumberMuted: { color: '#5d6f85' },
  dayNumberSelected: { color: '#fff' },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#38bdf8', marginTop: 4 },
  dayCount: { marginTop: 8, color: '#40556e', fontSize: 11, fontWeight: '700' },
  dayCountSelected: { color: '#dbeafe' },
  sessionDotsRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  sessionDot: { width: 7, height: 7, borderRadius: 999 },
  dayPanel: { padding: 16 },
  dayPanelEyebrow: { color: '#5d6f85', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  dayPanelTitle: { color: '#10213a', fontSize: 19, fontWeight: '800', marginBottom: 14, textTransform: 'capitalize' },
  sessionCard: { padding: 14, marginBottom: 10 },
  sessionCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  clientName: { fontSize: 16, fontWeight: '700', color: '#10213a' },
  meta: { fontSize: 13, color: '#5d6f85', marginTop: 4 },
  originMeta: { fontSize: 12, color: '#234675', marginTop: 4, fontWeight: '700' },
  originBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 },
  originBadgeTrainer: { backgroundColor: '#fff4cc' },
  originBadgeClient: { backgroundColor: '#dbeafe' },
  originBadgeCancelled: { backgroundColor: '#fee2e2' },
  originBadgeText: { fontSize: 11, fontWeight: '800' },
  originBadgeTextTrainer: { color: '#9a6700' },
  originBadgeTextClient: { color: '#1d4ed8' },
  originBadgeTextCancelled: { color: '#b91c1c' },
  statusBadge: { fontSize: 12, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#166534', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#991b1b', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#3730a3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { color: '#5d6f85', fontSize: 14 },
  // StatCard alert variant
  statCardAlert: { backgroundColor: 'rgba(254,226,226,0.7)', borderColor: 'rgba(220,38,38,0.2)' },
  statValueAlert: { color: '#dc2626' },
  statLabelAlert: { color: '#991b1b' },
  // Cancelled panel
  cancelledPanel: { padding: 16, marginBottom: 18 },
  cancelledHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cancelledTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#10213a' },
  cancelledBadge: {
    backgroundColor: '#dc2626', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  cancelledBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  cancelledRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
  },
  cancelledIcon: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelledClientName: { fontSize: 14, fontWeight: '700', color: '#10213a' },
  cancelledMeta: { fontSize: 12, color: '#5d6f85', marginTop: 2 },
  cancelledWho: {
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10,
  },
  cancelledWhoText: { fontSize: 11, fontWeight: '800' },
})
