import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/lib/auth-store'
import { api } from '@/lib/api'
import { glass } from '@/components/LiquidGlassBackground'
import AnimatedEntrance from '@/components/AnimatedEntrance'
import ScreenScaffold, { shell } from '@/components/ScreenScaffold'

interface UpcomingSession {
  id: string
  date: string
  status: string
  client: { user: { name: string } }
}

export default function TrainerDashboard() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState({ clients: 0, sessionsToday: 0, pendingSessions: 0 })
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setErrorMessage('')
        const today = new Date()
        const from = new Date(today.setHours(0, 0, 0, 0)).toISOString()
        const to = new Date(today.setHours(23, 59, 59, 999)).toISOString()
        const nextMonth = new Date()
        nextMonth.setDate(nextMonth.getDate() + 14)
        const [clientsRes, sessionsRes] = await Promise.all([
          api.get('/clients'),
          api.get(`/sessions?from=${from}&to=${nextMonth.toISOString()}`),
        ])
        const sessions = sessionsRes.data as UpcomingSession[]
        setStats({
          clients: clientsRes.data.length,
          sessionsToday: sessions.filter((session) => {
            const date = new Date(session.date)
            return date >= new Date(from) && date <= new Date(to)
          }).length,
          pendingSessions: sessions.filter((session) => session.status === 'PENDING').length,
        })
        setUpcomingSessions(sessions.slice(0, 4))
      } catch (error: any) {
        setErrorMessage(error?.response?.data?.error ?? 'No se pudo cargar el panel')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>
  }

  return (
    <ScreenScaffold
      eyebrow="Trainer Command"
      title={`Hola, ${user?.name?.split(' ')[0] ?? ''}`}
      subtitle="Tus próximas acciones, clientes y sesiones importantes en un solo vistazo."
      headerAction={
        <TouchableOpacity onPress={logout} style={[glass.pill, styles.logoutButton]}>
          <Text style={styles.logout}>Salir</Text>
        </TouchableOpacity>
      }
    >
      <AnimatedEntrance delay={80}>
        <View style={styles.statsRow}>
          <StatCard label="Clientes" value={stats.clients} />
          <StatCard label="Sesiones hoy" value={stats.sessionsToday} />
        </View>
      </AnimatedEntrance>
      <AnimatedEntrance delay={140}>
        <View style={styles.statsRow}>
          <StatCard label="Solicitudes" value={stats.pendingSessions} />
          <TouchableOpacity style={[glass.card, styles.quickCard]} onPress={() => router.push('/(trainer)/clients/')}>
            <Text style={styles.quickCardTitle}>Nuevo cliente</Text>
            <Text style={styles.quickCardSub}>Alta rápida y seguimiento</Text>
          </TouchableOpacity>
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={200}>
        <TouchableOpacity style={[glass.card, styles.card]} onPress={() => router.push('/(trainer)/clients/')}>
          <Text style={styles.cardTitle}>Gestionar clientes</Text>
          <Text style={styles.cardSub}>Perfiles, métricas y programas</Text>
        </TouchableOpacity>
      </AnimatedEntrance>

      <AnimatedEntrance delay={240}>
        <TouchableOpacity style={[glass.card, styles.card]} onPress={() => router.push('/(trainer)/calendar/')}>
          <Text style={styles.cardTitle}>Calendario</Text>
          <Text style={styles.cardSub}>Sesiones programadas</Text>
        </TouchableOpacity>
      </AnimatedEntrance>

      <AnimatedEntrance delay={300}>
        <View style={styles.section}>
          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          <Text style={styles.sectionTitle}>Próximas sesiones</Text>
          {upcomingSessions.length === 0 && (
            <Text style={styles.empty}>No hay sesiones próximas todavía</Text>
          )}
          {upcomingSessions.map((session) => {
            const date = new Date(session.date)
            return (
              <TouchableOpacity
                key={session.id}
                style={[glass.softCard, styles.sessionRow]}
                onPress={() => router.push('/(trainer)/calendar/')}
              >
                <View>
                  <Text style={styles.sessionClient}>{session.client.user.name}</Text>
                  <Text style={styles.sessionMeta}>
                    {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} · {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[styles.statusBadge, session.status === 'PENDING' && styles.statusPending]}>
                  {session.status}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </AnimatedEntrance>
    </ScreenScaffold>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={[shell.card, styles.stat]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  logoutButton: { paddingHorizontal: 14, paddingVertical: 10 },
  logout: { color: '#113b7a', fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: { fontSize: 34, fontWeight: '800', color: '#113b7a' },
  statLabel: { fontSize: 13, color: '#5d6f85', marginTop: 4 },
  quickCard: { flex: 1, padding: 16, justifyContent: 'center' },
  quickCardTitle: { color: '#10213a', fontSize: 16, fontWeight: '800' },
  quickCardSub: { color: '#5d6f85', fontSize: 13, marginTop: 4 },
  card: { padding: 20, marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#10213a', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#5d6f85' },
  section: { marginTop: 12, marginBottom: 24 },
  errorText: { color: '#9f1239', fontSize: 13, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#10213a', marginBottom: 12 },
  sessionRow: {
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionClient: { color: '#10213a', fontSize: 15, fontWeight: '700' },
  sessionMeta: { color: '#5d6f85', fontSize: 13, marginTop: 3 },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    color: '#4f647b',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusPending: { backgroundColor: '#ffe7a8', color: '#9b6b00' },
  empty: { color: '#5d6f85', fontSize: 14 },
})
