<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { ApiError, api } from '@/lib/api'
import type {
  PublicForumCatalogItem,
  PublicForumCatalogSnapshot,
  PublicForumSectionKey,
} from '@/types/forum'

const catalog = ref<PublicForumCatalogSnapshot | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const activeSection = ref<'all' | PublicForumSectionKey>('all')
const activeBrand = ref('all')
const searchQuery = ref('')

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

  return catalog.value.items.filter((item) => {
    const matchesSection =
      activeSection.value === 'all' ? true : item.section === activeSection.value
    const matchesBrand = activeBrand.value === 'all' ? true : item.brand === activeBrand.value
    const matchesSearch =
      searchQuery.value.trim().length === 0
        ? true
        : `${item.title} ${item.subtitle} ${item.description}`
            .toLowerCase()
            .includes(searchQuery.value.trim().toLowerCase())

    return matchesSection && matchesBrand && matchesSearch
  })
})

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
    <div>
      <p class="section-label">Public forum</p>
      <h2>Публичный каталог табаков, кальянов и аксессуаров</h2>
      <p class="section-copy">
        Открытый раздел без авторизации: по брендам, моделям и карточкам изделий с параметрами, обсуждением и опытом эксплуатации.
      </p>
    </div>

    <div class="hero-card__badge">
      <span>{{ catalog?.items.length ?? 0 }}</span>
      <p>карточек уже доступно для просмотра</p>
    </div>
  </section>

  <section class="panel">
    <div class="panel__header panel__header--compact-mobile">
      <div>
        <p class="section-label">Разделы</p>
        <h3>Навигация по каталогу</h3>
      </div>
      <RouterLink class="button button--ghost button--full-width-mobile" to="/auth">
        Войти в панель
      </RouterLink>
    </div>

    <div class="tab-row tab-row--scrollable">
      <button
        class="tab-row__button"
        :class="{ 'tab-row__button--active': activeSection === 'all' }"
        type="button"
        @click="setSection('all')"
      >
        Всё
      </button>
      <button
        v-for="section in catalog?.sections ?? []"
        :key="section.key"
        class="tab-row__button"
        :class="{ 'tab-row__button--active': activeSection === section.key }"
        type="button"
        @click="setSection(section.key)"
      >
        {{ section.title }} · {{ section.itemCount }}
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

  <section v-else-if="visibleItems.length > 0" class="forum-card-grid">
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
          <span>Фото появится позже</span>
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
          <div v-for="parameter in item.parameters.slice(0, 3)" :key="parameter.label" class="forum-parameter">
            <span>{{ parameter.label }}</span>
            <strong>{{ parameter.value }}</strong>
          </div>
        </div>
      </div>
    </RouterLink>
  </section>

  <section v-else class="panel empty-state">
    <p class="section-label">Ничего не найдено</p>
    <h3>Попробуйте сменить раздел или фильтр по бренду</h3>
  </section>
</template>
