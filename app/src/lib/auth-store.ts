import { create } from 'zustand'
import { api } from './api'
import { deleteSessionItem, getSessionItem, setSessionItem } from './session-storage'

interface User {
  id: string
  name: string
  email: string
  role: 'TRAINER' | 'CLIENT' | 'ADMIN'
}

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  registerTrainer: (firstName: string, lastName: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    await setSessionItem('token', data.token)
    await setSessionItem('user', JSON.stringify(data.user))
    set({ user: data.user, token: data.token })
  },

  registerTrainer: async (firstName, lastName, email, password) => {
    const { data } = await api.post('/auth/register', {
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email,
      password,
      role: 'TRAINER',
    })
    await setSessionItem('token', data.token)
    await setSessionItem('user', JSON.stringify(data.user))
    set({ user: data.user, token: data.token })
  },

  logout: async () => {
    await deleteSessionItem('token')
    await deleteSessionItem('user')
    set({ user: null, token: null })
  },

  loadSession: async () => {
    const token = await getSessionItem('token')
    const raw = await getSessionItem('user')
    if (token && raw) {
      set({ token, user: JSON.parse(raw) })
    }
  },
}))
