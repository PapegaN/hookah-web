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
  { label: 'Р’РµРґСЂРѕ', value: 'bucket' },
  { label: 'Р‘РѕР»СЊС€Р°СЏ', value: 'large' },
  { label: 'РЎСЂРµРґРЅСЏСЏ', value: 'medium' },
  { label: 'РњР°Р»Р°СЏ', value: 'small' },
  { label: 'РћС‡РµРЅСЊ РјР°Р»Р°СЏ', value: 'very_small' },
]

const tobaccoFields: ReferenceFieldConfig[] = [
  { key: 'brand', label: 'Р‘СЂРµРЅРґ', kind: 'text' },
  { key: 'line', label: 'Р›РёРЅРµР№РєР°', kind: 'text' },
  { key: 'flavorName', label: 'Р’РєСѓСЃ', kind: 'text' },
  { key: 'markingCode', label: 'Честный знак', kind: 'text' },
  { key: 'markingGtin', label: 'GTIN', kind: 'text' },
  { key: 'lineStrengthLevel', label: 'РљСЂРµРїРѕСЃС‚СЊ Р»РёРЅРµР№РєРё', kind: 'number', min: 1, max: 5 },
  { key: 'estimatedStrengthLevel', label: 'РћС†РµРЅРѕС‡РЅР°СЏ РєСЂРµРїРѕСЃС‚СЊ', kind: 'number', min: 1, max: 5 },
  { key: 'brightnessLevel', label: 'РЇСЂРєРѕСЃС‚СЊ', kind: 'number', min: 1, max: 5 },
  { key: 'flavorDescription', label: 'РћРїРёСЃР°РЅРёРµ РІРєСѓСЃР°', kind: 'textarea' },
  { key: 'flavorTags', label: 'Теги вкуса (через запятую)', kind: 'text' },
  { key: 'inStock', label: 'В наличии', kind: 'boolean' },
  { key: 'isActive', label: 'РђРєС‚РёРІРµРЅ', kind: 'boolean' },
]

const tobaccoTagFields: ReferenceFieldConfig[] = [
  { key: 'name', label: 'Название', kind: 'text' },
  { key: 'isActive', label: 'Активен', kind: 'boolean' },
]

const hookahFields: ReferenceFieldConfig[] = [
  { key: 'manufacturer', label: 'Р¤РёСЂРјР°', kind: 'text' },
  { key: 'name', label: 'РќР°Р·РІР°РЅРёРµ', kind: 'text' },
  { key: 'innerDiameterMm', label: 'Р’РЅСѓС‚СЂРµРЅРЅРёР№ РґРёР°РјРµС‚СЂ, РјРј', kind: 'number', min: 1, step: 0.1 },
  { key: 'hasDiffuser', label: 'РЎ РґРёС„С„СѓР·РѕСЂРѕРј', kind: 'boolean' },
  { key: 'isActive', label: 'РђРєС‚РёРІРµРЅ', kind: 'boolean' },
]

const bowlFields: ReferenceFieldConfig[] = [
  { key: 'manufacturer', label: 'Р¤РёСЂРјР°', kind: 'text' },
  { key: 'name', label: 'РќР°Р·РІР°РЅРёРµ', kind: 'text' },
  { key: 'bowlType', label: 'РўРёРї', kind: 'select', options: bowlTypeOptions },
  { key: 'material', label: 'РњР°С‚РµСЂРёР°Р»', kind: 'text' },
  { key: 'capacityBucket', label: 'Р“СЂР°РјРјРѕРІРєР°', kind: 'select', options: capacityOptions },
  { key: 'isActive', label: 'РђРєС‚РёРІРЅР°', kind: 'boolean' },
]

const kalaudFields: ReferenceFieldConfig[] = [
  { key: 'manufacturer', label: 'Р¤РёСЂРјР°', kind: 'text' },
  { key: 'name', label: 'РќР°Р·РІР°РЅРёРµ', kind: 'text' },
  { key: 'material', label: 'РњР°С‚РµСЂРёР°Р»', kind: 'text' },
  { key: 'color', label: 'Р¦РІРµС‚', kind: 'text' },
  { key: 'isActive', label: 'РђРєС‚РёРІРµРЅ', kind: 'boolean' },
]

