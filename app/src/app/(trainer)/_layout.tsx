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

export default function TrainerLayout() {
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
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients/index"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar/index"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="programs/index"
        options={{
          title: 'Programas',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="clients/[id]" options={{ href: null, title: 'Cliente', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="programs/new" options={{ href: null, title: 'Nueva plantilla', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="programs/[id]/index" options={{ href: null, title: 'Programa asignado', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="programs/[id]/day/[dayId]" options={{ href: null, title: 'Día de entrenamiento', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="programs/template/[id]/index" options={{ href: null, title: 'Plantilla', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="programs/template/[id]/day/[dayId]" options={{ href: null, title: 'Día de plantilla', tabBarStyle: { display: 'none' } }} />
    </Tabs>
  )
}
