<script setup lang="ts">
import { computed, reactive } from 'vue'

import type { BlendComponentInput, TobaccoReference } from '@/types/app'
import { filterTobaccos } from '@/utils/tobacco'

const props = defineProps<{
  modelValue: BlendComponentInput[]
  tobaccos: TobaccoReference[]
  title: string
  description: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BlendComponentInput[]]
}>()

const filters = reactive({
  brand: '',
  strength: '',
  tag: '',
  search: '',
})

const selectedIds = computed(() => props.modelValue.map((item) => item.tobaccoId))
const brandOptions = computed(() => [...new Set(props.tobaccos.map((item) => item.brand))].sort())
const tagOptions = computed(() =>
  [...new Set(props.tobaccos.flatMap((item) => item.flavorTags.map((tag) => tag.name)))].sort(),
)
const filteredTobaccos = computed(() => filterTobaccos(props.tobaccos, filters))
const totalPercentage = computed(() =>
  props.modelValue.reduce((sum, item) => sum + item.percentage, 0),
)

function addTobacco(tobaccoId: string) {
  if (selectedIds.value.includes(tobaccoId) || props.modelValue.length >= 3) {
    return
  }

  const next = [...props.modelValue, { tobaccoId, percentage: 0 }]
  emit('update:modelValue', rebalance(next))
}

function removeTobacco(tobaccoId: string) {
  emit(
    'update:modelValue',
    props.modelValue.filter((item) => item.tobaccoId !== tobaccoId),
  )
}

function updatePercentage(tobaccoId: string, rawValue: number) {
  emit(
    'update:modelValue',
    props.modelValue.map((item) =>
      item.tobaccoId === tobaccoId ? { ...item, percentage: Number(rawValue) } : item,
    ),
  )
}

function rebalance(items: BlendComponentInput[]) {
  const base = Math.floor(100 / items.length)
  let remainder = 100 - base * items.length

  return items.map((item) => {
    const percentage = base + (remainder > 0 ? 1 : 0)
    remainder -= remainder > 0 ? 1 : 0
    return { ...item, percentage }
  })
}
</script>

<template>
  <section class="panel panel--tight">
    <div class="panel__header panel__header--compact-mobile">
      <div>
        <p class="section-label">Микс</p>
        <h3>{{ title }}</h3>
      </div>
      <p class="section-copy panel__aside-copy">{{ description }}</p>
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
        <span>Крепость</span>
        <select v-model="filters.strength" class="input">
          <option value="">Любая</option>
          <option v-for="strength in [1, 2, 3, 4, 5]" :key="strength" :value="String(strength)">
            {{ strength }}/5
          </option>
        </select>
      </label>

      <label class="field">
        <span>Тег вкуса</span>
        <select v-model="filters.tag" class="input">
          <option value="">Любой</option>
          <option v-for="tag in tagOptions" :key="tag" :value="tag">{{ tag }}</option>
        </select>
      </label>

      <label class="field field--wide">
        <span>Поиск</span>
        <input
          v-model="filters.search"
          class="input"
          type="text"
          placeholder="Например: mint, pear, mango"
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
            <div class="pill-row">
              <span v-for="tag in tobacco.flavorTags" :key="tag.id" class="pill pill--muted">
                {{ tag.name }}
              </span>
            </div>
          </div>

          <button
            class="button button--secondary button--full-width-mobile"
            type="button"
            :disabled="selectedIds.includes(tobacco.id) || selectedIds.length >= 3"
            @click="addTobacco(tobacco.id)"
          >
            {{ selectedIds.includes(tobacco.id) ? 'Уже в миксе' : 'Добавить' }}
          </button>
        </article>
      </div>

      <aside class="selection-card">
        <div>
          <p class="section-label">Выбранные вкусы</p>
          <h4>{{ modelValue.length }} / 3</h4>
          <p class="section-copy">Сумма процентов: {{ totalPercentage }}%</p>
        </div>

        <div v-if="modelValue.length > 0" class="selection-list">
          <article
            v-for="item in modelValue"
            :key="item.tobaccoId"
            class="selection-list__item selection-list__item--stack"
          >
            <div>
              <strong>{{ tobaccos.find((entry) => entry.id === item.tobaccoId)?.flavorName ?? 'Не найдено' }}</strong>
              <p>
                {{
                  tobaccos.find((entry) => entry.id === item.tobaccoId)?.brand ?? 'Неизвестный бренд'
                }}
              </p>
            </div>

            <label class="field">
              <span>Процент</span>
              <input
                :value="item.percentage"
                class="input"
                min="0"
                max="100"
                step="1"
                type="number"
                @input="updatePercentage(item.tobaccoId, Number(($event.target as HTMLInputElement).value))"
              />
            </label>

            <button class="button button--ghost button--full-width-mobile" type="button" @click="removeTobacco(item.tobaccoId)">
              Удалить
            </button>
          </article>
        </div>

        <p v-else class="section-copy">
          Добавьте до трёх вкусов и настройте процентное соотношение.
        </p>
      </aside>
    </div>
  </section>
</template>