const charcoalFields: ReferenceFieldConfig[] = [
  { key: 'manufacturer', label: 'Р¤РёСЂРјР°', kind: 'text' },
  { key: 'name', label: 'РќР°Р·РІР°РЅРёРµ', kind: 'text' },
  { key: 'sizeLabel', label: 'Р Р°Р·РјРµСЂ', kind: 'text' },
  { key: 'isActive', label: 'РђРєС‚РёРІРµРЅ', kind: 'boolean' },
]

const electricHeadFields: ReferenceFieldConfig[] = [
  { key: 'manufacturer', label: 'Фирма', kind: 'text' },
  { key: 'name', label: 'Название', kind: 'text' },
  { key: 'isActive', label: 'Активен', kind: 'boolean' },
]

const referenceTabs: ReferenceTabConfig[] = [
  {
    key: 'tobaccos',
    label: 'РўР°Р±Р°РєРё',
    title: 'РЎРїСЂР°РІРѕС‡РЅРёРє С‚Р°Р±Р°РєР°',
    description:
      'Р”РѕР±Р°РІР»СЏР№С‚Рµ Р±СЂРµРЅРґС‹, Р»РёРЅРµР№РєРё Рё РІРєСѓСЃС‹ РІ С‚Р°Р±Р»РёС†Рµ. РџСЂРё РІРІРѕРґРµ Р±СЂРµРЅРґ Рё РґСЂСѓРіРёРµ РїРѕР»СЏ РїРѕРґСЃРєР°Р·С‹РІР°СЋС‚ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРµ РІР°СЂРёР°РЅС‚С‹.',
    addButtonLabel: 'Р”РѕР±Р°РІРёС‚СЊ С‚Р°Р±Р°Рє',
    fields: tobaccoFields,
    columns: [
      { key: 'brand', label: 'Р‘СЂРµРЅРґ', getValue: (item) => ('brand' in item ? item.brand : '') },
      { key: 'line', label: 'Р›РёРЅРµР№РєР°', getValue: (item) => ('line' in item ? item.line : '') },
      { key: 'flavorName', label: 'Р’РєСѓСЃ', getValue: (item) => ('flavorName' in item ? item.flavorName : '') },
      {
        key: 'markingCode',
        label: 'Честный знак',
        getValue: (item) => ('markingCode' in item ? item.markingCode ?? 'Не указан' : ''),
      },
      {
        key: 'markingGtin',
        label: 'GTIN',
        getValue: (item) => ('markingGtin' in item ? item.markingGtin ?? 'Не указан' : ''),
      },
      {
        key: 'estimatedStrengthLevel',
        label: 'РљСЂРµРїРѕСЃС‚СЊ',
        getValue: (item) => ('estimatedStrengthLevel' in item ? `${item.estimatedStrengthLevel}/5` : ''),
      },
      {
        key: 'brightnessLevel',
        label: 'РЇСЂРєРѕСЃС‚СЊ',
        getValue: (item) => ('brightnessLevel' in item ? `${item.brightnessLevel}/5` : ''),
      },
      {
        key: 'isActive',
        label: 'РЎС‚Р°С‚СѓСЃ',
        getValue: (item) => (item.isActive ? 'РђРєС‚РёРІРµРЅ' : 'РЎРєСЂС‹С‚'),
      },
      {
        key: 'inStock',
        label: 'Наличие',
        getValue: (item) => ('inStock' in item ? (item.inStock ? 'В наличии' : 'Нет в наличии') : ''),
      },
      {
        key: 'flavorTags',
        label: 'Теги',
        getValue: (item) => ('flavorTags' in item ? item.flavorTags.map((tag) => tag.name).join(', ') : ''),
      },
    ],
  },
  {
    key: 'tobacco_tags',
    label: 'Теги вкусов',
    title: 'Справочник тегов табака',
    description: 'Используется для фильтрации и поиска по вкусам. Один табак может иметь несколько тегов.',
    addButtonLabel: 'Добавить тег',
    fields: tobaccoTagFields,
    columns: [
      { key: 'name', label: 'Название', getValue: (item) => ('name' in item ? item.name : '') },
      { key: 'isActive', label: 'Статус', getValue: (item) => (item.isActive ? 'Активен' : 'Скрыт') },
    ],
  },
  {
    key: 'hookahs',
    label: 'РљР°Р»СЊСЏРЅС‹',
    title: 'РЎРїСЂР°РІРѕС‡РЅРёРє РєР°Р»СЊСЏРЅРѕРІ',
    description: 'Р¤РёСЂРјР°, РјРѕРґРµР»СЊ, РІРЅСѓС‚СЂРµРЅРЅРёР№ РґРёР°РјРµС‚СЂ Рё РЅР°Р»РёС‡РёРµ РґРёС„С„СѓР·РѕСЂР° РІ СѓРґРѕР±РЅРѕР№ С‚Р°Р±Р»РёС†Рµ.',
    addButtonLabel: 'Р”РѕР±Р°РІРёС‚СЊ РєР°Р»СЊСЏРЅ',
    fields: hookahFields,
    columns: [
      { key: 'manufacturer', label: 'Р¤РёСЂРјР°', getValue: (item) => ('manufacturer' in item ? item.manufacturer : '') },
      { key: 'name', label: 'РќР°Р·РІР°РЅРёРµ', getValue: (item) => ('name' in item ? item.name : '') },
      {
        key: 'innerDiameterMm',
        label: 'Р”РёР°РјРµС‚СЂ',
        getValue: (item) => ('innerDiameterMm' in item ? `${item.innerDiameterMm} РјРј` : ''),
      },
      {
        key: 'hasDiffuser',
        label: 'Р”РёС„С„СѓР·РѕСЂ',
        getValue: (item) => ('hasDiffuser' in item ? (item.hasDiffuser ? 'Р”Р°' : 'РќРµС‚') : ''),
      },
      {
        key: 'isActive',
        label: 'РЎС‚Р°С‚СѓСЃ',
        getValue: (item) => (item.isActive ? 'РђРєС‚РёРІРµРЅ' : 'РЎРєСЂС‹С‚'),
      },
    ],
  },
  {
    key: 'bowls',
    label: 'Р§Р°С€РєРё',
    title: 'РЎРїСЂР°РІРѕС‡РЅРёРє С‡Р°С€РµРє',
    description: 'РўРёРї С‡Р°С€РєРё, РјР°С‚РµСЂРёР°Р» Рё СЂР°Р·РјРµСЂРЅР°СЏ РіСЂСѓРїРїР° РґР»СЏ Р±С‹СЃС‚СЂРѕРіРѕ РїРѕРёСЃРєР° РёРЅРІРµРЅС‚Р°СЂСЏ.',
    addButtonLabel: 'Р”РѕР±Р°РІРёС‚СЊ С‡Р°С€РєСѓ',
    fields: bowlFields,
    columns: [
      { key: 'manufacturer', label: 'Р¤РёСЂРјР°', getValue: (item) => ('manufacturer' in item ? item.manufacturer : '') },
      { key: 'name', label: 'РќР°Р·РІР°РЅРёРµ', getValue: (item) => ('name' in item ? item.name : '') },
      { key: 'bowlType', label: 'РўРёРї', getValue: (item) => ('bowlType' in item ? item.bowlType : '') },
      {
        key: 'material',
        label: 'РњР°С‚РµСЂРёР°Р»',
        getValue: (item) => ('material' in item ? item.material ?? 'РќРµ СѓРєР°Р·Р°РЅ' : ''),
      },
      {
        key: 'capacityBucket',
        label: 'Р“СЂР°РјРјРѕРІРєР°',
        getValue: (item) => ('capacityBucket' in item ? item.capacityBucket : ''),
      },
    ],
  },
  {
    key: 'kalauds',
    label: 'РљР°Р»Р°СѓРґС‹',
    title: 'РЎРїСЂР°РІРѕС‡РЅРёРє РєР°Р»Р°СѓРґРѕРІ',
    description: 'РќР°Р·РІР°РЅРёРµ, С„РёСЂРјР°, РјР°С‚РµСЂРёР°Р» Рё С†РІРµС‚ РґР»СЏ СЂР°Р±РѕС‡РµРіРѕ РЅР°Р±РѕСЂР° РјР°СЃС‚РµСЂР°.',
    addButtonLabel: 'Р”РѕР±Р°РІРёС‚СЊ РєР°Р»Р°СѓРґ',
    fields: kalaudFields,
    columns: [
      { key: 'manufacturer', label: 'Р¤РёСЂРјР°', getValue: (item) => ('manufacturer' in item ? item.manufacturer : '') },
      { key: 'name', label: 'РќР°Р·РІР°РЅРёРµ', getValue: (item) => ('name' in item ? item.name : '') },
      {
        key: 'material',
        label: 'РњР°С‚РµСЂРёР°Р»',
        getValue: (item) => ('material' in item ? item.material ?? 'РќРµ СѓРєР°Р·Р°РЅ' : ''),
      },
      {
        key: 'color',
        label: 'Р¦РІРµС‚',
        getValue: (item) => ('color' in item ? item.color ?? 'РќРµ СѓРєР°Р·Р°РЅ' : ''),
      },
      {
        key: 'isActive',
        label: 'РЎС‚Р°С‚СѓСЃ',
        getValue: (item) => (item.isActive ? 'РђРєС‚РёРІРµРЅ' : 'РЎРєСЂС‹С‚'),
      },
    ],
  },
  {
    key: 'charcoals',
    label: 'РЈРіРѕР»СЊ',
    title: 'РЎРїСЂР°РІРѕС‡РЅРёРє СѓРіР»СЏ',
    description: 'Р Р°Р·РјРµСЂ, С„РёСЂРјР° Рё РЅР°Р·РІР°РЅРёРµ СѓРіР»СЏ РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ.',
    addButtonLabel: 'Р”РѕР±Р°РІРёС‚СЊ СѓРіРѕР»СЊ',
    fields: charcoalFields,
    columns: [
      { key: 'manufacturer', label: 'Р¤РёСЂРјР°', getValue: (item) => ('manufacturer' in item ? item.manufacturer : '') },
      { key: 'name', label: 'РќР°Р·РІР°РЅРёРµ', getValue: (item) => ('name' in item ? item.name : '') },
      { key: 'sizeLabel', label: 'Р Р°Р·РјРµСЂ', getValue: (item) => ('sizeLabel' in item ? item.sizeLabel : '') },
      {
        key: 'isActive',
        label: 'РЎС‚Р°С‚СѓСЃ',
        getValue: (item) => (item.isActive ? 'РђРєС‚РёРІРµРЅ' : 'РЎРєСЂС‹С‚'),
      },
    ],
  },
  {
    key: 'electric_heads',
    label: 'Электро чаши',
    title: 'Справочник электрических чаш',
    description: 'Используется для альтернативного сценария прогрева без углей и калауда.',
    addButtonLabel: 'Добавить электро чашу',
    fields: electricHeadFields,
    columns: [
      { key: 'manufacturer', label: 'Фирма', getValue: (item) => ('manufacturer' in item ? item.manufacturer : '') },
      { key: 'name', label: 'Название', getValue: (item) => ('name' in item ? item.name : '') },
      { key: 'isActive', label: 'Статус', getValue: (item) => (item.isActive ? 'Активен' : 'Скрыт') },
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
    case 'tobacco_tags':
      return appDataStore.references.tobaccoTags
    case 'hookahs':
      return appDataStore.references.hookahs
    case 'bowls':
      return appDataStore.references.bowls
    case 'kalauds':
      return appDataStore.references.kalauds
    case 'charcoals':
      return appDataStore.references.charcoals
    case 'electric_heads':
      return appDataStore.references.electricHeads
    default:
      return []
  }
})

