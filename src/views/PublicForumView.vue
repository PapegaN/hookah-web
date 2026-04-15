<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { ApiError, api } from '@/lib/api'
import type {
  PublicForumCatalogItem,
  PublicForumCatalogSnapshot,
  PublicForumSectionKey,
} from '@/types/forum'

type ForumSortMode = 'popular' | 'discussed' | 'title'

const catalog = ref<PublicForumCatalogSnapshot | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const activeSection = ref<'all' | PublicForumSectionKey>('all')
const activeBrand = ref('all')
const searchQuery = ref('')
const sortMode = ref<ForumSortMode>('popular')

const forumStats = computed(() => {
  if (!catalog.value) {
    return {
      items: 0,
      brands: 0,
      reviews: 0,
      comments: 0,
    }
  }

  return {
    items: catalog.value.items.length,
    brands: new Set(catalog.value.items.map((item) => item.brand)).size,
    reviews: catalog.value.items.reduce((sum, item) => sum + item.reviewCount, 0),
    comments: catalog.value.items.reduce((sum, item) => sum + item.commentCount, 0),
  }
})

const activeSectionMeta = computed(() => {
  if (!catalog.value || activeSection.value === 'all') {
    return {
      title: 'Все разделы',
      description: 'Открытый каталог по табакам, кальянам, чашкам и аксессуарам.',
    }
  }

  return (
    catalog.value.sections.find((section) => section.key === activeSection.value) ?? {
      title: 'Раздел',
      description: 'Подборка карточек по выбранному направлению.',
    }
  )
})

const visibleBrands = computed(() => {
  if (!catalog.value) {
    return []
  }

  if (activeSection.value === 'all') {
    return [...new Set(catalog.value.items.map((item) => item.brand))].sort((left, right) =>
      left.localeCompare(right, 'ru'),
    )
  }

  return (
    catalog.value.sections.find((section) => section.key === activeSection.value)?.brands ?? []
  )
})

const visibleItems = computed(() => {
  if (!catalog.value) {
    return []
  }

  const normalizedSearch = searchQuery.value.trim().toLowerCase()

  const filtered = catalog.value.items.filter((item) => {
    const matchesSection =
      activeSection.value === 'all' ? true : item.section === activeSection.value
    const matchesBrand = activeBrand.value === 'all' ? true : item.brand === activeBrand.value
    const matchesSearch =
      normalizedSearch.length === 0
        ? true
        : `${item.title} ${item.subtitle} ${item.description} ${item.parameters.map((parameter) => parameter.value).join(' ')}`
            .toLowerCase()
            .includes(normalizedSearch)

    return matchesSection && matchesBrand && matchesSearch
  })

  return [...filtered].sort((left, right) => {
    if (sortMode.value === 'title') {
      return left.title.localeCompare(right.title, 'ru')
    }

    if (sortMode.value === 'discussed') {
      return right.commentCount - left.commentCount || right.reviewCount - left.reviewCount
    }

    return (
      right.ratingAverage - left.ratingAverage ||
      right.reviewCount - left.reviewCount ||
      left.title.localeCompare(right.title, 'ru')
    )
  })
})

const featuredItems = computed(() => visibleItems.value.slice(0, 3))

onMounted(async () => {
  try {
    catalog.value = await api.getPublicForumCatalog()
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError
        ? error.message || 'Не удалось загрузить публичный каталог.'
        : 'Не удалось загрузить публичный каталог.'
  } finally {
    isLoading.value = false
  }
})

function setSection(section: 'all' | PublicForumSectionKey) {
  activeSection.value = section
  activeBrand.value = 'all'
}

