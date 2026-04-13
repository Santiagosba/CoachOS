import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '@/lib/auth-store'

export default function RootLayout() {
  const { user, loadSession } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    loadSession()
  }, [])

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login')
      return
    }
    if (user.role === 'ADMIN') {
      router.replace('/(admin)/')
    } else if (user.role === 'TRAINER') {
      router.replace('/(trainer)/')
    } else {
      router.replace('/(client)/')
    }
  }, [user])

  return <Stack screenOptions={{ headerShown: false }} />
}
