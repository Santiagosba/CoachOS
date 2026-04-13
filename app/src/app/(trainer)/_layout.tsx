import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function TrainerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 14,
          height: 86,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: 'rgba(248, 252, 255, 0.9)',
          borderTopColor: 'rgba(255,255,255,0.55)',
          borderTopWidth: 1,
          borderRadius: 28,
          shadowColor: '#081526',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 18,
        },
        tabBarActiveTintColor: '#0f4c81',
        tabBarInactiveTintColor: '#6f8498',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
          marginTop: 2,
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
      <Tabs.Screen
        name="clients/[id]"
        options={{ href: null, title: 'Cliente', tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="programs/new"
        options={{ href: null, title: 'Nueva plantilla', tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="programs/[id]/index"
        options={{ href: null, title: 'Programa asignado', tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="programs/[id]/day/[dayId]"
        options={{ href: null, title: 'Día de entrenamiento', tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="programs/template/[id]/index"
        options={{ href: null, title: 'Plantilla', tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="programs/template/[id]/day/[dayId]"
        options={{ href: null, title: 'Día de plantilla', tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  )
}
