<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { ApiError, api } from '@/lib/api'
import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import type { BackupAuditEvent, MediaAsset, MediaUsageType, SettingsResource } from '@/types/app'

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
const backupAuditEvents = ref<BackupAuditEvent[]>([])
const mediaAssets = ref<MediaAsset[]>([])
const mediaFile = ref<File | null>(null)
const mediaUsageType = ref<MediaUsageType>('tobacco_gallery')
const mediaUploadMessage = ref<string | null>(null)
const mediaUploadError = ref<string | null>(null)

const resourceCards: ResourceCard[] = [
  {
    resource: 'tobacco_tags',
    title: 'Теги вкусов',
    description: 'Справочник тегов для фильтрации табака и поиска по палитре.',
  },
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

onMounted(async () => {
  if (!sessionStore.accessToken) {
    return
  }

  const [auditResponse, assetsResponse] = await Promise.all([
    api.exportSettings<BackupAuditEvent[]>(sessionStore.accessToken, 'backup_audit'),
    api.getMediaAssets(sessionStore.accessToken, 12),
  ])

  backupAuditEvents.value = auditResponse.data
  mediaAssets.value = assetsResponse
})

async function handleExport(resource: SettingsResource) {
  if (!sessionStore.accessToken) {
    return
  }

  clearMessages()
  isBusy.value = true

  try {
    const response =
      resource === 'backup'
        ? await api.exportBackup(sessionStore.accessToken)
        : await api.exportSettings(sessionStore.accessToken, resource)

    downloadJson(
      `${resource}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`,
      response,
    )
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
    const response =
      resource === 'backup'
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

async function handleMediaUpload() {
  if (!sessionStore.accessToken) {
    return
  }

  if (!mediaFile.value) {
    mediaUploadError.value = 'Выберите изображение для загрузки.'
    return
  }

  mediaUploadError.value = null
  mediaUploadMessage.value = null
  isBusy.value = true

  try {
    const intent = await api.createMediaUpload(sessionStore.accessToken, {
      fileName: mediaFile.value.name,
      mimeType: mediaFile.value.type || 'image/jpeg',
      byteSize: mediaFile.value.size,
      usageType: mediaUsageType.value,
    })

    const uploadResponse = await fetch(intent.uploadUrl, {
      method: intent.uploadMethod,
      headers: intent.uploadHeaders,
      body: mediaFile.value,
    })

    if (!uploadResponse.ok) {
      throw new Error('Object storage отклонило загрузку файла.')
    }

    const metadata = await buildMediaMetadata(mediaFile.value)
    const completedAsset = await api.completeMediaUpload(
      sessionStore.accessToken,
      intent.asset.id,
      metadata,
    )

    mediaAssets.value = [completedAsset, ...mediaAssets.value.filter((item) => item.id !== completedAsset.id)].slice(0, 12)
    mediaUploadMessage.value = `Файл загружен в MinIO и зарегистрирован как asset ${completedAsset.id.slice(0, 8)}.`
    mediaFile.value = null
  } catch (error) {
    mediaUploadError.value = resolveErrorMessage(error)
  } finally {
    isBusy.value = false
  }
}

function setImportFile(resource: SettingsResource, event: Event) {
  const input = event.target as HTMLInputElement
  importFiles[resource] = input.files?.[0] ?? null
}

function setMediaFile(event: Event) {
  const input = event.target as HTMLInputElement
  mediaFile.value = input.files?.[0] ?? null
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

async function buildMediaMetadata(file: File) {
  const checksumSha256 = await computeSha256(file)
  const imageSize = await resolveImageDimensions(file)

  return {
    checksumSha256,
    widthPx: imageSize?.width,
    heightPx: imageSize?.height,
  }
}

async function computeSha256(file: File) {
  if (!window.crypto?.subtle) {
    return undefined
  }

  const buffer = await file.arrayBuffer()
  const digest = await window.crypto.subtle.digest('SHA-256', buffer)

  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('')
}

async function resolveImageDimensions(file: File) {
  try {
    const bitmap = await createImageBitmap(file)
    const width = bitmap.width
    const height = bitmap.height
    bitmap.close()
    return { width, height }
  } catch {
    return undefined
  }
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message || 'Операция не выполнилась.'
  }

  if (error instanceof SyntaxError) {
    return 'Файл не похож на валидный JSON.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Не удалось выполнить операцию. Проверьте файл и соединение с API.'
}
</script>

<template>
  <section class="panel">
    <div class="panel__header panel__header--compact-mobile">
      <div>
        <p class="section-label">Admin settings</p>
        <h2>Резервные копии, перенос данных и media storage</h2>
      </div>
      <button class="button button--primary button--full-width-mobile" type="button" :disabled="isBusy" @click="handleExport('backup')">
        Скачать полный backup
      </button>
    </div>

    <p class="section-copy">
      Здесь можно выгрузить справочники и заказы в JSON, восстановить backup и протестировать черновой upload flow
      через MinIO по presigned URL.
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
    <div class="panel__header panel__header--compact-mobile">
      <div>
        <p class="section-label">Media upload</p>
        <h3>Черновой upload flow через MinIO</h3>
      </div>
    </div>

    <p class="section-copy">
      Выберите изображение, API создаст draft asset и presigned URL, после чего файл загрузится напрямую в object
      storage без проксирования через backend.
    </p>

    <div class="editor-grid">
      <label class="field">
        <span>Назначение файла</span>
        <select v-model="mediaUsageType" class="input">
          <option value="tobacco_gallery">Карточка табака</option>
          <option value="forum_post">Пост форума</option>
          <option value="forum_comment">Комментарий</option>
        </select>
      </label>

      <label class="field">
        <span>Изображение</span>
        <input class="input" type="file" accept="image/jpeg,image/png,image/webp" @change="setMediaFile" />
      </label>
    </div>

    <div class="modal-actions">
      <button class="button button--primary button--full-width-mobile" type="button" :disabled="isBusy" @click="handleMediaUpload">
        Загрузить в media storage
      </button>
    </div>

    <div v-if="mediaUploadMessage" class="status-banner">
      <strong>Upload завершён.</strong>
      <p>{{ mediaUploadMessage }}</p>
    </div>

    <div v-if="mediaUploadError" class="status-banner status-banner--error">
      <strong>Upload не удался.</strong>
      <p>{{ mediaUploadError }}</p>
    </div>
  </section>

  <section class="panel">
    <div class="panel__header panel__header--compact-mobile">
      <div>
        <p class="section-label">Recent assets</p>
        <h3>Последние media assets</h3>
      </div>
    </div>

    <div class="timeline-list">
      <article v-for="asset in mediaAssets" :key="asset.id" class="timeline-item">
        <div class="timeline-item__header">
          <strong>{{ asset.originalFileName }}</strong>
          <span>{{ asset.status }}</span>
        </div>
        <p>{{ asset.usageType }} · {{ asset.mimeType }} · {{ Math.round(asset.byteSize / 1024) }} KB</p>
        <p v-if="asset.publicUrl" class="section-copy">{{ asset.publicUrl }}</p>
      </article>
    </div>
  </section>

  <section class="panel">
    <div class="panel__header panel__header--compact-mobile">
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
      <button class="button button--secondary button--full-width-mobile" type="button" :disabled="isBusy" @click="handleImport('backup')">
        Импортировать backup
      </button>
    </div>
  </section>

  <section class="panel">
    <div class="panel__header panel__header--compact-mobile">
      <div>
        <p class="section-label">Backup audit</p>
        <h3>Журнал backup и restore</h3>
      </div>
    </div>

    <div class="timeline-list">
      <article v-for="event in backupAuditEvents" :key="event.id" class="timeline-item">
        <div class="timeline-item__header">
          <strong>{{ event.actionName }} / {{ event.resourceName }}</strong>
          <span>{{ event.createdAt }}</span>
        </div>
        <p>
          Версия {{ event.schemaVersion }}, записей: {{ event.itemCount }}, checksum:
          {{ event.checksumSha256.slice(0, 12) }}...
        </p>
        <p v-if="event.actor">Инициатор: {{ event.actor.login }}</p>
      </article>
    </div>
  </section>

  <section class="stack settings-resource-grid">
    <article v-for="card in resourceCards" :key="card.resource" class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">{{ card.resource }}</p>
          <h3>{{ card.title }}</h3>
        </div>
        <button class="button button--ghost button--full-width-mobile" type="button" :disabled="isBusy" @click="handleExport(card.resource)">
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
        <button class="button button--primary button--full-width-mobile" type="button" :disabled="isBusy" @click="handleImport(card.resource)">
          Импортировать
        </button>
      </div>
    </article>
  </section>
</template>
