<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import TobaccoPicker from '@/components/TobaccoPicker.vue'
import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'

const router = useRouter()
const sessionStore = useSessionStore()
const appDataStore = useAppDataStore()

const tableOptions = Array.from({ length: 8 }, (_, index) => `Стол ${index + 1}`)

const form = reactive({
  tableLabel: tableOptions[0] ?? 'Стол 1',
  description: '',
  selectedIds: [] as string[],
})

const submitError = ref<string | null>(null)

async function submitOrder() {
  if (!sessionStore.accessToken) {
    return
  }

  if (!form.tableLabel.trim()) {
    submitError.value = 'Выберите стол, за которым находится клиент.'
    return
  }

  if (!form.description.trim()) {
    submitError.value = 'Добавьте описание пожеланий к заказу.'
    return
  }

  if (form.selectedIds.length === 0) {
    submitError.value = 'Выберите хотя бы один вкус.'
    return
  }

  submitError.value = null

  await appDataStore.createOrder(sessionStore.accessToken, {
    tableLabel: form.tableLabel,
    description: form.description,
    requestedTobaccoIds: form.selectedIds,
  })

  form.description = ''
  form.selectedIds = []
  await router.push('/client/order/status')
}
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Client order</p>
        <h2>Соберите заказ на кальян</h2>
      </div>
      <p class="section-copy">
        Выберите стол, добавьте до трёх вкусов и опишите пожелания. Если заказ на
        этом столе уже существует, вы присоединитесь к общей забивке.
      </p>
    </div>

    <div class="editor-grid">
      <label class="field">
        <span>Стол</span>
        <select v-model="form.tableLabel" class="input">
          <option v-for="table in tableOptions" :key="table" :value="table">
            {{ table }}
          </option>
        </select>
      </label>
    </div>

    <label class="field">
      <span>Описание заказа</span>
      <textarea
        v-model="form.description"
        class="input textarea"
        rows="4"
        placeholder="Например: хочу мягкий ягодный кальян с холодком, без сильной крепости."
      />
    </label>

    <TobaccoPicker
      v-model:selected-ids="form.selectedIds"
      title="Палитра вкусов"
      description="Фильтруйте табаки по бренду, оценочной крепости и названию вкуса."
      :tobaccos="appDataStore.references.tobaccos"
    />

    <p v-if="submitError" class="form-error">{{ submitError }}</p>

    <button class="button button--primary" type="button" @click="submitOrder">
      Отправить заказ
    </button>
  </section>
</template>
