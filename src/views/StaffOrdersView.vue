<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAppDataStore } from '@/stores/app-data'
import { formatDateTime } from '@/utils/date'

type StaffOrderTab = 'new' | 'current' | 'completed'

const router = useRouter()
const appDataStore = useAppDataStore()
const activeTab = ref<StaffOrderTab>('new')

const tabItems = computed(() => [
  {
    key: 'new' as const,
    label: 'Новые',
    count: appDataStore.orders.filter((order) => order.status === 'new').length,
  },
  {
    key: 'current' as const,
    label: 'Текущие',
    count: appDataStore.orders.filter((order) =>
      order.status === 'in_progress' || order.status === 'ready_for_feedback',
    ).length,
  },
  {
    key: 'completed' as const,
    label: 'Завершённые',
    count: appDataStore.orders.filter((order) => order.status === 'rated').length,
  },
])

const visibleOrders = computed(() => {
  switch (activeTab.value) {
    case 'new':
      return appDataStore.orders.filter((order) => order.status === 'new')
    case 'current':
      return appDataStore.orders.filter(
        (order) => order.status === 'in_progress' || order.status === 'ready_for_feedback',
      )
    case 'completed':
      return appDataStore.orders.filter((order) => order.status === 'rated')
    default:
      return []
  }
})

function openOrder(orderId: string) {
  void router.push(`/staff/orders/${orderId}`)
}
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Staff board</p>
        <h2>Рабочая доска заказов</h2>
      </div>
      <span class="pill">{{ appDataStore.orders.length }} заказов в системе</span>
    </div>

    <p class="section-copy">
      Доска разбита по статусам. Новые заказы ждут реакции команды, текущие показывают активную
      работу и сбор отзывов, завершённые помогают быстро вернуться к истории по столу.
    </p>

    <div class="tab-row">
      <button
        v-for="tab in tabItems"
        :key="tab.key"
        class="tab-row__button"
        :class="{ 'tab-row__button--active': activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >
        {{ tab.label }} · {{ tab.count }}
      </button>
    </div>
  </section>

  <div v-if="visibleOrders.length > 0" class="task-list">
    <article v-for="order in visibleOrders" :key="order.id" class="task-card">
      <div class="editor-card__header">
        <div>
          <p class="section-label">{{ order.tableLabel }}</p>
          <h3>{{ order.participants.length }} гостей за столом</h3>
        </div>
        <span class="pill">{{ order.status }}</span>
      </div>

      <p class="section-copy">
        Создан: {{ formatDateTime(order.createdAt) }}.
        <template v-if="order.deliveredAt">
          Отдан: {{ formatDateTime(order.deliveredAt) }}.
        </template>
      </p>

      <div class="pill-row">
        <span class="pill">Запросов: {{ order.requestedTobaccos.length }}</span>
        <span class="pill">Отзывов: {{ order.feedbacks.length }}</span>
        <span class="pill">
          Подтверждено гостей:
          {{ order.participants.filter((participant) => participant.tableApprovalStatus === 'approved').length }}
        </span>
      </div>

      <p class="section-copy">
        {{ order.participants.map((participant) => participant.client.login).join(', ') }}
      </p>

      <button class="button button--primary" type="button" @click="openOrder(order.id)">
        Открыть заказ
      </button>
    </article>
  </div>

  <section v-else class="panel">
    <p class="section-label">Empty state</p>
    <h3>В этой вкладке пока нет заказов</h3>
    <p class="section-copy">
      Как только появится заказ с выбранным статусом, он сразу окажется здесь.
    </p>
  </section>
</template>
