import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError, api } from '@/lib/api'
import type { AppUser, DemoAccountsResponse } from '@/types/app'

const SESSION_STORAGE_KEY = 'hookah-session'

interface PersistedSession {
  accessToken: string
  currentUser: AppUser
}

export const useSessionStore = defineStore('session', () => {
  const accessToken = ref<string | null>(null)
  const currentUser = ref<AppUser | null>(null)
  const isInitialized = ref(false)
  const isSubmitting = ref(false)
  const errorMessage = ref<string | null>(null)
  const demoAccounts = ref<DemoAccountsResponse | null>(null)

  const isAuthenticated = computed(() => Boolean(accessToken.value && currentUser.value))

  function hydrateFromStorage() {
    if (isInitialized.value) {
      return
    }

    const rawValue = localStorage.getItem(SESSION_STORAGE_KEY)

    if (!rawValue) {
      isInitialized.value = true
      return
    }

    try {
      const persisted = JSON.parse(rawValue) as PersistedSession
      accessToken.value = persisted.accessToken
      currentUser.value = persisted.currentUser
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    } finally {
      isInitialized.value = true
    }
  }

  async function loadDemoAccounts() {
    demoAccounts.value = await api.getDemoAccounts()
  }

  async function login(payload: { login: string; password: string }) {
    isSubmitting.value = true
    errorMessage.value = null

    try {
      const response = await api.login(payload)
      setSession(response.accessToken, response.user)
    } catch (error) {
      errorMessage.value =
        error instanceof ApiError ? 'Не удалось войти. Проверь логин и пароль.' : 'Ошибка входа'
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  async function register(payload: {
    login: string
    password: string
    email?: string
    telegramUsername?: string
  }) {
    isSubmitting.value = true
    errorMessage.value = null

    try {
      const response = await api.register(payload)
      setSession(response.accessToken, response.user)
    } catch (error) {
      errorMessage.value =
        error instanceof ApiError ? 'Не удалось зарегистрироваться.' : 'Ошибка регистрации'
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  async function syncProfile() {
    if (!accessToken.value) {
      return
    }

    currentUser.value = await api.me(accessToken.value)
    persistSession()
  }

  function logout() {
    accessToken.value = null
    currentUser.value = null
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  function setSession(token: string, user: AppUser) {
    accessToken.value = token
    currentUser.value = user
    persistSession()
  }

  function persistSession() {
    if (!accessToken.value || !currentUser.value) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }

    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: accessToken.value,
        currentUser: currentUser.value,
      } satisfies PersistedSession),
    )
  }

  return {
    accessToken,
    currentUser,
    isInitialized,
    isSubmitting,
    errorMessage,
    demoAccounts,
    isAuthenticated,
    hydrateFromStorage,
    loadDemoAccounts,
    login,
    register,
    syncProfile,
    logout,
  }
})
