<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import TobaccoPicker from '@/components/TobaccoPicker.vue'
import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const appDataStore = useAppDataStore()
const sessionStore = useSessionStore()

const draft = reactive({
  selectedIds: [] as string[],
  packingComment: '',
})

const orderId = computed(() => String(route.params.id ?? ''))
const order = computed(() => appDataStore.orders.find((item) => item.id === orderId.value) ?? null)

const timelineLabels = {
  created: 'Заказ создан',
  participant_joined: 'К заказу присоединился клиент',
  participant_table_approved: 'Гость подтверждён за столом',
  started: 'Заказ взят в работу',
  delivered: 'Заказ отдан',
  feedback_received: 'Получен отзыв',
}

async function goBack() {
  await router.push('/staff/orders')
}

async function takeOrder() {
  if (!sessionStore.accessToken || !order.value) {
    return
  }

  await appDataStore.startOrder(sessionStore.accessToken, order.value.id)
}

async function approveParticipant(clientUserId: string) {
  if (!sessionStore.accessToken || !order.value) {
    return
  }

  await appDataStore.approveParticipantTable(sessionStore.accessToken, order.value.id, clientUserId)
}

async function fulfillOrder() {
  if (!sessionStore.accessToken || !order.value) {
    return
  }

  await appDataStore.fulfillOrder(sessionStore.accessToken, order.value.id, {
    actualTobaccoIds: draft.selectedIds,
    packingComment: draft.packingComment,
  })
}
</script>

<template>
  <section v-if="order" class="stack">
    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">{{ order.tableLabel }}</p>
          <h2>Детальная карточка заказа</h2>
        </div>
        <div class="pill-row">
          <span class="pill">{{ order.status }}</span>
          <button class="button button--ghost" type="button" @click="goBack">К списку</button>
        </div>
      </div>

      <div class="stats-grid">
        <article class="task-card">
          <p class="task-card__status">Создан</p>
          <h4>{{ formatDateTime(order.createdAt) }}</h4>
          <p>Время оформления заявки по этому столу.</p>
        </article>
        <article class="task-card">
          <p class="task-card__status">Отдан</p>
          <h4>{{ formatDateTime(order.deliveredAt) }}</h4>
          <p>Когда заказ ушёл гостям со стойки.</p>
        </article>
        <article class="task-card">
          <p class="task-card__status">Последний отзыв</p>
          <h4>{{ formatDateTime(order.feedbackAt) }}</h4>
          <p>Если отзывов ещё нет, здесь останется пусто.</p>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">Guests</p>
          <h3>Люди за столом и их запросы</h3>
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
            <span class="pill" :class="{ 'pill--muted': participant.tableApprovalStatus !== 'approved' }">
              {{
                participant.tableApprovalStatus === 'approved'
                  ? 'Подтверждён за столом'
                  : 'Ожидает подтверждения'
              }}
            </span>
          </div>

          <p>{{ participant.description }}</p>

          <div class="pill-row">
            <span v-for="tobacco in participant.requestedTobaccos" :key="tobacco.id" class="pill">
              {{ tobacco.brand }} / {{ tobacco.flavorName }}
            </span>
          </div>

          <p v-if="participant.tableApprovedBy" class="section-copy">
            Подтвердил {{ participant.tableApprovedBy.login }} ·
            {{ formatDateTime(participant.tableApprovedAt) }}
          </p>

          <p v-if="participant.feedback" class="section-copy">
            Отзыв {{ participant.feedback.ratingScore }}/5 ·
            {{ formatDateTime(participant.feedback.submittedAt) }}
            <template v-if="participant.feedback.ratingReview">
              — {{ participant.feedback.ratingReview }}
            </template>
          </p>

          <button
            v-if="participant.tableApprovalStatus !== 'approved'"
            class="button button--secondary"
            type="button"
            @click="approveParticipant(participant.client.id)"
          >
            Подтвердить за столом
          </button>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">Timeline</p>
          <h3>История статусов</h3>
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

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">Packing</p>
          <h3>Фактическая забивка</h3>
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
        @click="takeOrder"
      >
        Взять в работу
      </button>

      <div v-if="order.status === 'new' || order.status === 'in_progress'" class="stack">
        <TobaccoPicker
          v-model:selected-ids="draft.selectedIds"
          title="Фактическая забивка"
          description="Выберите до трёх вкусов, которые реально пошли в чашу."
          :tobaccos="appDataStore.references.tobaccos"
        />

        <label class="field">
          <span>Комментарий мастера</span>
          <textarea
            v-model="draft.packingComment"
            class="input textarea"
            rows="4"
            placeholder="Например: сделали мягче, добавили больше холода и убрали лишнюю сладость."
          />
        </label>

        <button class="button button--primary" type="button" @click="fulfillOrder">
          Отдать заказ
        </button>
      </div>
    </section>
  </section>

  <section v-else class="panel">
    <p class="section-label">Order not found</p>
    <h2>Заказ не найден</h2>
    <p class="section-copy">
      Возможно, он уже не доступен вашей роли или ещё не успел загрузиться в локальное состояние.
    </p>
    <button class="button button--ghost" type="button" @click="goBack">Назад к доске</button>
  </section>
</template>
