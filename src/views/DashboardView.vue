<script setup lang="ts">
import { computed } from 'vue'

import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()
const appDataStore = useAppDataStore()

const roleTitle = computed(() => {
  switch (sessionStore.currentUser?.role) {
    case 'admin':
      return 'Администратор'
    case 'hookah_master':
      return 'Кальянный мастер'
    case 'client':
      return 'Клиент'
    default:
      return 'Пользователь'
  }
})

const quickFacts = computed(() => [
  {
    id: 'users',
    label: 'Пользователи',
    value: `${appDataStore.users.length}`,
    hint: 'Администратор видит список ролей, контактов и доступов.',
  },
  {
    id: 'tobaccos',
    label: 'Табаки',
    value: `${appDataStore.references.tobaccos.length}`,
    hint: 'Справочник редактируется во вкладках с таблицами и модальными формами.',
  },
  {
    id: 'orders',
    label: 'Заказы',
    value: `${appDataStore.orders.length}`,
    hint: 'Теперь заказ привязан к столу и может включать сразу несколько клиентов.',
  },
])

const roleTasks = computed(() => {
  switch (sessionStore.currentUser?.role) {
    case 'admin':
      return [
        'Поддерживать пользователей, роли и табличные справочники в актуальном состоянии.',
        'Следить за уведомлениями о новых заказах и быстро переводить стол в работу.',
        'Контролировать историю статусов и отзывы по каждому столу.',
      ]
    case 'hookah_master':
      return [
        'Забирать новые заказы со стола из всплывающих уведомлений.',
        'Вносить фактическую забивку и комментарий мастера перед выдачей.',
        'Отслеживать, кто из гостей уже оставил отзыв после отдачи заказа.',
      ]
    case 'client':
      return [
        'Выбрать стол и присоединиться к общей забивке со своими пожеланиями.',
        'Следить за временем заказа, отдачи и историей изменений по столу.',
        'После выдачи оставить личную оценку и отзыв.',
      ]
    default:
      return []
  }
})
</script>

<template>
  <section class="hero-card">
    <div>
      <p class="section-label">Role workspace</p>
      <h2>{{ roleTitle }} в панели Hookah Lounge Control</h2>
      <p class="section-copy">
        Панель уже работает как demo full-stack контур: роли, регистрация, табличные
        справочники, заказы по столам, история статусов и персональные отзывы гостей.
      </p>
    </div>

    <div class="hero-card__badge">
      <span>{{ appDataStore.orders.length }}</span>
      <p>заказов сейчас видно в текущей зоне ответственности</p>
    </div>
  </section>

  <section class="grid">
    <article v-for="fact in quickFacts" :key="fact.id" class="metric-card">
      <p class="section-label">{{ fact.label }}</p>
      <strong>{{ fact.value }}</strong>
      <span>{{ fact.hint }}</span>
    </article>
  </section>

  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Следующие действия</p>
        <h3>Что доступно в текущем MVP</h3>
      </div>
    </div>

    <div class="task-list">
      <article v-for="task in roleTasks" :key="task" class="task-card">
        <p class="task-card__status">{{ roleTitle }}</p>
        <h4>{{ task }}</h4>
        <p>Экран уже связан с role-based API и общим состоянием заказов.</p>
      </article>
    </div>
  </section>
</template>
