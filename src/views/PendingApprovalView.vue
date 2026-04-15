<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useSessionStore } from '@/stores/session'
import { formatDateTime } from '@/utils/date'

const router = useRouter()
const sessionStore = useSessionStore()
const isRefreshing = ref(false)

let intervalId: number | undefined

function getApprovedRoute() {
  switch (sessionStore.currentUser?.role) {
    case 'admin':
      return '/admin/users'
    case 'hookah_master':
      return '/staff/orders'
    case 'client':
      return '/client/order/new'
    default:
      return '/workspace'
  }
}

async function refreshProfile() {
  if (!sessionStore.accessToken) {
    return
  }

  isRefreshing.value = true

  try {
    await sessionStore.syncProfile()

    if (sessionStore.currentUser?.isApproved) {
      await router.push(getApprovedRoute())
    }
  } finally {
    isRefreshing.value = false
  }
}

onMounted(() => {
  intervalId = window.setInterval(() => {
    void refreshProfile()
  }, 10000)
})

onUnmounted(() => {
  if (intervalId !== undefined) {
    window.clearInterval(intervalId)
  }
})
</script>

<template>
  <section class="hero-card">
    <div>
      <p class="section-label">Approval</p>
      <h2>Доступ ожидает подтверждения</h2>
      <p class="section-copy">
        Аккаунт создан, но администратор ещё не открыл доступ. Как только апрув появится,
        клиентская зона станет доступна автоматически.
      </p>
    </div>

    <div class="hero-card__badge">
      <span>{{ sessionStore.currentUser?.login }}</span>
      <p>статус доступа: ожидает подтверждения</p>
    </div>
  </section>

  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Что дальше</p>
        <h3>Пока команда подтверждает аккаунт</h3>
      </div>
      <button class="button button--primary" type="button" :disabled="isRefreshing" @click="refreshProfile">
        Проверить снова
      </button>
    </div>

    <div class="task-list">
      <article class="task-card">
        <p class="task-card__status">Аккаунт</p>
        <h4>Ожидает апрув администратора</h4>
        <p>Пользователь появляется в табличной панели управления и может быть подтверждён там.</p>
      </article>

      <article class="task-card">
        <p class="task-card__status">После апрува</p>
        <h4>Откроется клиентский сценарий заказа</h4>
        <p>Можно будет выбрать стол, собрать вкусы и отправить заказ в работу мастеру.</p>
      </article>

      <article class="task-card">
        <p class="task-card__status">Последнее обновление</p>
        <h4>{{ formatDateTime(sessionStore.currentUser?.updatedAt) }}</h4>
        <p>Страница сама перепроверяет профиль каждые 10 секунд.</p>
      </article>
    </div>
  </section>
</template>
