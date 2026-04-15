<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const appDataStore = useAppDataStore()

const bootstrappedForUserId = ref<string | null>(null)
const isMobileNavigationOpen = ref(false)

const roleLabels = {
  admin: 'Администратор',
  hookah_master: 'Кальянный мастер',
  client: 'Клиент',
}

const navigationItems = computed(() => {
  if (!sessionStore.currentUser) {
    return [
      { name: 'Форум', to: '/forum' },
      { name: 'Войти', to: '/auth' },
    ]
  }

  if (sessionStore.currentUser?.isApproved === false) {
    return [{ name: 'Ожидание доступа', to: '/pending-approval' }]
  }

  const sharedItems = [
    { name: 'Форум', to: '/forum' },
    { name: 'Обзор', to: '/workspace' },
  ]

  switch (sessionStore.currentUser?.role) {
    case 'admin':
      return [
        ...sharedItems,
        { name: 'Пользователи', to: '/admin/users' },
        { name: 'Справочники', to: '/admin/references' },
        { name: 'Сканер', to: '/staff/marking' },
        { name: 'Заказы', to: '/staff/orders' },
        { name: 'Настройки', to: '/admin/settings' },
      ]
    case 'hookah_master':
      return [
        ...sharedItems,
        { name: 'Сканер', to: '/staff/marking' },
        { name: 'Заказы', to: '/staff/orders' },
      ]
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

const shouldShowMobileMenuButton = computed(
  () => !isAuthRoute.value && navigationItems.value.length > 0,
)

watch(
  () =>
    [
      sessionStore.accessToken,
      sessionStore.currentUser?.id,
      sessionStore.currentUser?.isApproved,
      sessionStore.isInitialized,
    ] as const,
  async ([accessToken, userId, isApproved, isInitialized]) => {
    if (!isInitialized) {
      sessionStore.hydrateFromStorage()
      return
    }

    if (!accessToken || !userId) {
      appDataStore.reset()
      bootstrappedForUserId.value = null
      return
    }

    if (bootstrappedForUserId.value === userId && isApproved) {
      return
    }

    try {
      await sessionStore.syncProfile()

      if (!sessionStore.accessToken || !sessionStore.currentUser) {
        return
      }

      if (!sessionStore.currentUser.isApproved) {
        appDataStore.reset()
        bootstrappedForUserId.value = null
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

watch(
  () =>
    [
      sessionStore.accessToken,
      sessionStore.currentUser?.id,
      sessionStore.currentUser?.role,
      sessionStore.currentUser?.isApproved,
      bootstrappedForUserId.value,
    ] as const,
  ([accessToken, userId, role, isApproved, bootstrappedUserId], _previous, onCleanup) => {
    if (!accessToken || !userId || !role || !isApproved || bootstrappedUserId !== userId) {
      return
    }

    let isRefreshing = false

    const refresh = async () => {
      if (!sessionStore.currentUser || isRefreshing) {
        return
      }

      isRefreshing = true

      try {
        await appDataStore.refreshOrders(accessToken, sessionStore.currentUser, {
          notify: role !== 'client',
        })
      } catch {
        return
      } finally {
        isRefreshing = false
      }
    }

    void refresh()

    const intervalId = window.setInterval(() => {
      void refresh()
    }, 10000)

    onCleanup(() => {
      window.clearInterval(intervalId)
    })
  },
  { immediate: true },
)

watch(
  () => route.fullPath,
  () => {
    closeMobileNavigation()
  },
)

watch(isMobileNavigationOpen, (isOpen) => {
  if (typeof document === 'undefined') {
    return
  }

  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

function openMobileNavigation() {
  isMobileNavigationOpen.value = true
}

function closeMobileNavigation() {
  isMobileNavigationOpen.value = false
}

async function handleLogout() {
  sessionStore.logout()
  appDataStore.reset()
  bootstrappedForUserId.value = null
  closeMobileNavigation()
  await router.push('/auth')
}

async function openNotification(orderId: string, notificationId: string) {
  if (sessionStore.accessToken) {
    try {
      await appDataStore.refreshOrder(sessionStore.accessToken, orderId)
    } catch {
      // Даже если заказ временно не удалось обновить, всё равно даём перейти в карточку.
    }
  }

  appDataStore.dismissNotification(notificationId)
  await router.push(`/staff/orders/${orderId}`)
}
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--auth': isAuthRoute }">
    <aside
      v-if="appDataStore.staffNotifications.length > 0 && !isAuthRoute"
      class="notification-stack"
      aria-label="Новые заказы"
    >
      <button
        v-for="notification in appDataStore.staffNotifications"
        :key="notification.id"
        class="notification-card"
        type="button"
        @click="openNotification(notification.orderId, notification.id)"
      >
        <div class="notification-card__header">
          <div>
            <p class="section-label">{{ notification.title }}</p>
            <h3>{{ notification.tableLabel }}</h3>
          </div>
          <span class="pill pill--muted">{{ formatDateTime(notification.createdAt) }}</span>
        </div>
        <p>{{ notification.message }}</p>
      </button>
    </aside>

    <div
      v-if="isMobileNavigationOpen && shouldShowMobileMenuButton"
      class="app-backdrop"
      aria-hidden="true"
      @click="closeMobileNavigation"
    />

    <header class="topbar">
      <div class="topbar__header">
        <div class="topbar__content">
          <p class="eyebrow">Hookah Lounge Control</p>
          <h1>Адаптивная панель кальянной</h1>
          <p class="section-copy">
            Управление пользователями, справочниками, заказами и быстрым добавлением табака в одном интерфейсе.
          </p>
        </div>

        <div class="topbar__actions">
          <div v-if="sessionStore.currentUser" class="topbar__meta topbar__meta--desktop">
            <span class="pill">{{ currentRoleLabel }}</span>
            <span v-if="sessionStore.currentUser.isApproved === false" class="pill pill--muted">
              Ожидает апрув
            </span>
            <span class="pill pill--muted">{{ sessionStore.currentUser.login }}</span>
            <button class="button button--ghost" type="button" @click="handleLogout">Выйти</button>
          </div>

          <button
            v-if="shouldShowMobileMenuButton"
            class="button button--ghost mobile-menu-button"
            type="button"
            :aria-expanded="isMobileNavigationOpen"
            aria-controls="mobile-navigation"
            @click="openMobileNavigation"
          >
            Меню
          </button>
        </div>
      </div>

      <nav
        v-if="navigationItems.length > 0"
        class="navigation navigation--desktop"
        aria-label="Основная навигация"
      >
        <RouterLink v-for="item in navigationItems" :key="item.to" :to="item.to" class="navigation__link">
          {{ item.name }}
        </RouterLink>
      </nav>
    </header>

    <aside
      v-if="shouldShowMobileMenuButton"
      id="mobile-navigation"
      class="navigation-drawer"
      :class="{ 'navigation-drawer--open': isMobileNavigationOpen }"
      aria-label="Мобильная навигация"
    >
      <div class="navigation-drawer__header">
        <div>
          <p class="section-label">Навигация</p>
          <h2>Рабочее меню</h2>
        </div>
        <button class="button button--ghost" type="button" @click="closeMobileNavigation">
          Закрыть
        </button>
      </div>

      <div v-if="sessionStore.currentUser" class="navigation-drawer__meta">
        <span class="pill">{{ currentRoleLabel }}</span>
        <span class="pill pill--muted">{{ sessionStore.currentUser.login }}</span>
      </div>

      <nav class="navigation navigation--drawer">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="navigation__link navigation__link--drawer"
          @click="closeMobileNavigation"
        >
          {{ item.name }}
        </RouterLink>
      </nav>

      <div v-if="sessionStore.currentUser" class="navigation-drawer__footer">
        <button class="button button--primary" type="button" @click="handleLogout">Выйти из аккаунта</button>
      </div>
    </aside>

    <main class="content">
      <section
        v-if="appDataStore.errorMessage && !isAuthRoute"
        class="status-banner status-banner--error"
      >
        <strong>Не удалось загрузить данные панели.</strong>
        <p>{{ appDataStore.errorMessage }}</p>
      </section>

      <section v-if="isLoadingSession" class="panel status-banner">
        <p class="section-label">Синхронизация</p>
        <h2>Загружаем роли, справочники и очередь заказов</h2>
        <p class="section-copy">
          После синхронизации откроется рабочая зона для вашей роли.
        </p>
      </section>

      <RouterView v-else />
    </main>
  </div>
</template>
