<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import type {
  EditableReferenceItem,
  ReferenceEntityType,
  ReferenceFieldConfig,
  ReferenceTableColumn,
} from '@/types/app'

type FieldValue = string | number | boolean | undefined
type FormState = Record<string, FieldValue>

const props = defineProps<{
  title: string
  description: string
  entityType: ReferenceEntityType
  items: EditableReferenceItem[]
  fields: ReferenceFieldConfig[]
  columns: ReferenceTableColumn[]
  addButtonLabel: string
}>()

const emit = defineEmits<{
  create: [entityType: ReferenceEntityType, payload: Record<string, FieldValue>]
  update: [entityType: ReferenceEntityType, id: string, payload: Record<string, FieldValue>]
}>()

const isModalOpen = ref(false)
const editingItemId = ref<string | null>(null)
const modalDraft = reactive<FormState>({})

const modalTitle = computed(() =>
  editingItemId.value ? `Редактировать: ${props.title}` : `Добавить: ${props.title}`,
)

const suggestionsByField = computed<Record<string, string[]>>(() =>
  Object.fromEntries(
    props.fields.map((field) => [
      field.key,
      [
        ...new Set(
          props.items
            .map((item) => item[field.key as keyof EditableReferenceItem])
            .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
            .map((value) => value.trim()),
        ),
      ].sort((left, right) => left.localeCompare(right, 'ru')),
    ]),
  ),
)

function buildEmptyDraft(): FormState {
  return Object.fromEntries(
    props.fields.map((field) => [
      field.key,
      field.kind === 'boolean' ? false : field.kind === 'number' ? 0 : '',
    ]),
  )
}

function openCreateModal() {
  editingItemId.value = null
  Object.assign(modalDraft, buildEmptyDraft())
  isModalOpen.value = true
}

function openEditModal(item: EditableReferenceItem) {
  editingItemId.value = item.id
  Object.assign(
    modalDraft,
    Object.fromEntries(
      props.fields.map((field) => [
        field.key,
        item[field.key as keyof EditableReferenceItem] as FieldValue,
      ]),
    ),
  )
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingItemId.value = null
  Object.assign(modalDraft, buildEmptyDraft())
}

function submitModal() {
  const payload = normalizeDraft(modalDraft)

  if (editingItemId.value) {
    emit('update', props.entityType, editingItemId.value, payload)
  } else {
    emit('create', props.entityType, payload)
  }

  closeModal()
}

function normalizeDraft(draft: FormState) {
  return Object.fromEntries(
    Object.entries(draft).map(([key, value]) => {
      if (typeof value === 'string') {
        const normalized = value.trim()
        return [key, normalized || undefined]
      }

      return [key, value]
    }),
  )
}

function getTextValue(draft: FormState, key: string) {
  const value = draft[key]

  if (typeof value === 'number') {
    return String(value)
  }

  return typeof value === 'string' ? value : ''
}

function getNumberValue(draft: FormState, key: string) {
  const value = draft[key]

  return typeof value === 'number' ? value : 0
}

function getBooleanValue(draft: FormState, key: string) {
  return draft[key] === true
}

function updateTextValue(draft: FormState, key: string, event: Event) {
  draft[key] = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value
}

function updateNumberValue(draft: FormState, key: string, event: Event) {
  const rawValue = (event.target as HTMLInputElement).value
  draft[key] = rawValue ? Number(rawValue) : 0
}

function updateBooleanValue(draft: FormState, key: string, event: Event) {
  draft[key] = (event.target as HTMLInputElement).checked
}

function getSuggestionListId(key: string) {
  return `${props.entityType}-${key}-suggestions`
}
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Reference table</p>
        <h2>{{ title }}</h2>
      </div>
      <button class="button button--primary" type="button" @click="openCreateModal">
        {{ addButtonLabel }}
      </button>
    </div>

    <p class="section-copy">{{ description }}</p>

    <div class="table-shell">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" scope="col">
              {{ column.label }}
            </th>
            <th scope="col">Действия</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td v-for="column in columns" :key="column.key">
              {{ column.getValue(item) }}
            </td>
            <td>
              <button class="button button--ghost" type="button" @click="openEditModal(item)">
                Изменить
              </button>
            </td>
          </tr>

          <tr v-if="items.length === 0">
            <td :colspan="columns.length + 1" class="data-table__empty">
              Пока в этом справочнике нет записей.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <section class="modal-card">
        <div class="panel__header">
          <div>
            <p class="section-label">Modal editor</p>
            <h3>{{ modalTitle }}</h3>
          </div>
          <button class="button button--ghost" type="button" @click="closeModal">Закрыть</button>
        </div>

        <div class="editor-grid">
          <label v-for="field in fields" :key="field.key" class="field">
            <span>{{ field.label }}</span>

            <template v-if="field.kind === 'textarea'">
              <textarea
                :value="getTextValue(modalDraft, field.key)"
                class="input textarea"
                rows="4"
                @input="updateTextValue(modalDraft, field.key, $event)"
              />
            </template>

            <template v-else-if="field.kind === 'select'">
              <select
                :value="getTextValue(modalDraft, field.key)"
                class="input"
                @change="updateTextValue(modalDraft, field.key, $event)"
              >
                <option
                  v-for="option in field.options ?? []"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </template>

            <template v-else-if="field.kind === 'boolean'">
              <input
                :checked="getBooleanValue(modalDraft, field.key)"
                class="toggle"
                type="checkbox"
                @change="updateBooleanValue(modalDraft, field.key, $event)"
              />
            </template>

            <template v-else>
              <div class="field__control">
                <input
                  :value="
                    field.kind === 'number'
                      ? getNumberValue(modalDraft, field.key)
                      : getTextValue(modalDraft, field.key)
                  "
                  class="input"
                  :type="field.kind === 'number' ? 'number' : 'text'"
                  :list="
                    field.kind === 'text' && (suggestionsByField[field.key]?.length ?? 0) > 0
                      ? getSuggestionListId(field.key)
                      : undefined
                  "
                  :min="field.min"
                  :max="field.max"
                  :step="field.step ?? 1"
                  @input="
                    field.kind === 'number'
                      ? updateNumberValue(modalDraft, field.key, $event)
                      : updateTextValue(modalDraft, field.key, $event)
                  "
                />

                <datalist
                  v-if="field.kind === 'text' && (suggestionsByField[field.key]?.length ?? 0) > 0"
                  :id="getSuggestionListId(field.key)"
                >
                  <option
                    v-for="suggestion in suggestionsByField[field.key]"
                    :key="suggestion"
                    :value="suggestion"
                  />
                </datalist>
              </div>
            </template>
          </label>
        </div>

        <div class="modal-actions">
          <button class="button button--ghost" type="button" @click="closeModal">Отмена</button>
          <button class="button button--primary" type="button" @click="submitModal">
            Сохранить
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
