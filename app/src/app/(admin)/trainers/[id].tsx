import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView,
  Platform, TextInput,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import LiquidGlassBackground from '@/components/LiquidGlassBackground'
import { api } from '@/lib/api'

interface TrainerDetail {
  id: string
  name: string
  email: string
  createdAt: string
  clients: {
    id: string
    goal?: string
    weight?: number
    user: { id: string; name: string; email: string }
    programs: { id: string; name: string; active: boolean }[]
    sessions: { id: string; date: string; status: string; type: string }[]
  }[]
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Mínimo 8 caracteres'
  if (!/[A-Z]/.test(pw)) return 'Necesita al menos una mayúscula (A-Z)'
  if (!/[a-z]/.test(pw)) return 'Necesita al menos una minúscula (a-z)'
  if (!/[0-9]/.test(pw)) return 'Necesita al menos un número (0-9)'
  return null
}

export default function AdminTrainerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [trainer, setTrainer] = useState<TrainerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const load = async () => {
    try {
      const { data } = await api.get(`/admin/users/${id}`)
      setTrainer(data)
      setForm({ name: data.name, email: data.email, password: '' })
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const saveEdit = async () => {
    setEditError('')

    // Validate name
    if (!form.name.trim() || form.name.trim().length < 2) {
      setEditError('El nombre debe tener al menos 2 caracteres')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email.trim())) {
      setEditError('El email no tiene un formato válido')
      return
    }

    // Validate password only if user typed something
    if (form.password) {
      const pwError = validatePassword(form.password)
      if (pwError) {
        setEditError(pwError)
        return
      }
    }

    setSaving(true)
    try {
      const body: any = {}
      if (form.name.trim() !== trainer?.name) body.name = form.name.trim()
      if (form.email.trim() !== trainer?.email) body.email = form.email.trim()
      if (form.password) body.password = form.password
      await api.patch(`/admin/users/${id}`, body)
      setForm(p => ({ ...p, password: '' }))
      setShowEdit(false)
      load()
    } catch (e: any) {
      setEditError(e.response?.data?.error ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const deleteTrainer = () => {
    Alert.alert(
      'Eliminar entrenador',
      `¿Eliminar a ${trainer?.name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${id}`)
              router.back()
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.error ?? 'No se pudo eliminar')
            }
          },
        },
      ]
    )
  }

  if (loading || !trainer) {
    return (
      <LiquidGlassBackground>
        <ActivityIndicator style={{ flex: 1 }} color="#0f4c81" />
      </LiquidGlassBackground>
    )
  }

  return (
    <LiquidGlassBackground>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0f4c81" />
          <Text style={styles.backText}>Entrenadores</Text>
        </TouchableOpacity>

        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{trainer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{trainer.name}</Text>
          <Text style={styles.email}>{trainer.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>ENTRENADOR</Text>
          </View>
          <Text style={styles.since}>
            Desde {new Date(trainer.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
          </Text>

          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
              <Ionicons name="pencil" size={16} color="#0f4c81" />
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={deleteTrainer}>
              <Ionicons name="trash-outline" size={16} color="#e74c3c" />
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clients */}
        <Text style={styles.sectionTitle}>
          Clientes ({trainer.clients.length})
        </Text>

        {trainer.clients.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>Sin clientes asignados</Text>
          </View>
        ) : (
          trainer.clients.map((c) => (
            <View key={c.id} style={styles.clientCard}>
              <View style={styles.clientHeader}>
                <View style={styles.smallAvatar}>
                  <Text style={styles.smallAvatarText}>{c.user.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>{c.user.name}</Text>
                  <Text style={styles.clientEmail}>{c.user.email}</Text>
                </View>
                <View style={styles.clientBadges}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{c.programs.length} prog.</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: '#1a7a4a18' }]}>
                    <Text style={[styles.badgeText, { color: '#1a7a4a' }]}>{c.sessions.length} ses.</Text>
                  </View>
                </View>
              </View>
              {c.goal ? <Text style={styles.clientGoal}>🎯 {c.goal}</Text> : null}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Editar entrenador</Text>
            {editError ? <Text style={styles.errorText}>{editError}</Text> : null}

            {/* Name */}
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color="#5d6f85" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => { setForm(p => ({ ...p, name: v })); setEditError('') }}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color="#5d6f85" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(v) => { setForm(p => ({ ...p, email: v })); setEditError('') }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <Text style={styles.pwLabel}>Nueva contraseña (opcional)</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#5d6f85" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={form.password}
                onChangeText={(v) => { setForm(p => ({ ...p, password: v })); setEditError('') }}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                placeholder="Dejar vacío para no cambiar"
                placeholderTextColor="#a0b0c0"
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ padding: 4 }}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color="#5d6f85" />
              </TouchableOpacity>
            </View>

            {/* Password requirements checklist */}
            {form.password.length > 0 && (
              <View style={styles.reqList}>
                {[
                  { label: 'Mínimo 8 caracteres', ok: form.password.length >= 8 },
                  { label: 'Una mayúscula (A-Z)', ok: /[A-Z]/.test(form.password) },
                  { label: 'Una minúscula (a-z)', ok: /[a-z]/.test(form.password) },
                  { label: 'Un número (0-9)', ok: /[0-9]/.test(form.password) },
                ].map(r => (
                  <View key={r.label} style={styles.reqRow}>
                    <Ionicons
                      name={r.ok ? 'checkmark-circle' : 'ellipse-outline'}
                      size={13}
                      color={r.ok ? '#1a7a4a' : '#aac0d8'}
                    />
                    <Text style={[styles.reqText, r.ok && { color: '#1a7a4a', fontWeight: '700' }]}>
                      {r.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEdit(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Guardar</Text>}
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { color: '#0f4c81', fontWeight: '700', fontSize: 15 },
  profileCard: {
    backgroundColor: 'rgba(244,248,255,0.8)',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    marginBottom: 28,
    gap: 6,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#0f4c8120', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#0f4c81' },
  name: { fontSize: 22, fontWeight: '800', color: '#10213a' },
  email: { fontSize: 14, color: '#5d6f85' },
  roleBadge: {
    backgroundColor: '#0f4c8118', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 4,
  },
  roleText: { fontSize: 11, fontWeight: '800', color: '#0f4c81', letterSpacing: 1 },
  since: { fontSize: 12, color: '#aac0d8', marginTop: 2 },
  profileActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0f4c8115', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
  },
  editText: { color: '#0f4c81', fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#e74c3c15', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
  },
  deleteText: { color: '#e74c3c', fontWeight: '700' },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', color: '#5d6f85', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 12,
  },
  emptySection: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: '#aac0d8', fontWeight: '600' },
  clientCard: {
    backgroundColor: 'rgba(244,248,255,0.8)', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', marginBottom: 10,
  },
  clientHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1a7a4a18', alignItems: 'center', justifyContent: 'center',
  },
  smallAvatarText: { fontSize: 14, fontWeight: '800', color: '#1a7a4a' },
  clientName: { fontSize: 14, fontWeight: '700', color: '#10213a' },
  clientEmail: { fontSize: 12, color: '#5d6f85' },
  clientBadges: { flexDirection: 'row', gap: 6 },
  badge: { backgroundColor: '#0f4c8118', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#0f4c81' },
  clientGoal: { fontSize: 12, color: '#5d6f85', marginTop: 8, marginLeft: 46 },
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
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: '#5d6f85' },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: '#0f4c81', alignItems: 'center' },
  saveText: { fontWeight: '800', color: '#fff', fontSize: 15 },
  pwLabel: { fontSize: 12, fontWeight: '700', color: '#5d6f85', marginTop: 8, marginBottom: 4, marginLeft: 4 },
  reqList: { gap: 5, marginBottom: 10, paddingLeft: 4 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reqText: { fontSize: 12, color: '#aac0d8' },
})
