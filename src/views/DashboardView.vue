<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()

const statusLabels: Record<'planned' | 'in-progress' | 'ready', string> = {
  planned: 'Запланировано',
  'in-progress': 'В работе',
  ready: 'Готово к реализации',
}
</script>

<template>
  <section class="hero-card">
    <div>
      <p class="section-label">Архитектурный прогресс</p>
      <h2>Фронтенд готов к росту от демо до полноценной панели смены</h2>
      <p class="section-copy">
        Мы уже заложили маршруты, типизированное состояние и понятное разделение на контуры
        каталога, склада и заказов.
      </p>
    </div>

    <div class="hero-card__badge">
      <span>{{ dashboardStore.readyTasks }}</span>
      <p>сценарий уже можно переводить в UI-детализацию</p>
    </div>
  </section>

  <section class="grid">
    <article v-for="metric in dashboardStore.metrics" :key="metric.id" class="metric-card">
      <p class="section-label">{{ metric.label }}</p>
      <strong>{{ metric.value }}</strong>
      <span>{{ metric.hint }}</span>
    </article>
  </section>

  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Ближайшие задачи</p>
        <h3>Что следующим шагом усиливает проект</h3>
      </div>
    </div>

    <div class="task-list">
      <article v-for="task in dashboardStore.tasks" :key="task.id" class="task-card">
        <p class="task-card__status">{{ statusLabels[task.status] }}</p>
        <h4>{{ task.title }}</h4>
        <p>{{ task.description }}</p>
      </article>
    </div>
  </section>
</template>
