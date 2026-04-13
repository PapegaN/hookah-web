<script setup lang="ts">
import { computed, reactive } from 'vue'

import type { TobaccoReference } from '@/types/app'
import { filterTobaccos, mergeTobaccoSelection, removeTobaccoSelection } from '@/utils/tobacco'

const props = defineProps<{
  title: string
  description: string
  tobaccos: TobaccoReference[]
  selectedIds: string[]
  limit?: number
}>()

const emit = defineEmits<{
  'update:selectedIds': [value: string[]]
}>()

const filters = reactive({
  brand: '',
  strength: '',
  search: '',
})

const selectionLimit = computed(() => props.limit ?? 3)

const brandOptions = computed(() =>
  [...new Set(props.tobaccos.map((tobacco) => tobacco.brand))].sort((left, right) =>
    left.localeCompare(right, 'ru'),
  ),
)

const filteredTobaccos = computed(() => filterTobaccos(props.tobaccos, filters))

const selectedTobaccos = computed(() =>
  props.selectedIds
    .map((selectedId) => props.tobaccos.find((tobacco) => tobacco.id === selectedId))
    .filter((tobacco): tobacco is TobaccoReference => Boolean(tobacco)),
)

function addTobacco(tobaccoId: string) {
  emit('update:selectedIds', mergeTobaccoSelection(props.selectedIds, tobaccoId, selectionLimit.value))
}

function removeTobacco(tobaccoId: string) {
  emit('update:selectedIds', removeTobaccoSelection(props.selectedIds, tobaccoId))
}
</script>

<template>
  <section class="panel panel--tight">
    <div class="panel__header">
      <div>
        <p class="section-label">Blend palette</p>
        <h3>{{ title }}</h3>
      </div>
      <p class="section-copy">{{ description }}</p>
    </div>

    <div class="filters-grid">
      <label class="field">
        <span>Бренд</span>
        <select v-model="filters.brand" class="input">
          <option value="">Все бренды</option>
          <option v-for="brand in brandOptions" :key="brand" :value="brand">{{ brand }}</option>
        </select>
      </label>

      <label class="field">
        <span>Оценочная крепость</span>
        <select v-model="filters.strength" class="input">
          <option value="">Все уровни</option>
          <option v-for="strength in [1, 2, 3, 4, 5]" :key="strength" :value="String(strength)">
            {{ strength }}/5
          </option>
        </select>
      </label>

      <label class="field field--wide">
        <span>Поиск по вкусу</span>
        <input
          v-model="filters.search"
          class="input"
          type="text"
          placeholder="Например: mint, mango, pear..."
        />
      </label>
    </div>

    <div class="picker-layout">
      <div class="picker-results">
        <article v-for="tobacco in filteredTobaccos" :key="tobacco.id" class="catalog-card">
          <div>
            <p class="catalog-card__eyebrow">{{ tobacco.brand }} / {{ tobacco.line }}</p>
            <h4>{{ tobacco.flavorName }}</h4>
            <p>{{ tobacco.flavorDescription }}</p>
          </div>

          <div class="pill-row">
            <span class="pill">Крепость линейки: {{ tobacco.lineStrengthLevel }}/5</span>
            <span class="pill">Оценка: {{ tobacco.estimatedStrengthLevel }}/5</span>
            <span class="pill">Яркость: {{ tobacco.brightnessLevel }}/5</span>
          </div>

          <button
            class="button button--secondary"
            type="button"
            :disabled="selectedIds.includes(tobacco.id) || selectedIds.length >= selectionLimit"
            @click="addTobacco(tobacco.id)"
          >
            {{ selectedIds.includes(tobacco.id) ? 'Уже выбран' : 'Добавить вкус' }}
          </button>
        </article>
      </div>

      <aside class="selection-card">
        <div>
          <p class="section-label">Выбранные вкусы</p>
          <h4>{{ selectedTobaccos.length }} / {{ selectionLimit }}</h4>
        </div>

        <div v-if="selectedTobaccos.length > 0" class="selection-list">
          <article v-for="tobacco in selectedTobaccos" :key="tobacco.id" class="selection-list__item">
            <div>
              <strong>{{ tobacco.flavorName }}</strong>
              <p>{{ tobacco.brand }} / {{ tobacco.line }}</p>
            </div>
            <button class="button button--ghost" type="button" @click="removeTobacco(tobacco.id)">
              Удалить
            </button>
          </article>
        </div>

        <p v-else class="section-copy">
          Добавьте до трёх вкусов. Они будут отображаться столбиком и уйдут в заказ вместе с вашим
          описанием.
        </p>
      </aside>
    </div>
  </section>
</template>
