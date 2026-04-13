import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import LiquidGlassBackground from '@/components/LiquidGlassBackground'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

interface Stats {
  trainers: number
  clients: number
  sessions: number
  workouts: number
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[]
}

const ROLE_COLOR: Record<string, string> = {
  TRAINER: '#0f4c81',
  CLIENT: '#1a7a4a',
  ADMIN: '#7c3aed',
}

const ROLE_LABEL: Record<string, string> = {
  TRAINER: 'Entrenador',
  CLIENT: 'Cliente',
  ADMIN: 'Admin',
}

export default function AdminDashboard() {
  const router = useRouter()
  const { logout, user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get('/admin/stats')
      setStats(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <LiquidGlassBackground>
        <ActivityIndicator style={{ flex: 1 }} color="#0f4c81" />
      </LiquidGlassBackground>
    )
  }

  return (
    <LiquidGlassBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PANEL DE CONTROL</Text>
            <Text style={styles.heading}>Admin</Text>
            <Text style={styles.subheading}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          {[
            { label: 'Entrenadores', value: stats?.trainers ?? 0, icon: 'barbell', color: '#0f4c81' },
            { label: 'Clientes', value: stats?.clients ?? 0, icon: 'people', color: '#1a7a4a' },
            { label: 'Sesiones', value: stats?.sessions ?? 0, icon: 'calendar', color: '#b45309' },
            { label: 'Entrenos', value: stats?.workouts ?? 0, icon: 'fitness', color: '#7c3aed' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(admin)/trainers/')}>
            <Ionicons name="barbell" size={26} color="#0f4c81" />
            <Text style={styles.actionLabel}>Entrenadores</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(admin)/users/')}>
            <Ionicons name="people" size={26} color="#0f4c81" />
            <Text style={styles.actionLabel}>Todos los usuarios</Text>
          </TouchableOpacity>
        </View>

        {/* Recent users */}
        <Text style={styles.sectionTitle}>Últimos registros</Text>
        <View style={styles.card}>
          {(stats?.recentUsers ?? []).map((u, i) => (
            <View key={u.id} style={[styles.userRow, i > 0 && styles.divider]}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{u.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: ROLE_COLOR[u.role] + '18' }]}>
                <Text style={[styles.roleText, { color: ROLE_COLOR[u.role] }]}>
                  {ROLE_LABEL[u.role] ?? u.role}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LiquidGlassBackground>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: '#7c3aed', letterSpacing: 1.4, marginBottom: 4 },
  heading: { fontSize: 30, fontWeight: '900', color: '#10213a' },
  subheading: { fontSize: 14, color: '#5d6f85', marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(231,76,60,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(244,248,255,0.7)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#5d6f85' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5d6f85',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(244,248,255,0.7)',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  actionLabel: { fontSize: 13, fontWeight: '700', color: '#10213a', textAlign: 'center' },
  card: {
    backgroundColor: 'rgba(244,248,255,0.7)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  divider: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0f4c8120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { fontSize: 16, fontWeight: '800', color: '#0f4c81' },
  userName: { fontSize: 14, fontWeight: '700', color: '#10213a' },
  userEmail: { fontSize: 12, color: '#5d6f85', marginTop: 1 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleText: { fontSize: 11, fontWeight: '800' },
})
