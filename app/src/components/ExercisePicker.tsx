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
          <ActivityIndicator color="#5b9cf6" style={{ marginTop: 40 }} />
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
                <Ionicons name="add-circle" size={22} color="#5b9cf6" />
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
  container: { flex: 1, backgroundColor: '#060d1b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24 },
  title: { fontSize: 20, fontWeight: '700', color: 'rgba(240, 244, 255, 0.95)' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 16, borderRadius: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: 'rgba(240, 244, 255, 0.92)', fontSize: 16, paddingVertical: 12 },
  categoriesRow: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  categoryChip: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  categoryChipActive: { backgroundColor: 'rgba(91,156,246,0.18)', borderColor: 'rgba(91,156,246,0.35)' },
  categoryChipText: { color: 'rgba(160, 185, 230, 0.60)', fontSize: 12, fontWeight: '600' },
  categoryChipTextActive: { color: '#5b9cf6' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  exerciseName: { fontSize: 15, color: 'rgba(240, 244, 255, 0.90)', fontWeight: '500' },
  exerciseMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  muscle: { fontSize: 12, marginTop: 2 },
  metaPill: { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(160, 185, 230, 0.60)', fontSize: 11, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  empty: { color: 'rgba(160, 185, 230, 0.45)', textAlign: 'center', marginTop: 24 },
  createSection: { marginTop: 20, padding: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  createTitle: { color: 'rgba(160, 185, 230, 0.60)', fontSize: 13, marginBottom: 12, fontWeight: '600' },
  createInput: { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(240, 244, 255, 0.90)', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  createBtn: { backgroundColor: '#2b5fd9', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#3b72f5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 16 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
