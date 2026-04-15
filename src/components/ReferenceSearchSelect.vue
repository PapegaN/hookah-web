<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: string
  label: string
  placeholder?: string
  options: Array<{
    id: string
    title: string
    subtitle?: string
  }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectedLabel = computed(
  () => props.options.find((option) => option.id === props.modelValue)?.title ?? '',
)

const inputId = computed(() =>
  `reference-search-${props.label.toLowerCase().replace(/\s+/g, '-')}`,
)
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <input
      class="input"
      :list="`${inputId}-options`"
      :placeholder="placeholder ?? 'Начните вводить название...'"
      :value="selectedLabel"
      type="text"
      @input="
        emit(
          'update:modelValue',
          options.find((option) => option.title === String(($event.target as HTMLInputElement).value))
            ?.id ?? '',
        )
      "
    />
    <datalist :id="`${inputId}-options`">
      <option v-for="option in options" :key="option.id" :value="option.title">
        {{ option.subtitle }}
      </option>
    </datalist>
  </label>
</template>
