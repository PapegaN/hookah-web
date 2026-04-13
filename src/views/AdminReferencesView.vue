<script setup lang="ts">
import { computed, ref } from 'vue'

import AdminReferenceSection from '@/components/AdminReferenceSection.vue'
import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import type {
  EditableReferenceItem,
  ReferenceEntityType,
  ReferenceFieldConfig,
  ReferenceTableColumn,
} from '@/types/app'

interface ReferenceTabConfig {
  key: ReferenceEntityType
  label: string
  title: string
  description: string
  addButtonLabel: string
  fields: ReferenceFieldConfig[]
  columns: ReferenceTableColumn[]
}

const appDataStore = useAppDataStore()
const sessionStore = useSessionStore()
const activeTab = ref<ReferenceEntityType>('tobaccos')

const bowlTypeOptions = [
  { label: 'Phunnel', value: 'phunnel' },
  { label: 'Killer', value: 'killer' },
  { label: 'Turka', value: 'turka' },
  { label: 'Elian', value: 'elian' },
]

const capacityOptions = [
  { label: 'Ведро', value: 'bucket' },
  { label: 'Большая', value: 'large' },
  { label: 'Средняя', value: 'medium' },
  { label: 'Малая', value: 'small' },
  { label: 'Очень малая', value: 'very_small' },
]

const tobaccoFields: ReferenceFieldConfig[] = [
  { key: 'brand', label: 'Бренд', kind: 'text' },
  { key: 'line', label: 'Линейка', kind: 'text' },
  { key: 'flavorName', label: 'Вкус', kind: 'text' },
  { key: 'lineStrengthLevel', label: 'Крепость линейки', kind: 'number', min: 1, max: 5 },
  { key: 'estimatedStrengthLevel', label: 'Оценочная крепость', kind: 'number', min: 1, max: 5 },
  { key: 'brightnessLevel', label: 'Яркость', kind: 'number', min: 1, max: 5 },
  { key: 'flavorDescription', label: 'Описание вкуса', kind: 'textarea' },
  { key: 'isActive', label: 'Активен', kind: 'boolean' },
]

const hookahFields: ReferenceFieldConfig[] = [
  { key: 'manufacturer', label: 'Фирма', kind: 'text' },
  { key: 'name', label: 'Название', kind: 'text' },
  { key: 'innerDiameterMm', label: 'Внутренний диаметр, мм', kind: 'number', min: 1, step: 0.1 },
  { key: 'hasDiffuser', label: 'С диффузором', kind: 'boolean' },
  { key: 'isActive', label: 'Активен', kind: 'boolean' },
]

const bowlFields: ReferenceFieldConfig[] = [
  { key: 'manufacturer', label: 'Фирма', kind: 'text' },
  { key: 'name', label: 'Название', kind: 'text' },
  { key: 'bowlType', label: 'Тип', kind: 'select', options: bowlTypeOptions },
  { key: 'material', label: 'Материал', kind: 'text' },
  { key: 'capacityBucket', label: 'Граммовка', kind: 'select', options: capacityOptions },
  { key: 'isActive', label: 'Активна', kind: 'boolean' },
]

const kalaudFields: ReferenceFieldConfig[] = [
  { key: 'manufacturer', label: 'Фирма', kind: 'text' },
  { key: 'name', label: 'Название', kind: 'text' },
  { key: 'material', label: 'Материал', kind: 'text' },
  { key: 'color', label: 'Цвет', kind: 'text' },
  { key: 'isActive', label: 'Активен', kind: 'boolean' },
]

const charcoalFields: ReferenceFieldConfig[] = [
  { key: 'manufacturer', label: 'Фирма', kind: 'text' },
  { key: 'name', label: 'Название', kind: 'text' },
  { key: 'sizeLabel', label: 'Размер', kind: 'text' },
  { key: 'isActive', label: 'Активен', kind: 'boolean' },
]

