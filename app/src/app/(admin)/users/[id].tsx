import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import LiquidGlassBackground from '@/components/LiquidGlassBackground'
import { api } from '@/lib/api'

interface UserDetail {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  clientProfile?: {
    goal?: string
    weight?: number
    height?: number
    trainer?: { name: string; email: string }
  } | null
  clients?: {
    id: string
    user: { name: string; email: string }
    goal?: string
  }[]
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

// Validates password strength
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Mínimo 8 caracteres'
  if (!/[A-Z]/.test(pw)) return 'Debe tener al menos una mayúscula'
  if (!/[a-z]/.test(pw)) return 'Debe tener al menos una minúscula'
  if (!/[0-9]/.test(pw)) return 'Debe tener al menos un número'
  return null
}

export default function AdminUserDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile edit
  const [profileForm, setProfileForm] = useState({ name: '', email: '', role: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Password change
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwStrength, setPwStrength] = useState<null | 'weak' | 'medium' | 'strong'>(null)

  const load = async () => {
    try {
      const { data } = await api.get(`/admin/users/${id}`)
      setUser(data)
      setProfileForm({ name: data.name, email: data.email, role: data.role })
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  // Live password strength
  const handlePwChange = (v: string) => {
    setPwForm((p) => ({ ...p, password: v }))
    setPwMsg(null)
    if (!v) { setPwStrength(null); return }
    const hasUpper = /[A-Z]/.test(v)
    const hasLower = /[a-z]/.test(v)
    const hasNumber = /[0-9]/.test(v)
    const hasSpecial = /[^A-Za-z0-9]/.test(v)
    const score = [v.length >= 8, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
    if (score <= 2) setPwStrength('weak')
    else if (score === 3 || score === 4) setPwStrength('medium')
    else setPwStrength('strong')
  }

  const saveProfile = async () => {
    setProfileMsg(null)

    // Validate email format before sending
    if (profileForm.email !== user?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(profileForm.email.trim())) {
        setProfileMsg({ type: 'err', text: 'El email no tiene un formato válido' })
        return
      }
    }

    if (!profileForm.name.trim() || profileForm.name.trim().length < 2) {
      setProfileMsg({ type: 'err', text: 'El nombre debe tener al menos 2 caracteres' })
      return
    }

    setProfileSaving(true)
    try {
      const body: any = {}
      if (profileForm.name.trim() !== user?.name) body.name = profileForm.name.trim()
      if (profileForm.email.trim() !== user?.email) body.email = profileForm.email.trim()
      if (profileForm.role !== user?.role) body.role = profileForm.role

      if (Object.keys(body).length === 0) {
        setProfileMsg({ type: 'ok', text: 'Sin cambios que guardar' })
        return
      }
      await api.patch(`/admin/users/${id}`, body)
      setProfileMsg({ type: 'ok', text: '✓ Cambios guardados' })
      load()
    } catch (e: any) {
      setProfileMsg({ type: 'err', text: e.response?.data?.error ?? 'Error al guardar' })
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async () => {
    setPwMsg(null)

    const validationError = validatePassword(pwForm.password)
    if (validationError) {
      setPwMsg({ type: 'err', text: validationError })
      return
    }
    if (pwForm.password !== pwForm.confirm) {
      setPwMsg({ type: 'err', text: 'Las contraseñas no coinciden' })
      return
    }

    setPwSaving(true)
    try {
      await api.patch(`/admin/users/${id}`, { password: pwForm.password })
      setPwForm({ password: '', confirm: '' })
      setPwStrength(null)
      setPwMsg({ type: 'ok', text: '✓ Contraseña actualizada y encriptada' })
    } catch (e: any) {
      setPwMsg({ type: 'err', text: e.response?.data?.error ?? 'Error al cambiar contraseña' })
    } finally {
      setPwSaving(false)
    }
  }

  const deleteUser = () => {
    Alert.alert(
      'Eliminar usuario',
      `¿Eliminar a ${user?.name}? Esta acción no se puede deshacer.`,
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

  if (loading || !user) {
    return (
      <LiquidGlassBackground>
        <ActivityIndicator style={{ flex: 1 }} color="#0f4c81" />
      </LiquidGlassBackground>
    )
  }

  const color = ROLE_COLOR[user.role] ?? '#888'

  return (
    <LiquidGlassBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#0f4c81" />
            <Text style={styles.backText}>Usuarios</Text>
          </TouchableOpacity>

          {/* Avatar + badge */}
          <View style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: color + '18' }]}>
              <Text style={[styles.avatarText, { color }]}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: color + '18' }]}>
              <Text style={[styles.roleText, { color }]}>{ROLE_LABEL[user.role] ?? user.role}</Text>
            </View>
            <Text style={styles.since}>
              Registrado {new Date(user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
            {user.clientProfile?.trainer && (
              <Text style={styles.trainerTag}>
                <Ionicons name="barbell-outline" size={12} /> Entrenador: {user.clientProfile.trainer.name}
              </Text>
            )}
            {user.clients && user.clients.length > 0 && (
              <Text style={styles.trainerTag}>
                <Ionicons name="people-outline" size={12} /> {user.clients.length} cliente{user.clients.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* ── Profile section ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos del perfil</Text>

            <View style={styles.fieldLabel}>
              <Ionicons name="person-outline" size={14} color="#5d6f85" />
              <Text style={styles.label}>Nombre</Text>
            </View>
            <TextInput
              style={styles.input}
              value={profileForm.name}
              onChangeText={(v) => { setProfileForm((p) => ({ ...p, name: v })); setProfileMsg(null) }}
              autoCapitalize="words"
            />

            <View style={styles.fieldLabel}>
              <Ionicons name="mail-outline" size={14} color="#5d6f85" />
              <Text style={styles.label}>Email</Text>
            </View>
            <TextInput
              style={styles.input}
              value={profileForm.email}
              onChangeText={(v) => { setProfileForm((p) => ({ ...p, email: v })); setProfileMsg(null) }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.fieldLabel}>
              <Ionicons name="shield-outline" size={14} color="#5d6f85" />
              <Text style={styles.label}>Rol</Text>
            </View>
            <View style={styles.roleRow}>
              {(['TRAINER', 'CLIENT', 'ADMIN'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleChip,
                    profileForm.role === r && { backgroundColor: ROLE_COLOR[r], borderColor: ROLE_COLOR[r] },
                  ]}
                  onPress={() => { setProfileForm((p) => ({ ...p, role: r })); setProfileMsg(null) }}
                >
                  <Text style={[styles.roleChipText, profileForm.role === r && { color: '#fff' }]}>
                    {ROLE_LABEL[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {profileMsg && (
              <Text style={[styles.feedback, profileMsg.type === 'ok' ? styles.feedbackOk : styles.feedbackErr]}>
                {profileMsg.text}
              </Text>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={profileSaving}>
              {profileSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Guardar cambios</Text>
              }
            </TouchableOpacity>
          </View>

          {/* ── Password section ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
              <View style={styles.encryptBadge}>
                <Ionicons name="lock-closed" size={11} color="#1a7a4a" />
                <Text style={styles.encryptText}>bcrypt</Text>
              </View>
            </View>
            <Text style={styles.sectionHint}>
              La contraseña se almacena encriptada con bcrypt — nadie puede verla, ni el admin.
            </Text>

            {/* New password */}
            <View style={styles.fieldLabel}>
              <Ionicons name="lock-closed-outline" size={14} color="#5d6f85" />
              <Text style={styles.label}>Nueva contraseña</Text>
            </View>
            <View style={styles.pwRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={pwForm.password}
                onChangeText={handlePwChange}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                placeholder="Mín. 8 chars, mayúscula, número"
                placeholderTextColor="#a0b0c0"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw((v) => !v)}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color="#5d6f85" />
              </TouchableOpacity>
            </View>

            {/* Strength bar */}
            {pwStrength && (
              <View style={styles.strengthRow}>
                {(['weak', 'medium', 'strong'] as const).map((level, i) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          pwStrength === 'weak' && i === 0 ? '#e74c3c' :
                          pwStrength === 'medium' && i <= 1 ? '#f39c12' :
                          pwStrength === 'strong' ? '#1a7a4a' :
                          'rgba(0,0,0,0.08)',
                      },
                    ]}
                  />
                ))}
                <Text style={[
                  styles.strengthText,
                  pwStrength === 'weak' && { color: '#e74c3c' },
                  pwStrength === 'medium' && { color: '#f39c12' },
                  pwStrength === 'strong' && { color: '#1a7a4a' },
                ]}>
                  {pwStrength === 'weak' ? 'Débil' : pwStrength === 'medium' ? 'Media' : 'Fuerte'}
                </Text>
              </View>
            )}

            {/* Requirements checklist */}
            {pwForm.password.length > 0 && (
              <View style={styles.reqList}>
                {[
                  { label: 'Mínimo 8 caracteres', ok: pwForm.password.length >= 8 },
                  { label: 'Una mayúscula (A-Z)', ok: /[A-Z]/.test(pwForm.password) },
                  { label: 'Una minúscula (a-z)', ok: /[a-z]/.test(pwForm.password) },
                  { label: 'Un número (0-9)', ok: /[0-9]/.test(pwForm.password) },
                ].map((r) => (
                  <View key={r.label} style={styles.reqRow}>
                    <Ionicons
                      name={r.ok ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={r.ok ? '#1a7a4a' : '#aac0d8'}
                    />
                    <Text style={[styles.reqText, r.ok && styles.reqOk]}>{r.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Confirm */}
            <View style={styles.fieldLabel}>
              <Ionicons name="lock-closed-outline" size={14} color="#5d6f85" />
              <Text style={styles.label}>Confirmar contraseña</Text>
            </View>
            <View style={styles.pwRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={pwForm.confirm}
                onChangeText={(v) => { setPwForm((p) => ({ ...p, confirm: v })); setPwMsg(null) }}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                placeholder="Repetir contraseña"
                placeholderTextColor="#a0b0c0"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm((v) => !v)}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#5d6f85" />
              </TouchableOpacity>
            </View>

            {/* Match indicator */}
            {pwForm.confirm.length > 0 && (
              <View style={styles.matchRow}>
                <Ionicons
                  name={pwForm.password === pwForm.confirm ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={pwForm.password === pwForm.confirm ? '#1a7a4a' : '#e74c3c'}
                />
                <Text style={{ fontSize: 12, color: pwForm.password === pwForm.confirm ? '#1a7a4a' : '#e74c3c', fontWeight: '600' }}>
                  {pwForm.password === pwForm.confirm ? 'Las contraseñas coinciden' : 'No coinciden'}
                </Text>
              </View>
            )}

            {pwMsg && (
              <Text style={[styles.feedback, pwMsg.type === 'ok' ? styles.feedbackOk : styles.feedbackErr]}>
                {pwMsg.text}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, styles.pwSaveBtn, pwSaving && { opacity: 0.7 }]}
              onPress={savePassword}
              disabled={pwSaving}
            >
              {pwSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="lock-closed" size={16} color="#fff" />
                    <Text style={styles.saveBtnText}>Actualizar contraseña</Text>
                  </>
              }
            </TouchableOpacity>
          </View>

          {/* ── Danger zone ── */}
          <View style={[styles.section, styles.dangerSection]}>
            <Text style={styles.dangerTitle}>Zona de peligro</Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={deleteUser}>
              <Ionicons name="trash-outline" size={18} color="#e74c3c" />
              <Text style={styles.dangerText}>Eliminar usuario</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LiquidGlassBackground>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { color: '#0f4c81', fontWeight: '700', fontSize: 15 },

  profileCard: {
    backgroundColor: 'rgba(244,248,255,0.8)',
    borderRadius: 22, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', marginBottom: 20, gap: 6,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  avatarText: { fontSize: 28, fontWeight: '900' },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },
  roleText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  since: { fontSize: 12, color: '#aac0d8' },
  trainerTag: { fontSize: 12, color: '#5d6f85', fontWeight: '600' },

  section: {
    backgroundColor: 'rgba(244,248,255,0.8)',
    borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', marginBottom: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#10213a', marginBottom: 6 },
  sectionHint: { fontSize: 12, color: '#7a9ab8', marginBottom: 14, lineHeight: 17 },

  encryptBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1a7a4a18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  encryptText: { fontSize: 11, fontWeight: '800', color: '#1a7a4a' },

  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5, marginTop: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#5d6f85' },

  input: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(200,216,232,0.7)',
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#10213a', marginBottom: 4,
  },
  pwRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  eyeBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(200,216,232,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 11, fontWeight: '800', width: 48, textAlign: 'right' },

  reqList: { gap: 4, marginBottom: 10 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reqText: { fontSize: 12, color: '#aac0d8', fontWeight: '500' },
  reqOk: { color: '#1a7a4a', fontWeight: '700' },

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },

  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  roleChip: {
    flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#c8d8e8', backgroundColor: 'rgba(255,255,255,0.5)',
  },
  roleChipText: { fontWeight: '700', fontSize: 12, color: '#5d6f85' },

  feedback: { fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  feedbackOk: { color: '#1a7a4a' },
  feedbackErr: { color: '#e74c3c' },

  saveBtn: {
    backgroundColor: '#0f4c81', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 6,
  },
  pwSaveBtn: {
    backgroundColor: '#1a7a4a',
    flexDirection: 'row', gap: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  dangerSection: { borderColor: 'rgba(231,76,60,0.2)', backgroundColor: 'rgba(255,245,245,0.7)' },
  dangerTitle: { fontSize: 12, fontWeight: '800', color: '#e74c3c', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(231,76,60,0.08)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  dangerText: { color: '#e74c3c', fontWeight: '700', fontSize: 14 },
})
