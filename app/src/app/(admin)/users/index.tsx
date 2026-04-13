import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import LiquidGlassBackground from '@/components/LiquidGlassBackground'
import { api } from '@/lib/api'

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  clients?: { id: string }[]
  clientProfile?: { trainer?: { name: string } } | null
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

const FILTERS = ['Todos', 'TRAINER', 'CLIENT', 'ADMIN'] as const
type Filter = typeof FILTERS[number]

export default function AdminUsers() {
  const router = useRouter()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<Filter>('Todos')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TRAINER' as string })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    try {
      const params: any = {}
      if (filter !== 'Todos') params.role = filter
      if (search.trim()) params.q = search.trim()
      const { data } = await api.get('/admin/users', { params })
      setUsers(data)
    } catch {
      //
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { load() }, [filter, search]))

  const createUser = async () => {
    setFormError('')
    if (!form.name || !form.email || !form.password) {
      setFormError('Todos los campos son obligatorios')
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/users', form)
      setForm({ name: '', email: '', password: '', role: 'TRAINER' })
      setShowCreate(false)
      load()
    } catch (e: any) {
      setFormError(e.response?.data?.error ?? 'Error al crear usuario')
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = (u: UserItem) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Eliminar a ${u.name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${u.id}`)
              load()
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.error ?? 'No se pudo eliminar')
            }
          },
        },
      ]
    )
  }

  return (
    <LiquidGlassBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ADMINISTRACIÓN</Text>
            <Text style={styles.heading}>Usuarios</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color="#7a9ab8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o email..."
            placeholderTextColor="#a0b0c0"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#a0b0c0" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Role filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color="#0f4c81" />
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
          >
            {users.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color="#aac0d8" />
                <Text style={styles.emptyText}>Sin resultados</Text>
              </View>
            ) : (
              users.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={styles.card}
                  onPress={() => router.push(`/(admin)/users/${u.id}`)}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardLeft}>
                    <View style={[styles.avatar, { backgroundColor: (ROLE_COLOR[u.role] ?? '#888') + '18' }]}>
                      <Text style={[styles.avatarText, { color: ROLE_COLOR[u.role] ?? '#888' }]}>
                        {u.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName}>{u.name}</Text>
                      <Text style={styles.cardEmail}>{u.email}</Text>
                      {u.clientProfile?.trainer && (
                        <Text style={styles.cardMeta}>👤 {u.clientProfile.trainer.name}</Text>
                      )}
                      {u.clients && u.clients.length > 0 && (
                        <Text style={styles.cardMeta}>{u.clients.length} cliente{u.clients.length !== 1 ? 's' : ''}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <View style={[styles.roleBadge, { backgroundColor: (ROLE_COLOR[u.role] ?? '#888') + '18' }]}>
                      <Text style={[styles.roleText, { color: ROLE_COLOR[u.role] ?? '#888' }]}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </Text>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        onPress={() => deleteUser(u)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={17} color="#e74c3c" />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={15} color="#aac0d8" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>

      {/* Create modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nuevo usuario</Text>
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            {[
              { key: 'name', label: 'Nombre completo', icon: 'person-outline' },
              { key: 'email', label: 'Email', icon: 'mail-outline' },
              { key: 'password', label: 'Contraseña', icon: 'lock-closed-outline', secure: true },
            ].map((f) => (
              <View key={f.key} style={styles.inputRow}>
                <Ionicons name={f.icon as any} size={18} color="#5d6f85" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  value={(form as any)[f.key]}
                  onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                  autoCapitalize="none"
                  secureTextEntry={(f as any).secure ?? false}
                  placeholder={f.label}
                  placeholderTextColor="#a0b0c0"
                />
              </View>
            ))}

            {/* Role selector */}
            <Text style={styles.roleLabel}>Rol</Text>
            <View style={styles.roleRow}>
              {(['TRAINER', 'CLIENT', 'ADMIN'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, form.role === r && { backgroundColor: ROLE_COLOR[r], borderColor: ROLE_COLOR[r] }]}
                  onPress={() => setForm((p) => ({ ...p, role: r }))}
                >
                  <Text style={[styles.roleChipText, form.role === r && { color: '#fff' }]}>
                    {ROLE_LABEL[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowCreate(false); setFormError('') }}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={createUser} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Crear</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LiquidGlassBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 60, marginBottom: 16,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: '#7c3aed', letterSpacing: 1.4, marginBottom: 4 },
  heading: { fontSize: 30, fontWeight: '900', color: '#10213a' },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#0f4c81', alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 20, paddingHorizontal: 14, marginBottom: 12, height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#10213a' },
  filterScroll: { marginBottom: 12, maxHeight: 44 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(200,216,232,0.6)',
  },
  chipActive: { backgroundColor: '#0f4c81', borderColor: '#0f4c81' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#5d6f85' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#7a9ab8', fontWeight: '600' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(244,248,255,0.8)', borderRadius: 18,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  cardName: { fontSize: 14, fontWeight: '700', color: '#10213a' },
  cardEmail: { fontSize: 12, color: '#5d6f85', marginTop: 2 },
  cardMeta: { fontSize: 11, color: '#7c3aed', fontWeight: '600', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '800' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#f4f8ff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#c8d8e8',
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#10213a', marginBottom: 16 },
  errorText: { color: '#e74c3c', fontSize: 13, marginBottom: 12, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 10, paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#10213a' },
  roleLabel: { fontSize: 13, fontWeight: '700', color: '#5d6f85', marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#c8d8e8', backgroundColor: 'rgba(255,255,255,0.5)',
  },
  roleChipText: { fontWeight: '700', fontSize: 13, color: '#5d6f85' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: '#5d6f85' },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: '#0f4c81', alignItems: 'center' },
  saveText: { fontWeight: '800', color: '#fff', fontSize: 15 },
})
