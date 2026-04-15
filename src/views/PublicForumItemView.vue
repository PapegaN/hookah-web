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

          <div class="pill-row">
            <span class="pill">Оценка: {{ item.ratingAverage }}/5</span>
            <span class="pill pill--muted">Отзывы: {{ item.reviewCount }}</span>
            <span class="pill pill--muted">Комментарии: {{ item.commentCount }}</span>
          </div>

          <div class="forum-parameter-list">
            <div v-for="parameter in item.parameters" :key="parameter.label" class="forum-parameter">
              <span>{{ parameter.label }}</span>
              <strong>{{ parameter.value }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">Обсуждение</p>
          <h3>Комментарии по изделию</h3>
        </div>
      </div>

      <div class="timeline-list">
        <article v-for="comment in item.comments" :key="comment.id" class="timeline-item">
          <div class="timeline-item__header">
            <strong>{{ comment.authorName }}</strong>
            <span>{{ formatDateTime(comment.createdAt) }}</span>
          </div>
          <p>{{ comment.text }}</p>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">Опыт эксплуатации</p>
          <h3>Подробные отзывы с оценкой</h3>
        </div>
      </div>

      <div class="timeline-list">
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
        </article>
      </div>
    </section>

    <section class="panel forum-cta-panel">
      <p class="section-label">Следующий этап</p>
      <h3>Публикация комментариев и отзывов будет добавлена следующим шагом</h3>
      <p class="section-copy">
        Каркас уже готов: карточка изделия разделена на параметры, обсуждение и опыт эксплуатации. Дальше можно подключать реальное хранение комментариев, фото и модерацию.
      </p>
    </section>
  </section>
</template>
