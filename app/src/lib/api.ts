import axios from 'axios'
import { getSessionItem } from './session-storage'

const PRODUCTION_API_URL = 'https://coachos-production-dfbb.up.railway.app'

function resolveApiUrl() {
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim()
  if (envApiUrl) return envApiUrl

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000'
    }
  }

  return PRODUCTION_API_URL
}

const API_URL = resolveApiUrl()

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const token = await getSessionItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
