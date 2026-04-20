import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Platform } from 'react-native'

const tabBarWebBlur: object =
  Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
      } as object)
    : {}

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          height: 80,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: 'rgba(6, 12, 28, 0.82)',
          borderTopColor: 'rgba(255, 255, 255, 0.09)',
          borderTopWidth: 1,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.09)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.55,
          shadowRadius: 40,
          elevation: 24,
          ...tabBarWebBlur,
        } as any,
        tabBarActiveTintColor: '#5b9cf6',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.32)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progreso',
          tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sesiones',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="program"
        options={{
          title: 'Programa',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{ href: null, title: 'Registro', tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  )
}
