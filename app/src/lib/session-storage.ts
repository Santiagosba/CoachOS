import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

async function webGetItem(key: string) {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

async function webSetItem(key: string, value: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
}

async function webDeleteItem(key: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

export async function getSessionItem(key: string) {
  if (Platform.OS === 'web') return webGetItem(key)
  return SecureStore.getItemAsync(key)
}

export async function setSessionItem(key: string, value: string) {
  if (Platform.OS === 'web') return webSetItem(key, value)
  return SecureStore.setItemAsync(key, value)
}

export async function deleteSessionItem(key: string) {
  if (Platform.OS === 'web') return webDeleteItem(key)
  return SecureStore.deleteItemAsync(key)
}
