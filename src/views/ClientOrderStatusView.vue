<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()
const appDataStore = useAppDataStore()

const ratingForm = reactive({
  ratingScore: 5,
  ratingReview: '',
})

const feedbackError = ref<string | null>(null)

const latestOrder = computed(() => appDataStore.latestClientOrder)

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

const waitingText = computed(() => {
  switch (latestOrder.value?.status) {
    case 'new':
      return 'Заказ создан и ждет, пока мастер возьмет его в работу.'
    case 'in_progress':
      return 'Мастер уже работает над вашей забивкой.'
    case 'ready_for_feedback':
      return 'Кальян отдан. Оцените результат и оставьте отзыв.'
    case 'rated':
      return 'Спасибо, отзыв сохранен.'
    default:
      return ''
  }
})
</script>

<template>
  <section v-if="latestOrder" class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Client status</p>
        <h2>Текущий заказ</h2>
      </div>
      <p class="section-copy">{{ waitingText }}</p>
    </div>

    <div class="task-list">
      <article class="task-card">
        <p class="task-card__status">Что просили</p>
        <h3>Запрос клиента</h3>
        <p>{{ latestOrder.description }}</p>
        <div class="pill-row">
          <span v-for="tobacco in latestOrder.requestedTobaccos" :key="tobacco.id" class="pill">
            {{ tobacco.brand }} / {{ tobacco.flavorName }}
          </span>
        </div>
      </article>

      <article class="task-card">
        <p class="task-card__status">Статус</p>
        <h3>{{ latestOrder.status }}</h3>
        <p>
          <template v-if="latestOrder.acceptedBy">
            Заказ в работе у {{ latestOrder.acceptedBy.login }}.
          </template>
          <template v-else>Заказ еще не принят в работу.</template>
        </p>
      </article>
    </div>

    <section v-if="latestOrder.status === 'ready_for_feedback'" class="editor-card">
      <h3>Оцените кальян</h3>
      <p class="section-copy">
        Здесь клиент видит, что именно просил, и что фактически забил мастер.
      </p>

      <div class="pill-row">
        <span v-for="tobacco in latestOrder.actualTobaccos" :key="tobacco.id" class="pill">
          {{ tobacco.brand }} / {{ tobacco.flavorName }}
        </span>
      </div>

      <p v-if="latestOrder.packingComment" class="section-copy">
        Комментарий мастера: {{ latestOrder.packingComment }}
      </p>

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
        Отправить оценку
      </button>
    </section>

    <section v-else-if="latestOrder.status === 'rated'" class="editor-card">
      <h3>Спасибо за отзыв</h3>
      <p class="section-copy">
        Ваша оценка: {{ latestOrder.ratingScore }}/5. Отзыв сохранен и доступен команде.
      </p>
      <p v-if="latestOrder.ratingReview" class="section-copy">{{ latestOrder.ratingReview }}</p>
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
