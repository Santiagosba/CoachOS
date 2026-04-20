import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
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
          sessionsToday: sessions.filter((s) => {
            const d = new Date(s.date)
            return d >= new Date(from) && d <= new Date(to)
          }).length,
          pendingSessions: sessions.filter((s) => s.status === 'PENDING').length,
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
    return <View style={styles.center}><ActivityIndicator color="#5b9cf6" size="large" /></View>
  }

  return (
    <ScreenScaffold
      eyebrow="Trainer Command"
      title={`Hola, ${user?.name?.split(' ')[0] ?? ''}`}
      subtitle="Tus próximas acciones, clientes y sesiones en un solo vistazo."
      headerAction={
        <TouchableOpacity onPress={logout} style={[glass.pill as any, styles.logoutButton]}>
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
          <StatCard label="Solicitudes" value={stats.pendingSessions} accent />
          <TouchableOpacity style={[glass.card as any, styles.quickCard]} onPress={() => router.push('/(trainer)/clients/')}>
            <Text style={styles.quickCardTitle}>Nuevo cliente</Text>
            <Text style={styles.quickCardSub}>Alta rápida y seguimiento</Text>
          </TouchableOpacity>
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={200}>
        <TouchableOpacity style={[glass.card as any, styles.card]} onPress={() => router.push('/(trainer)/clients/')}>
          <Text style={styles.cardTitle}>Gestionar clientes</Text>
          <Text style={styles.cardSub}>Perfiles, métricas y programas</Text>
        </TouchableOpacity>
      </AnimatedEntrance>

      <AnimatedEntrance delay={240}>
        <TouchableOpacity style={[glass.card as any, styles.card]} onPress={() => router.push('/(trainer)/calendar/')}>
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
                style={[glass.softCard as any, styles.sessionRow]}
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

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <View style={[shell.card as any, styles.stat]}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  logoutButton: { paddingHorizontal: 14, paddingVertical: 10 },
  logout: { color: '#5b9cf6', fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statValue: { fontSize: 36, fontWeight: '900', color: 'rgba(240, 244, 255, 0.95)', letterSpacing: -1 },
  statValueAccent: { color: '#5b9cf6' },
  statLabel: { fontSize: 12, color: 'rgba(160, 185, 230, 0.55)', marginTop: 4, fontWeight: '600', letterSpacing: 0.3 },
  quickCard: { flex: 1, padding: 16, justifyContent: 'center' },
  quickCardTitle: { color: 'rgba(240, 244, 255, 0.92)', fontSize: 15, fontWeight: '800' },
  quickCardSub: { color: 'rgba(160, 185, 230, 0.55)', fontSize: 13, marginTop: 4 },
  card: { padding: 20, marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: 'rgba(240, 244, 255, 0.92)', marginBottom: 4 },
  cardSub: { fontSize: 14, color: 'rgba(160, 185, 230, 0.55)' },
  section: { marginTop: 12, marginBottom: 24 },
  errorText: { color: '#f87171', fontSize: 13, marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: 'rgba(160, 185, 230, 0.55)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  sessionRow: {
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionClient: { color: 'rgba(240, 244, 255, 0.90)', fontSize: 15, fontWeight: '700' },
  sessionMeta: { color: 'rgba(160, 185, 230, 0.55)', fontSize: 13, marginTop: 3 },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: 'rgba(160, 185, 230, 0.65)',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  statusPending: { backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.25)' },
  empty: { color: 'rgba(160, 185, 230, 0.45)', fontSize: 14 },
})