async function createItem(
  entityType: ReferenceEntityType,
  payload: Record<string, string | number | boolean | string[] | undefined>,
) {
  if (!sessionStore.accessToken) {
    return
  }

  await appDataStore.createReference(
    sessionStore.accessToken,
    entityType,
    normalizeReferencePayload(entityType, payload),
  )
}

async function updateItem(
  entityType: ReferenceEntityType,
  itemId: string,
  payload: Record<string, string | number | boolean | string[] | undefined>,
) {
  if (!sessionStore.accessToken) {
    return
  }

  await appDataStore.updateReference(
    sessionStore.accessToken,
    entityType,
    itemId,
    normalizeReferencePayload(entityType, payload),
  )
}

function normalizeReferencePayload(
  entityType: ReferenceEntityType,
  payload: Record<string, string | number | boolean | string[] | undefined>,
) {
  if (entityType !== 'tobaccos') {
    return payload
  }

  return {
    ...payload,
    flavorTags:
      typeof payload.flavorTags === 'string'
        ? payload.flavorTags
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [],
  }
}
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Admin references</p>
        <h2>РЎРїСЂР°РІРѕС‡РЅРёРєРё РѕР±РѕСЂСѓРґРѕРІР°РЅРёСЏ Рё С‚Р°Р±Р°РєР°</h2>
      </div>
      <span class="pill">{{ currentItems.length }} Р·Р°РїРёСЃРµР№</span>
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




