<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import { formatDateTime } from '@/utils/date'

const sessionStore = useSessionStore()
const appDataStore = useAppDataStore()

const ratingForm = reactive({
  ratingScore: 5,
  ratingReview: '',
})

const feedbackError = ref<string | null>(null)

const latestOrder = computed(
  () =>
    appDataStore.orders.find(
      (order) =>
        order.status !== 'rated' ||
        order.participants.some(
          (participant) =>
            participant.client.id === sessionStore.currentUser?.id && !participant.feedback,
        ),
    ) ?? appDataStore.latestClientOrder,
)

const currentParticipant = computed(() =>
  latestOrder.value?.participants.find(
    (participant) => participant.client.id === sessionStore.currentUser?.id,
  ),
)

const canLeaveFeedback = computed(
  () =>
    latestOrder.value?.status === 'ready_for_feedback' &&
    currentParticipant.value &&
    !currentParticipant.value.feedback,
)

const waitingText = computed(() => {
  switch (latestOrder.value?.status) {
    case 'new':
      return 'Заказ создан и ждёт, пока мастер возьмёт его в работу.'
    case 'in_progress':
      return 'Мастер уже работает над общей забивкой стола.'
    case 'ready_for_feedback':
      return 'Кальян отдан. Каждый клиент за столом может оставить свой отзыв.'
    case 'rated':
      return 'Все отзывы по столу уже собраны.'
    default:
      return ''
  }
})

async function submitFeedback() {
  if (!sessionStore.accessToken || !latestOrder.value) {
    return
  }

  feedbackError.value = null

  await appDataStore.submitFeedback(sessionStore.accessToken, latestOrder.value.id, {
    ratingScore: ratingForm.ratingScore,
    ratingReview: ratingForm.ratingReview,
  })
}

const timelineLabels = {
  created: 'Заказ создан',
  participant_joined: 'К заказу присоединился клиент',
  started: 'Заказ взят в работу',
  delivered: 'Заказ отдан',
  feedback_received: 'Получен отзыв',
}
</script>

<template>
  <section v-if="latestOrder" class="stack">
    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">Client status</p>
          <h2>{{ latestOrder.tableLabel }}</h2>
        </div>
        <span class="pill">{{ latestOrder.status }}</span>
      </div>

      <p class="section-copy">{{ waitingText }}</p>

      <div class="stats-grid">
        <article class="task-card">
          <p class="task-card__status">Создан</p>
          <h3>{{ formatDateTime(latestOrder.createdAt) }}</h3>
          <p>Время оформления заказа столом.</p>
        </article>

        <article class="task-card">
          <p class="task-card__status">Отдан</p>
          <h3>{{ formatDateTime(latestOrder.deliveredAt) }}</h3>
          <p>Когда мастер завершил и отдал кальян.</p>
        </article>

        <article class="task-card">
          <p class="task-card__status">Последний отзыв</p>
          <h3>{{ formatDateTime(latestOrder.feedbackAt) }}</h3>
          <p>Последнее обновление блока отзывов по столу.</p>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">Table guests</p>
          <h3>Кто сидит за столом</h3>
        </div>
        <span class="pill">{{ latestOrder.participants.length }} клиентов</span>
      </div>

      <div class="participant-list">
        <article
          v-for="participant in latestOrder.participants"
          :key="participant.client.id"
          class="participant-card"
        >
          <div class="editor-card__header">
            <div>
              <p class="section-label">{{ participant.client.login }}</p>
              <h4>{{ formatDateTime(participant.joinedAt) }}</h4>
            </div>
            <span class="pill pill--muted">
              {{ participant.client.id === sessionStore.currentUser?.id ? 'Вы' : 'Гость' }}
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
            Отзыв: {{ participant.feedback.ratingScore }}/5,
            {{ formatDateTime(participant.feedback.submittedAt) }}
          </p>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">Actual packing</p>
          <h3>Что забил мастер</h3>
        </div>
        <span v-if="latestOrder.acceptedBy" class="pill">
          {{ latestOrder.acceptedBy.login }}
        </span>
      </div>

      <div class="pill-row">
        <span v-for="tobacco in latestOrder.actualTobaccos" :key="tobacco.id" class="pill">
          {{ tobacco.brand }} / {{ tobacco.flavorName }}
        </span>
      </div>

      <p v-if="latestOrder.packingComment" class="section-copy">
        Комментарий мастера: {{ latestOrder.packingComment }}
      </p>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">Status timeline</p>
          <h3>История статусов</h3>
        </div>
      </div>

      <div class="timeline-list">
        <article v-for="event in latestOrder.timeline" :key="event.id" class="timeline-item">
          <div class="timeline-item__header">
            <strong>{{ timelineLabels[event.type] }}</strong>
            <span>{{ formatDateTime(event.occurredAt) }}</span>
          </div>
          <p>{{ event.note }}</p>
        </article>
      </div>
    </section>

    <section v-if="canLeaveFeedback" class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">Feedback</p>
          <h3>Оцените кальян</h3>
        </div>
      </div>

      <label class="field">
        <span>Оценка по 5-балльной шкале</span>
        <input v-model="ratingForm.ratingScore" class="input" type="range" min="1" max="5" />
        <strong>{{ ratingForm.ratingScore }} / 5</strong>
      </label>

      <label class="field">
        <span>Отзыв</span>
        <textarea v-model="ratingForm.ratingReview" class="input textarea" rows="4" />
      </label>

      <p v-if="feedbackError" class="form-error">{{ feedbackError }}</p>

      <button class="button button--primary" type="button" @click="submitFeedback">
        Отправить отзыв
      </button>
    </section>

    <section
      v-else-if="currentParticipant?.feedback"
      class="panel"
    >
      <p class="section-label">Feedback</p>
      <h3>Ваш отзыв уже сохранён</h3>
      <p class="section-copy">
        Оценка {{ currentParticipant.feedback.ratingScore }}/5 от
        {{ formatDateTime(currentParticipant.feedback.submittedAt) }}
      </p>
      <p v-if="currentParticipant.feedback.ratingReview" class="section-copy">
        {{ currentParticipant.feedback.ratingReview }}
      </p>
    </section>
  </section>

  <section v-else class="panel">
    <p class="section-label">Client status</p>
    <h2>У вас пока нет активного заказа</h2>
    <p class="section-copy">
      Можно сразу перейти к конструктору и собрать новый заказ из палитры вкусов.
    </p>
    <RouterLink class="button button--primary" to="/client/order/new">Собрать заказ</RouterLink>
  </section>
</template>
