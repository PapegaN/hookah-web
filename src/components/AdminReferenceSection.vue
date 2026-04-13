<script setup lang="ts">
import { reactive } from 'vue'

import type {
  EditableReferenceItem,
  ReferenceEntityType,
  ReferenceFieldConfig,
} from '@/types/app'

type FieldValue = string | number | boolean | undefined
type FormState = Record<string, FieldValue>

const props = defineProps<{
  title: string
  description: string
  entityType: ReferenceEntityType
  items: EditableReferenceItem[]
  fields: ReferenceFieldConfig[]
}>()

const emit = defineEmits<{
  create: [entityType: ReferenceEntityType, payload: Record<string, FieldValue>]
  update: [entityType: ReferenceEntityType, id: string, payload: Record<string, FieldValue>]
}>()

const createDraft = reactive<FormState>(buildEmptyDraft())
const editDrafts = reactive<Record<string, FormState>>({})

function buildEmptyDraft(): FormState {
  return Object.fromEntries(
    props.fields.map((field) => [
      field.key,
      field.kind === 'boolean' ? false : field.kind === 'number' ? 0 : '',
    ]),
  )
}

function getEditDraft(item: EditableReferenceItem): FormState {
  let draft = editDrafts[item.id]

  if (!draft) {
    draft = Object.fromEntries(
      props.fields.map((field) => [
        field.key,
        item[field.key as keyof EditableReferenceItem] as FieldValue,
      ]),
    )
    editDrafts[item.id] = draft
  }

  return draft
}

function submitCreate() {
  emit('create', props.entityType, normalizeDraft(createDraft))
  Object.assign(createDraft, buildEmptyDraft())
}

function submitUpdate(itemId: string) {
  const draft = editDrafts[itemId]

  if (!draft) {
    return
  }

  emit('update', props.entityType, itemId, normalizeDraft(draft))
}

function normalizeDraft(draft: FormState) {
  return Object.fromEntries(
    Object.entries(draft).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ]),
  )
}

function getItemTitle(item: EditableReferenceItem) {
  return 'flavorName' in item ? item.flavorName : item.name
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
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Admin editor</p>
        <h3>{{ title }}</h3>
      </div>
      <p class="section-copy">{{ description }}</p>
    </div>

    <div class="editor-card">
      <h4>Добавить новую запись</h4>
      <div class="editor-grid">
        <label v-for="field in fields" :key="field.key" class="field">
          <span>{{ field.label }}</span>

          <template v-if="field.kind === 'textarea'">
            <textarea
              :value="getTextValue(createDraft, field.key)"
              class="input textarea"
              rows="3"
              @input="updateTextValue(createDraft, field.key, $event)"
            />
          </template>

          <template v-else-if="field.kind === 'select'">
            <select
              :value="getTextValue(createDraft, field.key)"
              class="input"
              @change="updateTextValue(createDraft, field.key, $event)"
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
              :checked="getBooleanValue(createDraft, field.key)"
              class="toggle"
              type="checkbox"
              @change="updateBooleanValue(createDraft, field.key, $event)"
            />
          </template>

          <template v-else>
            <input
              :value="
                field.kind === 'number'
                  ? getNumberValue(createDraft, field.key)
                  : getTextValue(createDraft, field.key)
              "
              class="input"
              :type="field.kind === 'number' ? 'number' : 'text'"
              :min="field.min"
              :max="field.max"
              :step="field.step ?? 1"
              @input="
                field.kind === 'number'
                  ? updateNumberValue(createDraft, field.key, $event)
                  : updateTextValue(createDraft, field.key, $event)
              "
            />
          </template>
        </label>
      </div>

      <button class="button" type="button" @click="submitCreate">Создать запись</button>
    </div>

    <div class="stack">
      <article v-for="item in items" :key="item.id" class="editor-card">
        <div class="editor-card__header">
          <div>
            <p class="section-label">{{ entityType }}</p>
            <h4>{{ getItemTitle(item) }}</h4>
          </div>
          <span class="pill">{{ item.isActive ? 'Активно' : 'Скрыто' }}</span>
        </div>

        <div class="editor-grid">
          <label v-for="field in fields" :key="field.key" class="field">
            <span>{{ field.label }}</span>

            <template v-if="field.kind === 'textarea'">
              <textarea
                :value="getTextValue(getEditDraft(item), field.key)"
                class="input textarea"
                rows="3"
                @input="updateTextValue(getEditDraft(item), field.key, $event)"
              />
            </template>

            <template v-else-if="field.kind === 'select'">
              <select
                :value="getTextValue(getEditDraft(item), field.key)"
                class="input"
                @change="updateTextValue(getEditDraft(item), field.key, $event)"
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
                :checked="getBooleanValue(getEditDraft(item), field.key)"
                class="toggle"
                type="checkbox"
                @change="updateBooleanValue(getEditDraft(item), field.key, $event)"
              />
            </template>

            <template v-else>
              <input
                :value="
                  field.kind === 'number'
                    ? getNumberValue(getEditDraft(item), field.key)
                    : getTextValue(getEditDraft(item), field.key)
                "
                class="input"
                :type="field.kind === 'number' ? 'number' : 'text'"
                :min="field.min"
                :max="field.max"
                :step="field.step ?? 1"
                @input="
                  field.kind === 'number'
                    ? updateNumberValue(getEditDraft(item), field.key, $event)
                    : updateTextValue(getEditDraft(item), field.key, $event)
                "
              />
            </template>
          </label>
        </div>

        <button class="button button--secondary" type="button" @click="submitUpdate(item.id)">
          Сохранить изменения
        </button>
      </article>
    </div>
  </section>
</template>
