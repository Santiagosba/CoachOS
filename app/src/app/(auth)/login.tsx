import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import { useAuthStore } from '@/lib/auth-store'
import LiquidGlassBackground, { glass } from '@/components/LiquidGlassBackground'
import PasswordField from '@/components/PasswordField'

const webBlur: object =
  Platform.OS === 'web'
    ? ({ backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)' } as object)
    : {}

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
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoOrb} />
          <Text style={styles.logoMark}>C</Text>
        </View>
        <Text style={styles.appName}>CoachOS</Text>
        <Text style={styles.tagline}>Personal Training OS</Text>

        {/* Glass panel */}
        <View style={[styles.panel, webBlur as any]}>
          <Text style={styles.panelTitle}>
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </Text>
          <Text style={styles.panelSub}>
            {mode === 'login' ? 'Entra en tu espacio de entrenamiento' : 'Empieza como entrenador personal'}
          </Text>

          {mode === 'register' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="rgba(160, 185, 230, 0.45)"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Apellidos"
                placeholderTextColor="rgba(160, 185, 230, 0.45)"
                value={lastName}
                onChangeText={setLastName}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(160, 185, 230, 0.45)"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <PasswordField
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="rgba(160, 185, 230, 0.45)"
            value={password}
            onChangeText={setPassword}
          />

          {mode === 'register' && (
            <>
              <PasswordField
                style={styles.input}
                placeholder="Repite la contraseña"
                placeholderTextColor="rgba(160, 185, 230, 0.45)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Text style={styles.passwordHint}>
                8+ caracteres · mayúscula · minúscula · número
              </Text>
            </>
          )}

          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
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
    alignItems: 'center',
    padding: 24,
  },
  // Logo
  logoArea: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3b72f5',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
  },
  logoOrb: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(60, 110, 250, 0.25)',
  },
  logoMark: {
    fontSize: 36,
    fontWeight: '900',
    color: 'rgba(240, 244, 255, 0.95)',
    letterSpacing: -1,
  },
  appName: {
    fontSize: 44,
    fontWeight: '900',
    color: 'rgba(240, 244, 255, 0.97)',
    letterSpacing: -2,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(160, 185, 230, 0.55)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 36,
  },
  // Panel
  panel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 32,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 32 },
    shadowOpacity: 0.55,
    shadowRadius: 48,
    elevation: 24,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: 'rgba(240, 244, 255, 0.95)',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  panelSub: {
    fontSize: 14,
    color: 'rgba(160, 185, 230, 0.60)',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    color: 'rgba(240, 244, 255, 0.92)',
    borderRadius: 18,
    padding: 15,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  button: {
    backgroundColor: '#2b5fd9',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3b72f5',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  passwordHint: {
    color: 'rgba(160, 185, 230, 0.50)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 10,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#5b9cf6',
    fontSize: 14,
    fontWeight: '600',
  },
})
