import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { glass } from '@/components/LiquidGlassBackground'
import AnimatedEntrance from '@/components/AnimatedEntrance'
import ScreenScaffold from '@/components/ScreenScaffold'
import PasswordField from '@/components/PasswordField'

interface Client {
  id: string
  goal: string | null
  user: { id: string; name: string; email: string }
}

export default function ClientsScreen() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [goal, setGoal] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/clients')
      setClients(data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#5b9cf6" size="large" /></View>
  }

  async function handleCreate() {
    const trimmedPassword = password.trim()
    if (!name.trim() || !email.trim() || !trimmedPassword) {
      Alert.alert('Faltan datos', 'Completa nombre, email y contraseña')
      return
    }
    if (!isStrongPassword(trimmedPassword)) {
      Alert.alert('Contraseña insegura', 'Usa al menos 8 caracteres, una mayúscula, una minúscula y un número')
      return
    }
    setSaving(true)
    try {
      await api.post('/clients', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: trimmedPassword,
        goal: goal.trim() || undefined,
      })
      setName(''); setEmail(''); setPassword(''); setGoal('')
      setShowForm(false)
      await load()
      Alert.alert('Cliente creado', 'Ya puedes asignarle un programa y gestionar sus sesiones')
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error ?? 'No se pudo crear el cliente')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScreenScaffold
      eyebrow="Client Roster"
      title="Clientes"
      subtitle="Alta rápida, acceso a ficha y gestión diaria de tu cartera."
      scroll={false}
      headerAction={
        <TouchableOpacity style={[glass.pill as any, styles.addButton]} onPress={() => setShowForm((prev) => !prev)}>
          <Text style={styles.addButtonText}>{showForm ? 'Cerrar' : 'Nuevo'}</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {showForm && (
          <AnimatedEntrance delay={80}>
            <ScrollView style={[glass.card as any, styles.formCard]} keyboardShouldPersistTaps="handled">
              <Text style={styles.formTitle}>Alta rápida de cliente</Text>
              <TextInput
                value={name} onChangeText={setName}
                placeholder="Nombre" placeholderTextColor="rgba(160, 185, 230, 0.40)"
                style={styles.input}
              />
              <TextInput
                value={email} onChangeText={setEmail}
                placeholder="email@cliente.com" placeholderTextColor="rgba(160, 185, 230, 0.40)"
                style={styles.input} autoCapitalize="none" keyboardType="email-address"
              />
              <PasswordField
                value={password} onChangeText={setPassword}
                placeholder="Contraseña inicial segura" placeholderTextColor="rgba(160, 185, 230, 0.40)"
                style={styles.input}
              />
              <Text style={styles.passwordHint}>8+ caracteres · mayúscula · minúscula · número</Text>
              <TextInput
                value={goal} onChangeText={setGoal}
                placeholder="Objetivo (opcional)" placeholderTextColor="rgba(160, 185, 230, 0.40)"
                style={styles.input}
              />
              <TouchableOpacity
                style={[styles.createButton, saving && { opacity: 0.7 }]}
                onPress={handleCreate} disabled={saving}
              >
                <Text style={styles.createButtonText}>{saving ? 'Creando...' : 'Crear cliente'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </AnimatedEntrance>
        )}

        <FlatList
          data={clients}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#5b9cf6" />}
          contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 120 }}
          ListEmptyComponent={<Text style={styles.empty}>Sin clientes todavía</Text>}
          renderItem={({ item }) => (
            <AnimatedEntrance delay={100}>
              <TouchableOpacity
                style={[glass.card as any, styles.card]}
                onPress={() => router.push(`/(trainer)/clients/${item.id}`)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.user.name[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.user.name}</Text>
                  <Text style={styles.sub}>{item.goal ?? item.user.email}</Text>
                </View>
              </TouchableOpacity>
            </AnimatedEntrance>
          )}
        />
      </View>
    </ScreenScaffold>
  )
}

function isStrongPassword(value: string) {
  return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value)
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  addButton: { paddingHorizontal: 14, paddingVertical: 10 },
  addButtonText: { color: '#5b9cf6', fontSize: 13, fontWeight: '800' },
  formCard: { marginHorizontal: 20, marginBottom: 16, padding: 16, maxHeight: 340 },
  formTitle: { color: 'rgba(240, 244, 255, 0.92)', fontSize: 16, fontWeight: '800', marginBottom: 14 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    color: 'rgba(240, 244, 255, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  passwordHint: { color: 'rgba(160, 185, 230, 0.45)', fontSize: 12, marginTop: -4, marginBottom: 10 },
  createButton: { backgroundColor: '#2b5fd9', borderRadius: 16, paddingVertical: 13, alignItems: 'center', shadowColor: '#3b72f5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.40, shadowRadius: 16 },
  createButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(91, 156, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 246, 0.25)',
  },
  avatarText: { color: '#5b9cf6', fontSize: 18, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700', color: 'rgba(240, 244, 255, 0.92)' },
  sub: { fontSize: 13, color: 'rgba(160, 185, 230, 0.55)', marginTop: 2 },
  empty: { textAlign: 'center', color: 'rgba(160, 185, 230, 0.45)', marginTop: 40 },
})