const referenceTabs: ReferenceTabConfig[] = [
  {
    key: 'tobaccos',
    label: 'Табаки',
    title: 'Справочник табака',
    description:
      'Добавляйте бренды, линейки и вкусы в таблице. При вводе бренд и другие поля подсказывают уже существующие варианты.',
    addButtonLabel: 'Добавить табак',
    fields: tobaccoFields,
    columns: [
      { key: 'brand', label: 'Бренд', getValue: (item) => ('brand' in item ? item.brand : '') },
      { key: 'line', label: 'Линейка', getValue: (item) => ('line' in item ? item.line : '') },
      { key: 'flavorName', label: 'Вкус', getValue: (item) => ('flavorName' in item ? item.flavorName : '') },
      {
        key: 'estimatedStrengthLevel',
        label: 'Крепость',
        getValue: (item) => ('estimatedStrengthLevel' in item ? `${item.estimatedStrengthLevel}/5` : ''),
      },
      {
        key: 'brightnessLevel',
        label: 'Яркость',
        getValue: (item) => ('brightnessLevel' in item ? `${item.brightnessLevel}/5` : ''),
      },
      {
        key: 'isActive',
        label: 'Статус',
        getValue: (item) => (item.isActive ? 'Активен' : 'Скрыт'),
      },
    ],
  },
  {
    key: 'hookahs',
    label: 'Кальяны',
    title: 'Справочник кальянов',
    description: 'Фирма, модель, внутренний диаметр и наличие диффузора в удобной таблице.',
    addButtonLabel: 'Добавить кальян',
    fields: hookahFields,
    columns: [
      { key: 'manufacturer', label: 'Фирма', getValue: (item) => ('manufacturer' in item ? item.manufacturer : '') },
      { key: 'name', label: 'Название', getValue: (item) => ('name' in item ? item.name : '') },
      {
        key: 'innerDiameterMm',
        label: 'Диаметр',
        getValue: (item) => ('innerDiameterMm' in item ? `${item.innerDiameterMm} мм` : ''),
      },
      {
        key: 'hasDiffuser',
        label: 'Диффузор',
        getValue: (item) => ('hasDiffuser' in item ? (item.hasDiffuser ? 'Да' : 'Нет') : ''),
      },
      {
        key: 'isActive',
        label: 'Статус',
        getValue: (item) => (item.isActive ? 'Активен' : 'Скрыт'),
      },
    ],
  },
  {
    key: 'bowls',
    label: 'Чашки',
    title: 'Справочник чашек',
    description: 'Тип чашки, материал и размерная группа для быстрого поиска инвентаря.',
    addButtonLabel: 'Добавить чашку',
    fields: bowlFields,
    columns: [
      { key: 'manufacturer', label: 'Фирма', getValue: (item) => ('manufacturer' in item ? item.manufacturer : '') },
      { key: 'name', label: 'Название', getValue: (item) => ('name' in item ? item.name : '') },
      { key: 'bowlType', label: 'Тип', getValue: (item) => ('bowlType' in item ? item.bowlType : '') },
      {
        key: 'material',
        label: 'Материал',
        getValue: (item) => ('material' in item ? item.material ?? 'Не указан' : ''),
      },
      {
        key: 'capacityBucket',
        label: 'Граммовка',
        getValue: (item) => ('capacityBucket' in item ? item.capacityBucket : ''),
      },
    ],
  },
  {
    key: 'kalauds',
    label: 'Калауды',
    title: 'Справочник калаудов',
    description: 'Название, фирма, материал и цвет для рабочего набора мастера.',
    addButtonLabel: 'Добавить калауд',
    fields: kalaudFields,
    columns: [
      { key: 'manufacturer', label: 'Фирма', getValue: (item) => ('manufacturer' in item ? item.manufacturer : '') },
      { key: 'name', label: 'Название', getValue: (item) => ('name' in item ? item.name : '') },
      {
        key: 'material',
        label: 'Материал',
        getValue: (item) => ('material' in item ? item.material ?? 'Не указан' : ''),
      },
      {
        key: 'color',
        label: 'Цвет',
        getValue: (item) => ('color' in item ? item.color ?? 'Не указан' : ''),
      },
      {
        key: 'isActive',
        label: 'Статус',
        getValue: (item) => (item.isActive ? 'Активен' : 'Скрыт'),
      },
    ],
  },
  {
    key: 'charcoals',
    label: 'Уголь',
    title: 'Справочник угля',
    description: 'Размер, фирма и название угля в одном месте.',
    addButtonLabel: 'Добавить уголь',
    fields: charcoalFields,
    columns: [
      { key: 'manufacturer', label: 'Фирма', getValue: (item) => ('manufacturer' in item ? item.manufacturer : '') },
      { key: 'name', label: 'Название', getValue: (item) => ('name' in item ? item.name : '') },
      { key: 'sizeLabel', label: 'Размер', getValue: (item) => ('sizeLabel' in item ? item.sizeLabel : '') },
      {
        key: 'isActive',
        label: 'Статус',
        getValue: (item) => (item.isActive ? 'Активен' : 'Скрыт'),
      },
    ],
  },
]

const currentTab = computed(
  () => referenceTabs.find((tab) => tab.key === activeTab.value) ?? referenceTabs[0]!,
)

const currentItems = computed<EditableReferenceItem[]>(() => {
  switch (activeTab.value) {
    case 'tobaccos':
      return appDataStore.references.tobaccos
    case 'hookahs':
      return appDataStore.references.hookahs
    case 'bowls':
      return appDataStore.references.bowls
    case 'kalauds':
      return appDataStore.references.kalauds
    case 'charcoals':
      return appDataStore.references.charcoals
    default:
      return []
  }
})

async function createItem(
  entityType: ReferenceEntityType,
  payload: Record<string, string | number | boolean | undefined>,
) {
  if (!sessionStore.accessToken) {
    return
  }

  await appDataStore.createReference(sessionStore.accessToken, entityType, payload)
}

async function updateItem(
  entityType: ReferenceEntityType,
  itemId: string,
  payload: Record<string, string | number | boolean | undefined>,
) {
  if (!sessionStore.accessToken) {
    return
  }

  await appDataStore.updateReference(sessionStore.accessToken, entityType, itemId, payload)
}
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Admin references</p>
        <h2>Справочники оборудования и табака</h2>
      </div>
      <span class="pill">{{ currentItems.length }} записей</span>
    </div>

    <div class="tab-row">
      <button
        v-for="tab in referenceTabs"
        :key="tab.key"
        class="tab-row__button"
        :class="{ 'tab-row__button--active': activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
  </section>

  <AdminReferenceSection
    :title="currentTab.title"
    :description="currentTab.description"
    :entity-type="currentTab.key"
    :items="currentItems"
    :fields="currentTab.fields"
    :columns="currentTab.columns"
    :add-button-label="currentTab.addButtonLabel"
    @create="createItem"
    @update="updateItem"
  />
</template>
