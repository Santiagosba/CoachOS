import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function AdminLayout() {
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
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trainers/index"
        options={{
          title: 'Entrenadores',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users/index"
        options={{
          title: 'Usuarios',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen
        name="trainers/[id]"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="users/[id]"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  )
}
