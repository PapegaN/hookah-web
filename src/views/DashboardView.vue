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
    hint: 'Администратору доступно редактирование ролей и контактов.',
  },
  {
    id: 'tobaccos',
    label: 'Табаки',
    value: `${appDataStore.references.tobaccos.length}`,
    hint: 'Справочник вкусов доступен в админке и конструкторе заказа.',
  },
  {
    id: 'orders',
    label: 'Заказы',
    value: `${appDataStore.orders.length}`,
    hint: 'Список автоматически отфильтрован по роли текущего пользователя.',
  },
])

const roleTasks = computed(() => {
  switch (sessionStore.currentUser?.role) {
    case 'admin':
      return [
        'Проверить роли и доступы пользователей.',
        'Поддерживать актуальность справочников табака и оборудования.',
        'Контролировать поток заказов и качество закрытия смены.',
      ]
    case 'hookah_master':
      return [
        'Открыть рабочий борд заказов.',
        'Взять новый заказ в работу и описать фактическую забивку.',
        'Отдать готовый заказ клиенту и освободить очередь.',
      ]
    case 'client':
      return [
        'Собрать заказ из палитры вкусов.',
        'Следить за текущим статусом исполнения.',
        'После выдачи оставить оценку и текстовый отзыв.',
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
        Один интерфейс уже работает как стартовая full-stack витрина: роли, регистрация,
        административные справочники и сценарий заказа от клиента до мастера.
      </p>
    </div>

    <div class="hero-card__badge">
      <span>{{ appDataStore.orders.length }}</span>
      <p>заказов доступно в текущей зоне ответственности</p>
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
        <h3>Что сейчас доступно в MVP</h3>
      </div>
    </div>

    <div class="task-list">
      <article v-for="task in roleTasks" :key="task" class="task-card">
        <p class="task-card__status">{{ roleTitle }}</p>
        <h4>{{ task }}</h4>
        <p>Экран и действия уже связаны с backend-API и ролью текущего пользователя.</p>
      </article>
    </div>
  </section>
</template>
