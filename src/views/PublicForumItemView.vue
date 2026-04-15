<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { ApiError, api } from '@/lib/api'
import type { PublicForumItemDetail, PublicForumSectionKey } from '@/types/forum'
import { formatDateTime } from '@/utils/date'

const route = useRoute()

const item = ref<PublicForumItemDetail | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

const itemId = computed(() => String(route.params.itemId ?? ''))
const section = computed(() => String(route.params.section ?? '') as PublicForumSectionKey)

const overviewParameters = computed(() => item.value?.parameters.slice(0, 4) ?? [])
const additionalParameters = computed(() => item.value?.parameters.slice(4) ?? [])
const reviewAverageLabel = computed(() => {
  if (!item.value) {
    return '0.0'
  }

  return item.value.ratingAverage.toFixed(1)
})

async function loadItem() {
  isLoading.value = true
  errorMessage.value = null

  try {
    item.value = await api.getPublicForumItem(section.value, itemId.value)
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError
        ? error.message || 'Не удалось открыть карточку изделия.'
        : 'Не удалось открыть карточку изделия.'
  } finally {
    isLoading.value = false
  }
}

function getPlaceholderLabel(title: string) {
  return title
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

onMounted(() => {
  void loadItem()
})

watch([section, itemId], () => {
  void loadItem()
})
</script>

<template>
  <section v-if="isLoading" class="panel status-banner">
    <p class="section-label">Загрузка</p>
    <h3>Открываем карточку изделия</h3>
  </section>

  <section v-else-if="errorMessage" class="panel status-banner status-banner--error">
    <p class="section-label">Ошибка</p>
    <h3>Карточка недоступна</h3>
    <p>{{ errorMessage }}</p>
  </section>

  <section v-else-if="item" class="stack">
    <section class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">{{ item.brand }} / {{ item.model }}</p>
          <h2>{{ item.title }}</h2>
        </div>
        <RouterLink class="button button--ghost button--full-width-mobile" to="/forum">
          К списку
        </RouterLink>
      </div>

      <div class="forum-detail-layout">
        <div class="forum-detail-media">
          <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" />
          <div v-else class="forum-card__placeholder forum-card__placeholder--large">
            <strong>{{ getPlaceholderLabel(item.title) }}</strong>
            <span>Здесь будет фото изделия</span>
          </div>
        </div>

        <div class="stack">
          <p class="section-copy">{{ item.description }}</p>

          <div class="forum-stat-grid">
            <article class="forum-stat-card">
              <span>Средняя оценка</span>
              <strong>{{ reviewAverageLabel }}/5</strong>
              <p>Сводная оценка по отзывам пользователей.</p>
            </article>

            <article class="forum-stat-card">
              <span>Отзывы</span>
              <strong>{{ item.reviewCount }}</strong>
              <p>Подробный опыт эксплуатации и впечатления.</p>
            </article>

            <article class="forum-stat-card">
              <span>Комментарии</span>
              <strong>{{ item.commentCount }}</strong>
              <p>Короткие обсуждения и вопросы по изделию.</p>
            </article>
          </div>

          <div class="forum-parameter-list">
            <div v-for="parameter in overviewParameters" :key="parameter.label" class="forum-parameter">
              <span>{{ parameter.label }}</span>
              <strong>{{ parameter.value }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="additionalParameters.length > 0" class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">Параметры</p>
          <h3>Дополнительные характеристики</h3>
        </div>
      </div>

      <div class="forum-parameter-list">
        <div v-for="parameter in additionalParameters" :key="parameter.label" class="forum-parameter">
          <span>{{ parameter.label }}</span>
          <strong>{{ parameter.value }}</strong>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">Обсуждение</p>
          <h3>Комментарии по изделию</h3>
        </div>
        <span class="pill pill--muted">Публичное чтение</span>
      </div>

      <div v-if="item.comments.length > 0" class="timeline-list">
        <article v-for="comment in item.comments" :key="comment.id" class="timeline-item">
          <div class="timeline-item__header">
            <strong>{{ comment.authorName }}</strong>
            <span>{{ formatDateTime(comment.createdAt) }}</span>
          </div>
          <p>{{ comment.text }}</p>

          <div v-if="comment.photoUrls.length > 0" class="forum-photo-grid">
            <img
              v-for="photoUrl in comment.photoUrls"
              :key="photoUrl"
              :src="photoUrl"
              :alt="`Изображение в комментарии ${comment.authorName}`"
              class="forum-inline-photo"
            />
          </div>
        </article>
      </div>
      <div v-else class="empty-state empty-state--left">
        <p class="section-label">Пока пусто</p>
        <h3>Комментариев ещё нет</h3>
        <p class="section-copy">Эта карточка уже готова к живому обсуждению, но первые сообщения ещё не опубликованы.</p>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">Опыт эксплуатации</p>
          <h3>Подробные отзывы с оценкой</h3>
        </div>
      </div>

      <div v-if="item.reviews.length > 0" class="timeline-list">
        <article v-for="review in item.reviews" :key="review.id" class="timeline-item">
          <div class="timeline-item__header">
            <strong>{{ review.authorName }}</strong>
            <span>{{ formatDateTime(review.createdAt) }}</span>
          </div>

          <div class="pill-row">
            <span class="pill">Оценка: {{ review.rating }}/5</span>
            <span class="pill pill--muted">
              Фото: {{ review.photoUrls.length > 0 ? review.photoUrls.length : 'пока без фото' }}
            </span>
          </div>

          <p>{{ review.text }}</p>

          <div v-if="review.photoUrls.length > 0" class="forum-photo-grid">
            <img
              v-for="photoUrl in review.photoUrls"
              :key="photoUrl"
              :src="photoUrl"
              :alt="`Изображение в отзыве ${review.authorName}`"
              class="forum-inline-photo"
            />
          </div>
        </article>
      </div>
      <div v-else class="empty-state empty-state--left">
        <p class="section-label">Пока пусто</p>
        <h3>Отзывов ещё нет</h3>
        <p class="section-copy">Здесь появится подробный опыт эксплуатации, как только пользователи начнут оставлять отзывы.</p>
      </div>
    </section>

    <section class="panel forum-cta-panel">
      <p class="section-label">Следующий этап</p>
      <h3>Карточка готова для подключения реальных комментариев, отзывов и фото</h3>
      <p class="section-copy">
        Сейчас публичная часть уже показывает структуру будущего форума: параметры, обсуждение и
        опыт эксплуатации. Следующим шагом можно переносить это на реальные таблицы форума и
        привязывать фотографии через media storage.
      </p>
    </section>
  </section>
</template>
