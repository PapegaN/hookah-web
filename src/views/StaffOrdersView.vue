<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'

import TobaccoPicker from '@/components/TobaccoPicker.vue'
import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
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
const highlightedOrderId = computed(() =>
  typeof route.query.orderId === 'string' ? route.query.orderId : '',
)

const timelineLabels = {
  created: 'Заказ создан',
  participant_joined: 'К столу присоединился клиент',
  started: 'Заказ взят в работу',
  delivered: 'Заказ отдан',
  feedback_received: 'Получен отзыв',
}

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
      <span class="pill">{{ visibleOrders.length }} активных карточек</span>
    </div>
    <p class="section-copy">
      Уведомление слева переводит прямо к нужному заказу. Внутри карточки видно
      стол, гостей, запросы по вкусам, историю статусов и все отзывы.
    </p>
  </section>

  <div class="stack">
    <article
      v-for="order in visibleOrders"
      :key="order.id"
      class="editor-card"
      :class="{ 'editor-card--highlighted': highlightedOrderId === order.id }"
    >
      <div class="editor-card__header">
        <div>
          <p class="section-label">{{ order.tableLabel }}</p>
          <h3>{{ order.participants.length }} гостей за столом</h3>
        </div>
        <span class="pill">{{ order.status }}</span>
      </div>

      <div class="stats-grid">
        <article class="task-card">
          <p class="task-card__status">Создан</p>
          <h4>{{ formatDateTime(order.createdAt) }}</h4>
          <p>Время и дата оформления заказа.</p>
        </article>

        <article class="task-card">
          <p class="task-card__status">Отдан</p>
          <h4>{{ formatDateTime(order.deliveredAt) }}</h4>
          <p>Когда заказ ушёл со стойки клиентам.</p>
        </article>

        <article class="task-card">
          <p class="task-card__status">Последний отзыв</p>
          <h4>{{ formatDateTime(order.feedbackAt) }}</h4>
          <p>Последнее обновление блока отзывов.</p>
        </article>
      </div>

      <section class="stack">
        <div class="panel__header">
          <div>
            <p class="section-label">Guests</p>
            <h4>Люди за столом и их запросы</h4>
          </div>
          <span v-if="order.acceptedBy" class="pill pill--muted">
            В работе у {{ order.acceptedBy.login }}
          </span>
        </div>

        <div class="participant-list">
          <article v-for="participant in order.participants" :key="participant.client.id" class="participant-card">
            <div class="editor-card__header">
              <div>
                <p class="section-label">{{ participant.client.login }}</p>
                <h4>{{ formatDateTime(participant.joinedAt) }}</h4>
              </div>
              <span class="pill pill--muted">
                {{ participant.feedback ? 'Отзыв есть' : 'Ждёт отзыв' }}
              </span>
            </div>

            <p>{{ participant.description }}</p>

            <div class="pill-row">
              <span
                v-for="tobacco in participant.requestedTobaccos"
                :key="`${participant.client.id}-${tobacco.id}`"
                class="pill"
              >
                {{ tobacco.brand }} / {{ tobacco.flavorName }}
              </span>
            </div>

            <p v-if="participant.feedback" class="section-copy">
              {{ participant.feedback.client.login }}: {{ participant.feedback.ratingScore }}/5,
              {{ formatDateTime(participant.feedback.submittedAt) }}
              <template v-if="participant.feedback.ratingReview">
                — {{ participant.feedback.ratingReview }}
              </template>
            </p>
          </article>
        </div>
      </section>

      <section class="stack">
        <div class="panel__header">
          <div>
            <p class="section-label">Timeline</p>
            <h4>История статусов</h4>
          </div>
        </div>

        <div class="timeline-list">
          <article v-for="event in order.timeline" :key="event.id" class="timeline-item">
            <div class="timeline-item__header">
              <strong>{{ timelineLabels[event.type] }}</strong>
              <span>{{ formatDateTime(event.occurredAt) }}</span>
            </div>
            <p>{{ event.note }}</p>
          </article>
        </div>
      </section>

      <section class="stack">
        <div class="panel__header">
          <div>
            <p class="section-label">Packing</p>
            <h4>Фактическая забивка</h4>
          </div>
        </div>

        <div v-if="order.actualTobaccos.length > 0" class="pill-row">
          <span v-for="tobacco in order.actualTobaccos" :key="tobacco.id" class="pill">
            {{ tobacco.brand }} / {{ tobacco.flavorName }}
          </span>
        </div>

        <p v-if="order.packingComment" class="section-copy">
          Комментарий мастера: {{ order.packingComment }}
        </p>

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
            description="Выберите до трёх вкусов, которые реально пошли в чашу."
            :tobaccos="appDataStore.references.tobaccos"
          />

          <label class="field">
            <span>Комментарий мастера</span>
            <textarea
              v-model="getDraft(order.id).packingComment"
              class="input textarea"
              rows="4"
              placeholder="Например: сделал микс мягче, добавил больше холода и снизил крепость."
            />
          </label>

          <button class="button button--primary" type="button" @click="fulfillOrder(order.id)">
            Отдать заказ
          </button>
        </div>
      </section>
    </article>
  </div>
</template>
