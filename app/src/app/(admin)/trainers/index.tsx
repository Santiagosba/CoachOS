import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Modal,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import LiquidGlassBackground from '@/components/LiquidGlassBackground'
import { api } from '@/lib/api'

interface Trainer {
  id: string
  name: string
  email: string
  createdAt: string
  clients: { id: string; user: { name: string; email: string } }[]
}

export default function AdminTrainers() {
  const router = useRouter()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  // Form
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const { data } = await api.get('/admin/trainers')
      setTrainers(data)
    } catch {
      //
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { load() }, []))

  const createTrainer = async () => {
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Todos los campos son obligatorios')
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/users', { ...form, role: 'TRAINER' })
      setForm({ name: '', email: '', password: '' })
      setShowCreate(false)
      load()
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Error al crear entrenador')
    } finally {
      setSaving(false)
    }
  }

  const deleteTrainer = (id: string, name: string) => {
    Alert.alert(
      'Eliminar entrenador',
      `¿Eliminar a ${name}? Se eliminarán todos sus datos y los de sus clientes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${id}`)
              load()
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.error ?? 'No se pudo eliminar')
            }
          },
        },
      ]
    )
  }

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
            <Text style={styles.eyebrow}>ADMINISTRACIÓN</Text>
            <Text style={styles.heading}>Entrenadores</Text>
            <Text style={styles.sub}>{trainers.length} registrados</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* List */}
        {trainers.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={48} color="#aac0d8" />
            <Text style={styles.emptyText}>No hay entrenadores aún</Text>
          </View>
        ) : (
          trainers.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.card}
              onPress={() => router.push(`/(admin)/trainers/${t.id}`)}
            >
              <View style={styles.cardLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{t.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{t.name}</Text>
                  <Text style={styles.cardEmail}>{t.email}</Text>
                  <Text style={styles.cardMeta}>
                    {t.clients.length} cliente{t.clients.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => deleteTrainer(t.id, t.name)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={16} color="#aac0d8" />
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nuevo entrenador</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {[
              { key: 'name', label: 'Nombre completo', placeholder: 'Carlos López', icon: 'person-outline' },
              { key: 'email', label: 'Email', placeholder: 'carlos@gym.com', icon: 'mail-outline', keyboardType: 'email-address' },
              { key: 'password', label: 'Contraseña inicial', placeholder: '········', icon: 'lock-closed-outline', secure: true },
            ].map((f) => (
              <View key={f.key} style={styles.inputRow}>
                <Ionicons name={f.icon as any} size={18} color="#5d6f85" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor="#a0b0c0"
                  value={(form as any)[f.key]}
                  onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                  autoCapitalize="none"
                  keyboardType={(f as any).keyboardType ?? 'default'}
                  secureTextEntry={(f as any).secure ?? false}
                />
              </View>
            ))}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowCreate(false); setError('') }}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={createTrainer} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveText}>Crear</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LiquidGlassBackground>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: '#7c3aed', letterSpacing: 1.4, marginBottom: 4 },
  heading: { fontSize: 30, fontWeight: '900', color: '#10213a' },
  sub: { fontSize: 13, color: '#5d6f85', marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#0f4c81', alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#7a9ab8', fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244,248,255,0.8)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#0f4c8120', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#0f4c81' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#10213a' },
  cardEmail: { fontSize: 12, color: '#5d6f85', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#7c3aed', fontWeight: '600', marginTop: 3 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 10, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#10213a' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: '#5d6f85' },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#0f4c81', alignItems: 'center',
  },
  saveText: { fontWeight: '800', color: '#fff', fontSize: 15 },
})
