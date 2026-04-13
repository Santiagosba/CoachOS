import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import ScreenScaffold from '@/components/ScreenScaffold'
import AnimatedEntrance from '@/components/AnimatedEntrance'
import { glass } from '@/components/LiquidGlassBackground'
import { api } from '@/lib/api'

interface TemplateSummary {
  id: string
  name: string
  description?: string | null
  createdAt: string
  weeksCount: number
  daysCount: number
  exercisesCount: number
}

export default function ProgramsLibraryScreen() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async () => {
    try {
      setErrorMessage('')
      const { data } = await api.get('/program-templates')
      setTemplates(data)
    } catch (error: any) {
      setTemplates([])
      setErrorMessage(error?.response?.data?.error ?? 'No se pudo cargar la biblioteca')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    )
  }

  return (
    <ScreenScaffold
      eyebrow="Program Library"
      title="Programas"
      subtitle="Crea plantillas reutilizables y asígnalas a cualquier cliente cuando te convenga."
      headerAction={
        <TouchableOpacity
          style={[glass.pill, styles.addButton]}
          onPress={() => router.push('/(trainer)/programs/new')}
        >
          <Ionicons name="add" size={16} color="#113b7a" />
          <Text style={styles.addButtonText}>Nueva plantilla</Text>
        </TouchableOpacity>
      }
      scroll={false}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#113b7a" />}
      >
        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {templates.length === 0 && (
          <View style={[glass.card, styles.emptyCard]}>
            <Ionicons name="albums-outline" size={40} color="#334155" />
            <Text style={styles.emptyTitle}>Sin plantillas todavía</Text>
            <Text style={styles.emptySub}>
              Crea tu primera plantilla para reutilizarla con distintos clientes.
            </Text>
          </View>
        )}

        {templates.map((template, index) => (
          <AnimatedEntrance key={template.id} delay={80 + index * 40}>
            <TouchableOpacity
              style={[glass.card, styles.card]}
              onPress={() =>
                router.push({
                  pathname: '/(trainer)/programs/template/[id]',
                  params: { id: template.id },
                })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{template.name}</Text>
                <Ionicons name="chevron-forward" size={18} color="#64748b" />
              </View>
              {template.description ? <Text style={styles.cardDescription}>{template.description}</Text> : null}
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{template.weeksCount} semanas</Text>
                <Text style={styles.metaText}>{template.daysCount} días</Text>
                <Text style={styles.metaText}>{template.exercisesCount} ejercicios</Text>
              </View>
            </TouchableOpacity>
          </AnimatedEntrance>
        ))}
      </ScrollView>
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  addButtonText: { color: '#113b7a', fontSize: 13, fontWeight: '800' },
  content: { paddingBottom: 120 },
  errorText: { color: '#9f1239', fontSize: 13, marginBottom: 12 },
  emptyCard: { alignItems: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#2c4560' },
  emptySub: { fontSize: 14, color: '#5d6f85', textAlign: 'center' },
  card: { padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitle: { color: '#10213a', fontSize: 17, fontWeight: '800', flex: 1 },
  cardDescription: { color: '#5d6f85', fontSize: 14, marginTop: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metaText: { color: '#40556e', fontSize: 12, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.42)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
})
