import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { DashboardMetric, DashboardTask } from '@/types/dashboard'

const initialMetrics: DashboardMetric[] = [
  {
    id: 'catalog',
    label: 'Каталог табака',
    value: '48 SKU',
    hint: 'Базовый ориентир для первой демо-версии каталога.',
  },
  {
    id: 'inventory',
    label: 'Учет остатков',
    value: '12 активных партий',
    hint: 'Покажем движение табака по партиям и доступный вес.',
  },
  {
    id: 'orders',
    label: 'Заказы',
    value: '3 статуса',
    hint: 'Новая, в работе, завершена — минимальный жизненный цикл заказа.',
  },
]

const initialTasks: DashboardTask[] = [
  {
    id: 'api-contract',
    title: 'Согласовать API-контракт каталога',
    description: 'Подготовить DTO для брендов, линеек и вкусов.',
    status: 'in-progress',
  },
  {
    id: 'inventory-balance',
    title: 'Спроектировать модель складских движений',
    description: 'Заложить приход, списание и использование табака в заказе.',
    status: 'planned',
  },
  {
    id: 'orders-flow',
    title: 'Собрать маршрут оформления заказа',
    description: 'Подготовить экран заказа как следующий пользовательский сценарий.',
    status: 'ready',
  },
]

export const useDashboardStore = defineStore('dashboard', () => {
  const metrics = ref<DashboardMetric[]>(initialMetrics)
  const tasks = ref<DashboardTask[]>(initialTasks)

  const readyTasks = computed(() => tasks.value.filter((task) => task.status === 'ready').length)

  return {
    metrics,
    tasks,
    readyTasks,
  }
})
