<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import { formatDateTime } from '@/utils/date'

const appDataStore = useAppDataStore()
const sessionStore = useSessionStore()

const feedbackForm = reactive({
  ratingScore: 5,
  ratingReview: '',
})

const feedbackError = ref<string | null>(null)

const latestOrder = computed(() => appDataStore.latestClientOrder)

const currentParticipant = computed(() =>
  latestOrder.value?.participants.find(
    (participant) => participant.client.id === sessionStore.currentUser?.id,
  ) ?? null,
)

const canLeaveFeedback = computed(
  () =>
    latestOrder.value?.status === 'ready_for_feedback' &&
    currentParticipant.value &&
    !currentParticipant.value.feedback,
)

const timelineLabels = {
  created: 'Заказ создан',
  participant_joined: 'К заказу присоединился клиент',
  participant_table_approved: 'Гость подтверждён за столом',
  started: 'Заказ взят в работу',
  delivered: 'Заказ отдан',
  feedback_received: 'Получен отзыв',
}

async function submitFeedback() {
  if (!sessionStore.accessToken || !latestOrder.value) {
    return
  }

  feedbackError.value = null

  try {
    await appDataStore.submitFeedback(sessionStore.accessToken, latestOrder.value.id, {
      ratingScore: feedbackForm.ratingScore,
      ratingReview: feedbackForm.ratingReview || undefined,
    })
    feedbackForm.ratingReview = ''
  } catch {
    feedbackError.value = 'Не удалось отправить отзыв. Попробуйте ещё раз.'
  }
}
</script>

<template>
  <section v-if="latestOrder" class="stack">
    <section class="hero-card">
      <div>
        <p class="section-label">{{ latestOrder.tableLabel }}</p>
        <h2>Статус вашего заказа</h2>
        <p class="section-copy">
          Здесь видно запросы по столу, фактическую забивку мастера, подтверждение гостей и полную
          историю статусов.
        </p>
      </div>

      <div class="hero-card__badge">
        <span>{{ latestOrder.status }}</span>
        <p>текущий статус заказа</p>
      </div>
    </section>

    <section class="panel">
      <div class="stats-grid">
        <article class="task-card">
          <p class="task-card__status">Создан</p>
          <h4>{{ formatDateTime(latestOrder.createdAt) }}</h4>
          <p>Время оформления заказа по столу.</p>
        </article>
        <article class="task-card">
          <p class="task-card__status">Отдан</p>
          <h4>{{ formatDateTime(latestOrder.deliveredAt) }}</h4>
          <p>Когда заказ ушёл от мастера к гостям.</p>
        </article>
        <article class="task-card">
          <p class="task-card__status">Последний отзыв</p>
          <h4>{{ formatDateTime(latestOrder.feedbackAt) }}</h4>
          <p>Последнее обновление блока отзывов.</p>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">Guests</p>
          <h3>Люди за столом и их запросы</h3>
        </div>
        <span class="pill">{{ latestOrder.participants.length }} гостей</span>
      </div>

      <div class="participant-list">
        <article v-for="participant in latestOrder.participants" :key="participant.client.id" class="participant-card">
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
            <span
              v-for="tobacco in participant.requestedTobaccos"
              :key="`${participant.client.id}-${tobacco.id}`"
              class="pill"
            >
              {{ tobacco.brand }} / {{ tobacco.flavorName }}
            </span>
          </div>

          <p v-if="participant.tableApprovedBy" class="section-copy">
            Подтвердил {{ participant.tableApprovedBy.login }} ·
            {{ formatDateTime(participant.tableApprovedAt) }}
          </p>

          <p v-if="participant.feedback" class="section-copy">
            Оценка {{ participant.feedback.ratingScore }}/5 ·
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
        <span v-if="latestOrder.acceptedBy" class="pill">{{ latestOrder.acceptedBy.login }}</span>
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
        <select v-model="feedbackForm.ratingScore" class="input">
          <option v-for="score in [5, 4, 3, 2, 1]" :key="score" :value="score">
            {{ score }}/5
          </option>
        </select>
      </label>

      <label class="field">
        <span>Отзыв</span>
        <textarea
          v-model="feedbackForm.ratingReview"
          class="input textarea"
          rows="4"
          placeholder="Опишите, что понравилось в тяге, вкусе и балансе."
        />
      </label>

      <p v-if="feedbackError" class="form-error">{{ feedbackError }}</p>

      <button class="button button--primary" type="button" @click="submitFeedback">
        Отправить отзыв
      </button>
    </section>

    <section v-else-if="currentParticipant?.feedback" class="panel">
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
    <p class="section-label">No orders yet</p>
    <h2>Заказов пока нет</h2>
    <p class="section-copy">
      Как только вы отправите заказ, здесь появится его статус и история.
    </p>
  </section>
</template>
