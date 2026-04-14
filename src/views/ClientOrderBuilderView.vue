<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import BlendComposer from '@/components/BlendComposer.vue'
import ReferenceSearchSelect from '@/components/ReferenceSearchSelect.vue'
import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import type { CreateOrderPayload } from '@/types/app'

const router = useRouter()
const sessionStore = useSessionStore()
const appDataStore = useAppDataStore()

const tableOptions = Array.from({ length: 8 }, (_, index) => `Стол ${index + 1}`)
const packingOptions = [
  { label: 'Слоями', value: 'layers' },
  { label: 'Секторами', value: 'sectors' },
  { label: 'Компот', value: 'kompot' },
  { label: 'Необычный', value: 'custom' },
]

const form = reactive<CreateOrderPayload>({
  tableLabel: tableOptions[0] ?? 'Стол 1',
  description: '',
  requestedBlend: [],
  requestedSetup: {
    heatingSystemType: 'coal',
    packingStyle: 'kompot',
    customPackingStyle: '',
    hookahId: '',
    bowlId: '',
    kalaudId: '',
    charcoalId: '',
    electricHeadId: '',
    charcoalCount: 3,
    warmupMode: 'with_cap' as const,
    warmupDurationMinutes: 6,
  },
})

const submitError = ref<string | null>(null)

const hookahOptions = computed(() =>
  appDataStore.references.hookahs.map((item) => ({
    id: item.id,
    title: `${item.manufacturer} ${item.name}`,
    subtitle: `${item.innerDiameterMm} мм`,
  })),
)
const bowlOptions = computed(() =>
  appDataStore.references.bowls.map((item) => ({
    id: item.id,
    title: `${item.manufacturer} ${item.name}`,
    subtitle: item.bowlType,
  })),
)
const kalaudOptions = computed(() =>
  appDataStore.references.kalauds.map((item) => ({
    id: item.id,
    title: `${item.manufacturer} ${item.name}`,
    subtitle: item.material,
  })),
)
const charcoalOptions = computed(() =>
  appDataStore.references.charcoals.map((item) => ({
    id: item.id,
    title: `${item.manufacturer} ${item.name}`,
    subtitle: item.sizeLabel,
  })),
)
const electricHeadOptions = computed(() =>
  appDataStore.references.electricHeads.map((item) => ({
    id: item.id,
    title: `${item.manufacturer} ${item.name}`,
  })),
)

async function submitOrder() {
  if (!sessionStore.accessToken) return

  if (!form.description.trim()) {
    submitError.value = 'Добавьте описание пожеланий к заказу.'
    return
  }

  if (form.requestedBlend.length === 0) {
    submitError.value = 'Выберите хотя бы один вкус.'
    return
  }

  const total = form.requestedBlend.reduce((sum, item) => sum + item.percentage, 0)
  if (total !== 100) {
    submitError.value = 'Проценты в миксе должны давать ровно 100.'
    return
  }

  submitError.value = null

  await appDataStore.createOrder(sessionStore.accessToken, {
    tableLabel: form.tableLabel,
    description: form.description,
    requestedBlend: form.requestedBlend,
    requestedSetup: {
      ...form.requestedSetup,
      customPackingStyle:
        form.requestedSetup.packingStyle === 'custom'
          ? form.requestedSetup.customPackingStyle
          : undefined,
      hookahId: form.requestedSetup.hookahId || undefined,
      bowlId: form.requestedSetup.heatingSystemType === 'coal' ? form.requestedSetup.bowlId || undefined : undefined,
      kalaudId: form.requestedSetup.heatingSystemType === 'coal' ? form.requestedSetup.kalaudId || undefined : undefined,
      charcoalId: form.requestedSetup.heatingSystemType === 'coal' ? form.requestedSetup.charcoalId || undefined : undefined,
      electricHeadId:
        form.requestedSetup.heatingSystemType === 'electric'
          ? form.requestedSetup.electricHeadId || undefined
          : undefined,
    },
  })

  await router.push('/client/order/status')
}
</script>

<template>
  <section class="panel stack">
    <div class="panel__header">
      <div>
        <p class="section-label">Client order</p>
        <h2>Соберите заказ на кальян</h2>
      </div>
      <p class="section-copy">
        Выберите стол, опишите пожелания, соберите микс и укажите желаемую конфигурацию.
      </p>
    </div>

    <div class="editor-grid">
      <label class="field">
        <span>Стол</span>
        <select v-model="form.tableLabel" class="input">
          <option v-for="table in tableOptions" :key="table" :value="table">{{ table }}</option>
        </select>
      </label>

      <label class="field">
        <span>Система прогрева</span>
        <select v-model="form.requestedSetup.heatingSystemType" class="input">
          <option value="coal">Уголь + калауд</option>
          <option value="electric">Электрическая чаша Hookah Pro</option>
        </select>
      </label>
    </div>

    <label class="field">
      <span>Описание заказа</span>
      <textarea v-model="form.description" class="input textarea" rows="4" placeholder="Например: мягкий ягодный микс с холодком и лёгкой сладостью." />
    </label>

    <BlendComposer
      v-model="form.requestedBlend"
      title="Палитра вкусов"
      description="Выберите до трёх табаков и задайте процентное соотношение."
      :tobaccos="appDataStore.references.tobaccos"
    />

    <section class="panel panel--tight">
      <div class="panel__header">
        <div>
          <p class="section-label">Setup</p>
          <h3>Желаемая конфигурация</h3>
        </div>
      </div>

      <div class="editor-grid">
        <ReferenceSearchSelect v-model="form.requestedSetup.hookahId" label="Кальян" :options="hookahOptions" />

        <label class="field">
          <span>Вариант забивки</span>
          <select v-model="form.requestedSetup.packingStyle" class="input">
            <option v-for="option in packingOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>

      <label v-if="form.requestedSetup.packingStyle === 'custom'" class="field">
        <span>Описание необычной забивки</span>
        <input v-model="form.requestedSetup.customPackingStyle" class="input" type="text" placeholder="Например: диагональный градиент с акцентом на верхнем слое" />
      </label>

      <div v-if="form.requestedSetup.heatingSystemType === 'coal'" class="editor-grid">
        <ReferenceSearchSelect v-model="form.requestedSetup.bowlId" label="Чашка" :options="bowlOptions" />
        <ReferenceSearchSelect v-model="form.requestedSetup.kalaudId" label="Калауд" :options="kalaudOptions" />
        <ReferenceSearchSelect v-model="form.requestedSetup.charcoalId" label="Уголь" :options="charcoalOptions" />

        <label class="field">
          <span>Количество углей</span>
          <input v-model="form.requestedSetup.charcoalCount" class="input" min="1" type="number" />
        </label>

        <label class="field">
          <span>Режим прогрева</span>
          <select v-model="form.requestedSetup.warmupMode" class="input">
            <option value="with_cap">С колпаком</option>
            <option value="without_cap">Без колпака</option>
          </select>
        </label>

        <label class="field">
          <span>Время прогрева, минут</span>
          <input v-model="form.requestedSetup.warmupDurationMinutes" class="input" min="1" type="number" />
        </label>
      </div>

      <div v-else class="editor-grid">
        <ReferenceSearchSelect v-model="form.requestedSetup.electricHeadId" label="Электрическая чаша" :options="electricHeadOptions" />
      </div>
    </section>

    <p v-if="submitError" class="form-error">{{ submitError }}</p>

    <button class="button button--primary" type="button" @click="submitOrder">
      Отправить заказ
    </button>
  </section>
</template>
