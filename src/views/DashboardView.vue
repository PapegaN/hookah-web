<script setup lang="ts">
import { computed } from 'vue'

import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'

const appDataStore = useAppDataStore()
const sessionStore = useSessionStore()

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
    hint: 'Администратор видит роли, статусы апрува и контакты.',
  },
  {
    id: 'tobaccos',
    label: 'Табаки',
    value: `${appDataStore.references.tobaccos.length}`,
    hint: 'Бренды и вкусы редактируются во вкладках с таблицами и модалками.',
  },
  {
    id: 'orders',
    label: 'Заказы',
    value: `${appDataStore.orders.length}`,
    hint: 'Заказы разделены по столам и объединяют сразу нескольких гостей.',
  },
])

const roleTasks = computed(() => {
  switch (sessionStore.currentUser?.role) {
    case 'admin':
      return [
        'Подтверждать регистрации и открывать доступ новым пользователям.',
        'Держать справочники табака и оборудования в аккуратном состоянии.',
        'Контролировать историю заказов, статусы и отзывы по каждому столу.',
      ]
    case 'hookah_master':
      return [
        'Забирать новые заказы со стола через удобные вкладки и уведомления.',
        'Подтверждать гостей за столом перед работой с заказом.',
        'Фиксировать фактическую забивку и отдавать заказ в клиентский статус.',
      ]
    case 'client':
      return [
        'После апрува выбрать стол и собрать заказ из палитры вкусов.',
        'Следить за подтверждением своего места за столом и ходом заказа.',
        'После отдачи поставить оценку и оставить осознанный отзыв.',
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
      <h2>{{ roleTitle }} в Hookah Lounge Control</h2>
      <p class="section-copy">
        Панель уже работает как полноценный demo-контур: регистрация с апрувом, табличные
        справочники, заказы по столам, подтверждение гостей и отзывы после выдачи.
      </p>
    </div>

    <div class="hero-card__badge">
      <span>{{ appDataStore.orders.length }}</span>
      <p>заказов сейчас видно в вашей зоне ответственности</p>
    </div>
  </section>

  <div class="task-list">
    <article v-for="fact in quickFacts" :key="fact.id" class="task-card">
      <p class="task-card__status">{{ fact.label }}</p>
      <h3>{{ fact.value }}</h3>
      <p>{{ fact.hint }}</p>
    </article>
  </div>

  <section class="panel">
    <div class="panel__header panel__header--compact-mobile">
      <div>
        <p class="section-label">Следующие действия</p>
        <h3>Что доступно прямо сейчас</h3>
      </div>
    </div>

    <div class="task-list">
      <article v-for="task in roleTasks" :key="task" class="task-card">
        <p class="task-card__status">{{ roleTitle }}</p>
        <h4>{{ task }}</h4>
        <p>Экран уже связан с role-based API и общим состоянием панели.</p>
      </article>
    </div>
  </section>
</template>
