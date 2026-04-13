<script setup lang="ts">
import { reactive, ref } from 'vue'

import { ApiError, api } from '@/lib/api'
import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import type { SettingsResource } from '@/types/app'

interface ResourceCard {
  resource: SettingsResource
  title: string
  description: string
}

const sessionStore = useSessionStore()
const appDataStore = useAppDataStore()
const importFiles = reactive<Partial<Record<SettingsResource, File | null>>>({})
const isBusy = ref(false)
const statusMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

const resourceCards: ResourceCard[] = [
  {
    resource: 'users',
    title: 'Пользователи',
    description: 'Выгрузка аккаунтов, ролей, апрува и контактных данных.',
  },
  {
    resource: 'tobaccos',
    title: 'Табаки',
    description: 'Бренды, линейки, вкусы, крепость и яркость.',
  },
  {
    resource: 'hookahs',
    title: 'Кальяны',
    description: 'Фирма, модель, диаметр и диффузор.',
  },
  {
    resource: 'bowls',
    title: 'Чашки',
    description: 'Тип, материал и размерная группа чаш.',
  },
  {
    resource: 'kalauds',
    title: 'Калауды',
    description: 'Рабочие аксессуары мастера и их свойства.',
  },
  {
    resource: 'charcoals',
    title: 'Уголь',
    description: 'Размеры и производители угля.',
  },
  {
    resource: 'orders',
    title: 'Заказы',
    description: 'Заявки по столам, статусы, фактические забивки и отзывы.',
  },
]

async function handleExport(resource: SettingsResource) {
  if (!sessionStore.accessToken) {
    return
  }

  clearMessages()
  isBusy.value = true

  try {
    const response = resource === 'backup'
      ? await api.exportBackup(sessionStore.accessToken)
      : await api.exportSettings(sessionStore.accessToken, resource)

    downloadJson(`${resource}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`, response)
    statusMessage.value = `Экспорт «${getResourceLabel(resource)}» подготовлен.`
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    isBusy.value = false
  }
}

async function handleImport(resource: SettingsResource) {
  if (!sessionStore.accessToken || !sessionStore.currentUser) {
    return
  }

  const file = importFiles[resource]

  if (!file) {
    errorMessage.value = `Выберите файл для раздела «${getResourceLabel(resource)}».`
    return
  }

  clearMessages()
  isBusy.value = true

  try {
    const raw = await file.text()
    const parsed = JSON.parse(raw) as { data?: unknown }
    const payload = 'data' in parsed ? parsed.data : parsed
    const response = resource === 'backup'
      ? await api.importBackup(sessionStore.accessToken, payload)
      : await api.importSettings(sessionStore.accessToken, resource, payload)

    await appDataStore.bootstrap(sessionStore.accessToken, sessionStore.currentUser)
    importFiles[resource] = null
    statusMessage.value = `Импорт завершён: ${response.importedCount} записей для раздела «${getResourceLabel(resource)}».`
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    isBusy.value = false
  }
}

function setImportFile(resource: SettingsResource, event: Event) {
  const input = event.target as HTMLInputElement
  importFiles[resource] = input.files?.[0] ?? null
}

function clearMessages() {
  statusMessage.value = null
  errorMessage.value = null
}

function getResourceLabel(resource: SettingsResource) {
  return resourceCards.find((card) => card.resource === resource)?.title ?? 'Полный backup'
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message || 'Операция не выполнилась.'
  }

  if (error instanceof SyntaxError) {
    return 'Файл не похож на валидный JSON.'
  }

  return 'Не удалось выполнить операцию. Проверьте файл и соединение с API.'
}
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Admin settings</p>
        <h2>Резервные копии и перенос данных</h2>
      </div>
      <button class="button button--primary" type="button" :disabled="isBusy" @click="handleExport('backup')">
        Скачать полный backup
      </button>
    </div>

    <p class="section-copy">
      Здесь можно выгрузить справочники и заказы в JSON, а также восстановить данные из backup. Это удобно для резюме,
      демо-стендов и переноса локальной базы между окружениями.
    </p>

    <div v-if="statusMessage" class="status-banner">
      <strong>Готово.</strong>
      <p>{{ statusMessage }}</p>
    </div>

    <div v-if="errorMessage" class="status-banner status-banner--error">
      <strong>Операция завершилась с ошибкой.</strong>
      <p>{{ errorMessage }}</p>
    </div>
  </section>

  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Full restore</p>
        <h3>Импорт полного backup</h3>
      </div>
    </div>

    <div class="editor-grid">
      <label class="field">
        <span>JSON backup</span>
        <input class="input" type="file" accept="application/json" @change="setImportFile('backup', $event)" />
      </label>
    </div>

    <div class="modal-actions">
      <button class="button button--secondary" type="button" :disabled="isBusy" @click="handleImport('backup')">
        Импортировать backup
      </button>
    </div>
  </section>

  <section class="stack">
    <article v-for="card in resourceCards" :key="card.resource" class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">{{ card.resource }}</p>
          <h3>{{ card.title }}</h3>
        </div>
        <button class="button button--ghost" type="button" :disabled="isBusy" @click="handleExport(card.resource)">
          Экспорт
        </button>
      </div>

      <p class="section-copy">{{ card.description }}</p>

      <div class="editor-grid">
        <label class="field">
          <span>JSON файл для импорта</span>
          <input class="input" type="file" accept="application/json" @change="setImportFile(card.resource, $event)" />
        </label>
      </div>

      <div class="modal-actions">
        <button class="button button--primary" type="button" :disabled="isBusy" @click="handleImport(card.resource)">
          Импортировать
        </button>
      </div>
    </article>
  </section>
</template>
