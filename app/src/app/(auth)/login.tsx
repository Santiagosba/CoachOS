import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useAuthStore } from '@/lib/auth-store'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'
import PasswordField from '@/components/PasswordField'

export default function LoginScreen() {
  const { login, registerTrainer } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleLogin() {
    if (!email || !password) return
    setErrorMessage('')
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
    } catch {
      setErrorMessage('Credenciales incorrectas')
      Alert.alert('Error', 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    setErrorMessage('')
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setErrorMessage('Completa nombre, apellidos, email y contraseña')
      Alert.alert('Faltan datos', 'Completa nombre, apellidos, email y contraseña')
      return
    }
    if (!isStrongPassword(password)) {
      const message = 'Usa 8+ caracteres con mayúscula, minúscula y número'
      setErrorMessage(message)
      Alert.alert('Contraseña poco segura', message)
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden')
      Alert.alert('Las contraseñas no coinciden', 'Repite la misma contraseña en ambos campos')
      return
    }

    setLoading(true)
    try {
      await registerTrainer(firstName.trim(), lastName.trim(), email.trim().toLowerCase(), password)
    } catch (error: any) {
      const backendMessage = error?.response?.data?.error
      const zodMessage = error?.response?.data?.error?.fieldErrors?.password?.[0]
      const message = zodMessage ?? backendMessage ?? 'No se pudo crear la cuenta'
      setErrorMessage(message)
      Alert.alert('Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LiquidGlassBackground>
      <View style={styles.container}>
        <View style={[glass.card, styles.panel]}>
          <Text style={styles.eyebrow}>Personal Training OS</Text>
          <Text style={styles.title}>CoachOS</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? 'Entra en tu cuenta' : 'Crea tu cuenta de entrenador'}
          </Text>

          {mode === 'register' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#6f8196"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Apellidos"
                placeholderTextColor="#6f8196"
                value={lastName}
                onChangeText={setLastName}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#6f8196"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <PasswordField
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#6f8196"
            value={password}
            onChangeText={setPassword}
          />

          {mode === 'register' && (
            <>
              <PasswordField
                style={styles.input}
                placeholder="Repite la contraseña"
                placeholderTextColor="#6f8196"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Text style={styles.passwordHint}>
                La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.
              </Text>
            </>
          )}

          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setMode((prev) => (prev === 'login' ? 'register' : 'login'))
              setLoading(false)
              setErrorMessage('')
            }}
          >
            <Text style={styles.switchText}>
              {mode === 'login'
                ? '¿No tienes cuenta? Regístrate como entrenador'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LiquidGlassBackground>
  )
}

function isStrongPassword(password: string) {
  return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    padding: 24,
    backgroundColor: 'rgba(245,250,255,0.34)',
  },
  eyebrow: {
    color: '#53657d',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#10213a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#53657d',
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 28,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    color: '#10213a',
    borderRadius: 18,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  button: {
    backgroundColor: '#113b7a',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0f2d5f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#9d1b38',
    fontSize: 14,
    marginTop: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  passwordHint: {
    color: '#5a6e85',
    fontSize: 12,
    lineHeight: 18,
    marginTop: -2,
    marginBottom: 8,
  },
  switchButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchText: {
    color: '#113b7a',
    fontSize: 14,
    fontWeight: '600',
  },
})
