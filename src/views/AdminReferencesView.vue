<script setup lang="ts">
import AdminReferenceSection from '@/components/AdminReferenceSection.vue'
import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import type { ReferenceFieldConfig, ReferenceEntityType } from '@/types/app'

const appDataStore = useAppDataStore()
const sessionStore = useSessionStore()

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
  { key: 'lineStrengthLevel', label: 'Крепость линии', kind: 'number', min: 1, max: 5 },
  {
    key: 'estimatedStrengthLevel',
    label: 'Оценочная крепость',
    kind: 'number',
    min: 1,
    max: 5,
  },
  { key: 'brightnessLevel', label: 'Яркость', kind: 'number', min: 1, max: 5 },
  { key: 'flavorDescription', label: 'Описание вкуса', kind: 'textarea' },
  { key: 'isActive', label: 'Активен', kind: 'boolean' },
]

const hookahFields: ReferenceFieldConfig[] = [
  { key: 'manufacturer', label: 'Фирма', kind: 'text' },
  { key: 'name', label: 'Название', kind: 'text' },
  { key: 'innerDiameterMm', label: 'Внутренний диаметр', kind: 'number', min: 1, step: 0.1 },
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
  <div class="stack">
    <AdminReferenceSection
      title="Табаки"
      description="Бренд, линейка, вкус, описание, оценочная крепость и яркость."
      entity-type="tobaccos"
      :items="appDataStore.references.tobaccos"
      :fields="tobaccoFields"
      @create="createItem"
      @update="updateItem"
    />

    <AdminReferenceSection
      title="Кальяны"
      description="Фирма, название, внутренний диаметр и наличие диффузора."
      entity-type="hookahs"
      :items="appDataStore.references.hookahs"
      :fields="hookahFields"
      @create="createItem"
      @update="updateItem"
    />

    <AdminReferenceSection
      title="Чашки"
      description="Тип чашки, материал и размерная группа."
      entity-type="bowls"
      :items="appDataStore.references.bowls"
      :fields="bowlFields"
      @create="createItem"
      @update="updateItem"
    />

    <AdminReferenceSection
      title="Калауды"
      description="Редактирование названия, фирмы, материала и цвета."
      entity-type="kalauds"
      :items="appDataStore.references.kalauds"
      :fields="kalaudFields"
      @create="createItem"
      @update="updateItem"
    />

    <AdminReferenceSection
      title="Уголь"
      description="Название, фирма и размер кубика."
      entity-type="charcoals"
      :items="appDataStore.references.charcoals"
      :fields="charcoalFields"
      @create="createItem"
      @update="updateItem"
    />
  </div>
</template>
