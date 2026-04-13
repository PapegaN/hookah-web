<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const appDataStore = useAppDataStore()

const bootstrappedForUserId = ref<string | null>(null)

const roleLabels = {
  admin: 'Администратор',
  hookah_master: 'Кальянный мастер',
  client: 'Клиент',
}

const navigationItems = computed(() => {
  const sharedItems = [{ name: 'Обзор', to: '/' }]

  switch (sessionStore.currentUser?.role) {
    case 'admin':
      return [
        ...sharedItems,
        { name: 'Пользователи', to: '/admin/users' },
        { name: 'Справочники', to: '/admin/references' },
        { name: 'Заказы', to: '/staff/orders' },
      ]
    case 'hookah_master':
      return [...sharedItems, { name: 'Заказы', to: '/staff/orders' }]
    case 'client':
      return [
        ...sharedItems,
        { name: 'Новый заказ', to: '/client/order/new' },
        { name: 'Статус', to: '/client/order/status' },
      ]
    default:
      return []
  }
})

const currentRoleLabel = computed(() =>
  sessionStore.currentUser ? roleLabels[sessionStore.currentUser.role] : '',
)

const isAuthRoute = computed(() => route.name === 'auth')

const isLoadingSession = computed(
  () => sessionStore.isAuthenticated && appDataStore.isBootstrapping && !isAuthRoute.value,
)

watch(
  () => [sessionStore.accessToken, sessionStore.currentUser?.id, sessionStore.isInitialized] as const,
  async ([accessToken, userId, isInitialized]) => {
    if (!isInitialized) {
      sessionStore.hydrateFromStorage()
      return
    }

    if (!accessToken || !userId) {
      appDataStore.reset()
      bootstrappedForUserId.value = null
      return
    }

    if (bootstrappedForUserId.value === userId) {
      return
    }

    try {
      await sessionStore.syncProfile()

      if (!sessionStore.accessToken || !sessionStore.currentUser) {
        return
      }

      await appDataStore.bootstrap(sessionStore.accessToken, sessionStore.currentUser)
      bootstrappedForUserId.value = sessionStore.currentUser.id
    } catch {
      sessionStore.logout()
      appDataStore.reset()
      bootstrappedForUserId.value = null

      if (route.meta.requiresAuth !== false) {
        await router.push('/auth')
      }
    }
  },
  { immediate: true },
)

async function handleLogout() {
  sessionStore.logout()
  appDataStore.reset()
  bootstrappedForUserId.value = null
  await router.push('/auth')
}
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--auth': isAuthRoute }">
    <header class="topbar">
      <div class="topbar__content">
        <p class="eyebrow">Hookah Lounge Control</p>
        <h1>Адаптивная панель кальянной</h1>
        <p class="section-copy">
          Управление пользователями, справочниками и заказами в одном интерфейсе.
        </p>
      </div>

      <nav
        v-if="navigationItems.length > 0"
        class="navigation"
        aria-label="Основная навигация"
      >
        <RouterLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="navigation__link"
        >
          {{ item.name }}
        </RouterLink>
      </nav>

      <div v-if="sessionStore.currentUser" class="topbar__meta">
        <span class="pill">{{ currentRoleLabel }}</span>
        <span class="pill pill--muted">{{ sessionStore.currentUser.login }}</span>
        <button class="button button--ghost" type="button" @click="handleLogout">
          Выйти
        </button>
      </div>
    </header>

    <main class="content">
      <section
        v-if="appDataStore.errorMessage && !isAuthRoute"
        class="status-banner status-banner--error"
      >
        <strong>Не удалось загрузить данные панели.</strong>
        <p>{{ appDataStore.errorMessage }}</p>
      </section>

      <section v-if="isLoadingSession" class="panel status-banner">
        <p class="section-label">Sync</p>
        <h2>Загружаем роли, справочники и очередь заказов</h2>
        <p class="section-copy">
          После синхронизации откроется рабочая зона для вашей роли.
        </p>
      </section>

      <RouterView v-else />
    </main>
  </div>
</template>
