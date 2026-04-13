import axios from 'axios'
import { getSessionItem } from './session-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const token = await getSessionItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
