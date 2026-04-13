import { useState, useEffect, useCallback } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'

interface Exercise {
  id: string
  name: string
  muscleGroup?: string
  category?: string
  equipment?: string
}

interface Props {
  visible: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
}

export default function ExercisePicker({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [category, setCategory] = useState('')
  const [equipment, setEquipment] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [activeCategory, setActiveCategory] = useState('ALL')

  const CATEGORIES = [
    'ALL',
    'MACHINE',
    'BARBELL',
    'DUMBBELL',
    'POWERLIFTING',
    'CALISTHENICS',
    'BODYWEIGHT',
    'CARDIO',
    'MOBILITY',
    'OTHER',
  ]

  const search = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (activeCategory !== 'ALL') params.set('category', activeCategory)
      const { data } = await api.get(`/exercises?${params.toString()}`)
      setExercises(data)
      setShowCreate(q.length > 1 || activeCategory !== 'ALL')
    } finally {
      setLoading(false)
    }
  }, [activeCategory])

  useEffect(() => {
    if (visible) search('')
  }, [visible, search])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const resolvedCategory = category || (activeCategory !== 'ALL' ? activeCategory : undefined)
      const { data } = await api.post('/exercises', {
        name: newName.trim(),
        muscleGroup: muscleGroup.trim() || undefined,
        category: resolvedCategory,
        equipment: equipment.trim() || undefined,
      })
      onSelect(data)
      onClose()
    } finally {
      setCreating(false)
      setNewName('')
      setMuscleGroup('')
      setCategory('')
      setEquipment('')
    }
  }

  const MUSCLE_COLORS: Record<string, string> = {
    Pecho: '#dc2626',
    Espalda: '#2563eb',
    Hombros: '#7c3aed',
    Bíceps: '#d97706',
    Tríceps: '#059669',
    Piernas: '#0891b2',
    Core: '#64748b',
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Añadir ejercicio</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Búsqueda */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ejercicio..."
            placeholderTextColor="#475569"
            value={query}
            onChangeText={setQuery}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, activeCategory === item && styles.categoryChipActive]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[styles.categoryChipText, activeCategory === item && styles.categoryChipTextActive]}>
                {item === 'ALL' ? 'Todos' : formatCategory(item)}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Lista */}
        {loading ? (
          <ActivityIndicator color="#6366f1" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(e) => e.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, paddingTop: 8 }}
            ListEmptyComponent={
              !showCreate ? (
                <Text style={styles.empty}>Sin resultados</Text>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseRow}
                onPress={() => { onSelect(item); onClose() }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <View style={styles.exerciseMeta}>
                    {item.muscleGroup && (
                      <Text style={[styles.muscle, { color: MUSCLE_COLORS[item.muscleGroup] ?? '#64748b' }]}>
                        {item.muscleGroup}
                      </Text>
                    )}
                    {item.category && <Text style={styles.metaPill}>{formatCategory(item.category)}</Text>}
                    {item.equipment && <Text style={styles.metaPill}>{item.equipment}</Text>}
                  </View>
                </View>
                <Ionicons name="add-circle" size={22} color="#6366f1" />
              </TouchableOpacity>
            )}
            ListFooterComponent={
              showCreate ? (
                <View style={styles.createSection}>
                  <Text style={styles.createTitle}>Crear ejercicio personalizado</Text>
                  <TextInput
                    style={styles.createInput}
                    placeholder="Nombre del ejercicio"
                    placeholderTextColor="#475569"
                    value={newName || query}
                    onChangeText={setNewName}
                  />
                  <TextInput
                    style={styles.createInput}
                    placeholder="Grupo muscular (ej. Pecho, Espalda, Piernas)"
                    placeholderTextColor="#475569"
                    value={muscleGroup}
                    onChangeText={setMuscleGroup}
                  />
                  <TextInput
                    style={styles.createInput}
                    placeholder="Categoría (ej. CALISTHENICS, POWERLIFTING, MACHINE)"
                    placeholderTextColor="#475569"
                    value={category}
                    onChangeText={setCategory}
                  />
                  <TextInput
                    style={styles.createInput}
                    placeholder="Material / equipo (ej. Barra, Máquina smith, Anillas)"
                    placeholderTextColor="#475569"
                    value={equipment}
                    onChangeText={setEquipment}
                  />
                  <TouchableOpacity
                    style={styles.createBtn}
                    onPress={handleCreate}
                    disabled={creating}
                  >
                    {creating ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.createBtnText}>Crear ejercicio</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  )
}

function formatCategory(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#f8fafc' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 10, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 16, paddingVertical: 12 },
  categoriesRow: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  categoryChip: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  categoryChipActive: { backgroundColor: '#312e81', borderColor: '#4338ca' },
  categoryChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  categoryChipTextActive: { color: '#c7d2fe' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  exerciseName: { fontSize: 15, color: '#f8fafc', fontWeight: '500' },
  exerciseMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  muscle: { fontSize: 12, marginTop: 2 },
  metaPill: { backgroundColor: '#111827', color: '#94a3b8', fontSize: 11, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  empty: { color: '#475569', textAlign: 'center', marginTop: 24 },
  createSection: { marginTop: 20, padding: 16, backgroundColor: '#1e293b', borderRadius: 12 },
  createTitle: { color: '#94a3b8', fontSize: 13, marginBottom: 12 },
  createInput: { backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12 },
  createBtn: { backgroundColor: '#6366f1', borderRadius: 8, padding: 12, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
})