function getPlaceholderLabel(item: PublicForumCatalogItem) {
  return item.brand
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
</script>

<template>
  <section class="hero-card forum-hero">
    <div class="stack">
      <p class="section-label">Public forum</p>
      <h2>Открытый каталог табаков, кальянов и аксессуаров</h2>
      <p class="section-copy">
        Публичный раздел без авторизации: карточки изделий по брендам и моделям, основные
        параметры, обсуждение и опыт эксплуатации в одном месте.
      </p>
      <div class="pill-row">
        <span class="pill">Карточек: {{ forumStats.items }}</span>
        <span class="pill pill--muted">Брендов: {{ forumStats.brands }}</span>
        <span class="pill pill--muted">Отзывы: {{ forumStats.reviews }}</span>
        <span class="pill pill--muted">Комментарии: {{ forumStats.comments }}</span>
      </div>
    </div>

    <div class="forum-hero__aside">
      <article class="forum-stat-card">
        <span>Точка входа</span>
        <strong>{{ activeSectionMeta.title }}</strong>
        <p>{{ activeSectionMeta.description }}</p>
      </article>

      <RouterLink class="button button--ghost button--full-width-mobile" to="/auth">
        Войти в рабочую панель
      </RouterLink>
    </div>
  </section>

  <section class="panel">
    <div class="panel__header panel__header--compact-mobile">
      <div>
        <p class="section-label">Разделы</p>
        <h3>Навигация по форуму</h3>
      </div>
      <span class="pill pill--muted">Публичный просмотр без авторизации</span>
    </div>

    <div class="forum-section-grid">
      <button
        class="forum-section-card"
        :class="{ 'forum-section-card--active': activeSection === 'all' }"
        type="button"
        @click="setSection('all')"
      >
        <strong>Все разделы</strong>
        <p>Общий каталог с поиском по всем карточкам.</p>
      </button>

      <button
        v-for="section in catalog?.sections ?? []"
        :key="section.key"
        class="forum-section-card"
        :class="{ 'forum-section-card--active': activeSection === section.key }"
        type="button"
        @click="setSection(section.key)"
      >
        <strong>{{ section.title }}</strong>
        <p>{{ section.description }}</p>
        <span>{{ section.itemCount }} карточек</span>
      </button>
    </div>

    <div class="editor-grid">
      <label class="field">
        <span>Бренд</span>
        <select v-model="activeBrand" class="input">
          <option value="all">Все бренды</option>
          <option v-for="brand in visibleBrands" :key="brand" :value="brand">{{ brand }}</option>
        </select>
      </label>

      <label class="field">
        <span>Поиск</span>
        <input
          v-model="searchQuery"
          class="input"
          type="text"
          placeholder="Например: Darkside, Hoob, phunnel, 25 мм"
        />
      </label>

      <label class="field">
        <span>Сортировка</span>
        <select v-model="sortMode" class="input">
          <option value="popular">По рейтингу</option>
          <option value="discussed">По обсуждениям</option>
          <option value="title">По названию</option>
        </select>
      </label>
    </div>
  </section>

  <section v-if="isLoading" class="panel status-banner">
    <p class="section-label">Загрузка</p>
    <h3>Подготавливаем публичный каталог</h3>
  </section>

  <section v-else-if="errorMessage" class="panel status-banner status-banner--error">
    <p class="section-label">Ошибка</p>
    <h3>Не удалось открыть форум</h3>
    <p>{{ errorMessage }}</p>
  </section>

  <template v-else-if="visibleItems.length > 0">
    <section class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">Подборка</p>
          <h3>Что посмотреть в первую очередь</h3>
        </div>
      </div>

      <div class="forum-featured-grid">
        <RouterLink
          v-for="item in featuredItems"
          :key="item.id"
          class="forum-featured-card"
          :to="`/forum/${item.section}/${item.id}`"
        >
          <span class="section-label">{{ item.brand }}</span>
          <strong>{{ item.title }}</strong>
          <p>{{ item.description }}</p>
          <div class="pill-row">
            <span class="pill">Рейтинг: {{ item.ratingAverage }}/5</span>
            <span class="pill pill--muted">Отзывы: {{ item.reviewCount }}</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <section class="forum-card-grid">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.id"
        class="panel forum-card"
        :to="`/forum/${item.section}/${item.id}`"
      >
        <div class="forum-card__media">
          <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" />
          <div v-else class="forum-card__placeholder">
            <strong>{{ getPlaceholderLabel(item) }}</strong>
            <span>Фото добавим позже</span>
          </div>
        </div>

        <div class="stack">
          <div>
            <p class="section-label">{{ item.brand }} / {{ item.model }}</p>
            <h3>{{ item.title }}</h3>
            <p class="section-copy">{{ item.description }}</p>
          </div>

          <div class="pill-row">
            <span class="pill">Оценка: {{ item.ratingAverage }}/5</span>
            <span class="pill pill--muted">Отзывы: {{ item.reviewCount }}</span>
            <span class="pill pill--muted">Комментарии: {{ item.commentCount }}</span>
          </div>

          <div class="forum-parameter-list">
            <div
              v-for="parameter in item.parameters.slice(0, 3)"
              :key="parameter.label"
              class="forum-parameter"
            >
              <span>{{ parameter.label }}</span>
              <strong>{{ parameter.value }}</strong>
            </div>
          </div>
        </div>
      </RouterLink>
    </section>
  </template>

  <section v-else class="panel empty-state">
    <p class="section-label">Ничего не найдено</p>
    <h3>Попробуйте сменить раздел, бренд или поисковый запрос</h3>
  </section>
</template>
