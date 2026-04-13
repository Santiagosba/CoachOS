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
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    )
  }

  async function handleCreate() {
    const trimmedPassword = password.trim()

    if (!name.trim() || !email.trim() || !trimmedPassword) {
      Alert.alert('Faltan datos', 'Completa nombre, email y contraseña')
      return
    }

    if (!isStrongPassword(trimmedPassword)) {
      Alert.alert(
        'Contraseña insegura',
        'Usa al menos 8 caracteres, una mayúscula, una minúscula y un número'
      )
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
      setName('')
      setEmail('')
      setPassword('')
      setGoal('')
      setShowForm(false)
      await load()
      Alert.alert('Cliente creado', 'Ya puedes asignarle un programa y gestionar sus sesiones')
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'No se pudo crear el cliente'
      Alert.alert('Error', message)
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
        <TouchableOpacity style={[glass.pill, styles.addButton]} onPress={() => setShowForm((prev) => !prev)}>
            <Text style={styles.addButtonText}>{showForm ? 'Cerrar' : 'Nuevo'}</Text>
          </TouchableOpacity>
      }
    >
      <View style={styles.container}>

        {showForm && (
          <AnimatedEntrance delay={80}>
            <ScrollView style={[glass.card, styles.formCard]} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>Alta rápida de cliente</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre"
            placeholderTextColor="#475569"
            style={styles.input}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@cliente.com"
            placeholderTextColor="#475569"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <PasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña inicial segura"
            placeholderTextColor="#475569"
            style={styles.input}
          />
          <Text style={styles.passwordHint}>
            8+ caracteres, una mayúscula, una minúscula y un número
          </Text>
          <TextInput
            value={goal}
            onChangeText={setGoal}
            placeholder="Objetivo (opcional)"
            placeholderTextColor="#475569"
            style={styles.input}
          />
          <TouchableOpacity
            style={[styles.createButton, saving && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={saving}
          >
            <Text style={styles.createButtonText}>{saving ? 'Creando...' : 'Crear cliente'}</Text>
          </TouchableOpacity>
            </ScrollView>
          </AnimatedEntrance>
        )}

        <FlatList
          data={clients}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#113b7a" />}
          contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 120 }}
          ListEmptyComponent={<Text style={styles.empty}>Sin clientes todavía</Text>}
          renderItem={({ item }) => (
            <AnimatedEntrance delay={100}>
              <TouchableOpacity
                style={[glass.card, styles.card]}
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
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value)
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  addButton: { paddingHorizontal: 14, paddingVertical: 10 },
  addButtonText: { color: '#113b7a', fontSize: 13, fontWeight: '800' },
  formCard: { marginHorizontal: 20, marginBottom: 16, padding: 14, maxHeight: 320 },
  formTitle: { color: '#10213a', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    color: '#10213a',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  passwordHint: { color: '#5d6f85', fontSize: 12, marginTop: -2, marginBottom: 10 },
  createButton: { backgroundColor: '#113b7a', borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  createButtonText: { color: '#fff', fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(17,59,122,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#113b7a', fontSize: 18, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700', color: '#10213a' },
  sub: { fontSize: 13, color: '#5d6f85', marginTop: 2 },
  empty: { textAlign: 'center', color: '#5d6f85', marginTop: 40 },
})
