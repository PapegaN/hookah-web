<script setup lang="ts">
import { computed, reactive } from 'vue'

import TobaccoPicker from '@/components/TobaccoPicker.vue'
import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'

const appDataStore = useAppDataStore()
const sessionStore = useSessionStore()

const orderDrafts = reactive<
  Record<
    string,
    {
      selectedIds: string[]
      packingComment: string
    }
  >
>({})

const visibleOrders = computed(() => appDataStore.orders)

function getDraft(orderId: string) {
  if (!orderDrafts[orderId]) {
    orderDrafts[orderId] = {
      selectedIds: [],
      packingComment: '',
    }
  }

  return orderDrafts[orderId]
}

async function takeOrder(orderId: string) {
  if (!sessionStore.accessToken) {
    return
  }

  await appDataStore.startOrder(sessionStore.accessToken, orderId)
}

async function fulfillOrder(orderId: string) {
  if (!sessionStore.accessToken) {
    return
  }

  const draft = getDraft(orderId)

  await appDataStore.fulfillOrder(sessionStore.accessToken, orderId, {
    actualTobaccoIds: draft.selectedIds,
    packingComment: draft.packingComment,
  })
}
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Staff board</p>
        <h2>Заказы для администратора и мастера</h2>
      </div>
      <p class="section-copy">
        Здесь видно, что запросил клиент, кто взял заказ в работу и какую фактическую забивку
        отдал мастер.
      </p>
    </div>

    <div class="stack">
      <article v-for="order in visibleOrders" :key="order.id" class="editor-card">
        <div class="editor-card__header">
          <div>
            <p class="section-label">Order {{ order.id.slice(0, 8) }}</p>
            <h3>{{ order.client.login }}</h3>
          </div>
          <span class="pill">{{ order.status }}</span>
        </div>

        <div class="task-list">
          <article class="task-card">
            <p class="task-card__status">Клиент просил</p>
            <h4>Описание заказа</h4>
            <p>{{ order.description }}</p>
            <div class="pill-row">
              <span
                v-for="tobacco in order.requestedTobaccos"
                :key="tobacco.id"
                class="pill"
              >
                {{ tobacco.brand }} / {{ tobacco.flavorName }}
              </span>
            </div>
          </article>

          <article class="task-card">
            <p class="task-card__status">Текущий исполнитель</p>
            <h4>{{ order.acceptedBy?.login ?? 'Еще не назначен' }}</h4>
            <p>
              <template v-if="order.status === 'ready_for_feedback' || order.status === 'rated'">
                Заказ уже отдан клиенту.
              </template>
              <template v-else>Можно взять заказ в работу или заполнить забивку.</template>
            </p>
          </article>
        </div>

        <button
          v-if="order.status === 'new'"
          class="button button--secondary"
          type="button"
          @click="takeOrder(order.id)"
        >
          Взять в работу
        </button>

        <div v-if="order.status === 'new' || order.status === 'in_progress'" class="stack">
          <TobaccoPicker
            v-model:selected-ids="getDraft(order.id).selectedIds"
            title="Фактическая забивка"
            description="Мастер выбирает, какие вкусы реально пошли в чашу."
            :tobaccos="appDataStore.references.tobaccos"
          />

          <label class="field">
            <span>Комментарий мастера</span>
            <textarea
              v-model="getDraft(order.id).packingComment"
              class="input textarea"
              rows="4"
              placeholder="Например: сделал микс мягче, добавил холодок и снизил крепость."
            />
          </label>

          <button class="button button--primary" type="button" @click="fulfillOrder(order.id)">
            Отдать заказ
          </button>
        </div>

        <div v-if="order.actualTobaccos.length > 0" class="pill-row">
          <span v-for="tobacco in order.actualTobaccos" :key="tobacco.id" class="pill">
            Забито: {{ tobacco.brand }} / {{ tobacco.flavorName }}
          </span>
        </div>

        <p v-if="order.packingComment" class="section-copy">
          Комментарий мастера: {{ order.packingComment }}
        </p>
      </article>
    </div>
  </section>
</template>
