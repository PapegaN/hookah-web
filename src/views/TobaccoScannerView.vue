<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'

import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import type { UpsertReferencePayload } from '@/types/app'

interface BarcodeDetectorResult {
  rawValue?: string
}

interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource | ImageBitmap): Promise<BarcodeDetectorResult[]>
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance
  getSupportedFormats?: () => Promise<string[]>
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor
  }
}

interface TobaccoDraft {
  brand: string
  line: string
  flavorName: string
  markingCode: string
  lineStrengthLevel: number
  estimatedStrengthLevel: number
  brightnessLevel: number
  flavorDescription: string
  inStock: boolean
  isActive: boolean
}

const appDataStore = useAppDataStore()
const sessionStore = useSessionStore()

const videoRef = ref<HTMLVideoElement | null>(null)
const detector = ref<BarcodeDetectorInstance | null>(null)
const activeStream = ref<MediaStream | null>(null)
const scanLoopId = ref<number | null>(null)
const isStartingCamera = ref(false)
const isScanning = ref(false)
const isSubmitting = ref(false)
const statusMessage = ref('')
const scanError = ref('')
const submitError = ref('')
const submitSuccess = ref('')
const selectedTagNames = ref<string[]>([])

const draft = reactive<TobaccoDraft>({
  brand: '',
  line: '',
  flavorName: '',
  markingCode: '',
  lineStrengthLevel: 3,
  estimatedStrengthLevel: 3,
  brightnessLevel: 3,
  flavorDescription: '',
  inStock: true,
  isActive: true,
})

const activeTobaccoTags = computed(() =>
  appDataStore.references.tobaccoTags.filter((tag) => tag.isActive),
)

const brandSuggestions = computed(() => buildSuggestions(appDataStore.references.tobaccos.map((item) => item.brand)))
const lineSuggestions = computed(() => buildSuggestions(appDataStore.references.tobaccos.map((item) => item.line)))
const flavorSuggestions = computed(() =>
  buildSuggestions(appDataStore.references.tobaccos.map((item) => item.flavorName)),
)

const canUseLiveScanner = computed(
  () => typeof window !== 'undefined' && Boolean(window.BarcodeDetector && navigator.mediaDevices?.getUserMedia),
)

const duplicateTobacco = computed(() => {
  const normalizedCode = draft.markingCode.trim()
  if (!normalizedCode) {
    return undefined
  }

  return appDataStore.references.tobaccos.find((item) => item.markingCode === normalizedCode)
})

function buildSuggestions(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, 'ru'),
  )
}

async function ensureDetector() {
  if (detector.value) {
    return detector.value
  }

  if (!window.BarcodeDetector) {
    throw new Error('Браузер не поддерживает BarcodeDetector.')
  }

  const supportedFormats = window.BarcodeDetector.getSupportedFormats
    ? await window.BarcodeDetector.getSupportedFormats()
    : []
  const preferredFormats = ['data_matrix', 'qr_code', 'code_128'].filter((format) =>
    supportedFormats.length === 0 ? true : supportedFormats.includes(format),
  )

  detector.value = new window.BarcodeDetector({
    formats: preferredFormats.length > 0 ? preferredFormats : undefined,
  })

  return detector.value
}

async function startCameraScanner() {
  if (!canUseLiveScanner.value || isScanning.value) {
    return
  }

  isStartingCamera.value = true
  scanError.value = ''
  statusMessage.value = 'Подключаем камеру и готовим распознавание маркировки.'

  try {
    const createdDetector = await ensureDetector()
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
      },
      audio: false,
    })

    activeStream.value = stream
    isScanning.value = true

    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }

    const scanFrame = async () => {
      if (!videoRef.value || !isScanning.value) {
        return
      }

      try {
        const results = await createdDetector.detect(videoRef.value)
        const code = results.find((item) => item.rawValue?.trim())?.rawValue?.trim()

        if (code) {
          applyScannedCode(code)
          return
        }
      } catch {
        scanError.value = 'Не удалось распознать код в текущем кадре. Попробуйте изменить угол или освещение.'
      }

      scanLoopId.value = window.setTimeout(() => {
        void scanFrame()
      }, 700)
    }

    statusMessage.value = 'Наведите камеру на честный знак или QR/Data Matrix код упаковки.'
    await scanFrame()
  } catch (error) {
    scanError.value = error instanceof Error ? error.message : 'Не удалось открыть камеру.'
    stopScanner()
  } finally {
    isStartingCamera.value = false
  }
}

function stopScanner() {
  if (scanLoopId.value !== null) {
    window.clearTimeout(scanLoopId.value)
    scanLoopId.value = null
  }

  if (activeStream.value) {
    activeStream.value.getTracks().forEach((track) => track.stop())
    activeStream.value = null
  }

  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.srcObject = null
  }

  isScanning.value = false
}

async function handleImageScan(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  scanError.value = ''
  statusMessage.value = 'Распознаём маркировку по фотографии.'

  try {
    const createdDetector = await ensureDetector()
    const bitmap = await createImageBitmap(file)
    const results = await createdDetector.detect(bitmap)
    const code = results.find((item) => item.rawValue?.trim())?.rawValue?.trim()

    if (!code) {
      throw new Error('Код не найден. Сделайте фото ближе и без бликов.')
    }

    applyScannedCode(code)
  } catch (error) {
    scanError.value = error instanceof Error ? error.message : 'Не удалось распознать код по изображению.'
  } finally {
    input.value = ''
  }
}

function applyScannedCode(code: string) {
  draft.markingCode = code
  submitSuccess.value = ''
  scanError.value = ''
  statusMessage.value = 'Код считан. Проверьте карточку табака и сохраните позицию.'
  stopScanner()
}

function toggleTag(tagName: string) {
  selectedTagNames.value = selectedTagNames.value.includes(tagName)
    ? selectedTagNames.value.filter((item) => item !== tagName)
    : [...selectedTagNames.value, tagName]
}

async function submitTobacco() {
  if (!sessionStore.accessToken) {
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  submitSuccess.value = ''

  try {
    const payload: UpsertReferencePayload = {
      brand: draft.brand.trim(),
      line: draft.line.trim(),
      flavorName: draft.flavorName.trim(),
      markingCode: draft.markingCode.trim() || undefined,
      lineStrengthLevel: draft.lineStrengthLevel,
      estimatedStrengthLevel: draft.estimatedStrengthLevel,
      brightnessLevel: draft.brightnessLevel,
      flavorDescription: draft.flavorDescription.trim(),
      flavorTags: selectedTagNames.value,
      inStock: draft.inStock,
      isActive: draft.isActive,
    }

    await appDataStore.createReference(sessionStore.accessToken, 'tobaccos', payload)

    submitSuccess.value = 'Табак добавлен в каталог и сразу доступен в справочнике.'
    statusMessage.value = 'При необходимости можно сразу отсканировать следующую банку.'
    resetDraft()
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Не удалось сохранить табак.'
  } finally {
    isSubmitting.value = false
  }
}

function resetDraft() {
  draft.brand = ''
  draft.line = ''
  draft.flavorName = ''
  draft.markingCode = ''
  draft.lineStrengthLevel = 3
  draft.estimatedStrengthLevel = 3
  draft.brightnessLevel = 3
  draft.flavorDescription = ''
  draft.inStock = true
  draft.isActive = true
  selectedTagNames.value = []
}

onBeforeUnmount(() => {
  stopScanner()
})
</script>

<template>
  <section class="panel scanner-layout">
    <div class="scanner-hero">
      <div>
        <p class="section-label">Marking scanner</p>
        <h2>Добавление табака по честному знаку</h2>
        <p class="section-copy">
          Экран рассчитан на телефон: можно считать Data Matrix код камерой или загрузить фото, а затем
          сразу оформить новую позицию каталога.
        </p>
      </div>

      <div class="pill-row">
        <span class="pill">{{ appDataStore.references.tobaccos.length }} табаков в каталоге</span>
        <span class="pill pill--muted">Доступно админу и мастеру</span>
      </div>
    </div>

    <div class="scanner-grid">
      <section class="editor-card scanner-card">
        <div class="editor-card__header">
          <div>
            <p class="section-label">Camera</p>
            <h3>Сканирование маркировки</h3>
          </div>
          <div class="pill-row">
            <button
              v-if="canUseLiveScanner"
              class="button button--primary"
              type="button"
              :disabled="isStartingCamera || isScanning"
              @click="startCameraScanner"
            >
              {{ isScanning ? 'Камера активна' : 'Открыть камеру' }}
            </button>
            <button
              v-if="isScanning"
              class="button button--ghost"
              type="button"
              @click="stopScanner"
            >
              Остановить
            </button>
          </div>
        </div>

        <div class="scanner-preview">
          <video
            ref="videoRef"
            class="scanner-preview__video"
            playsinline
            muted
            aria-label="Поток камеры для считывания честного знака"
          />
          <div class="scanner-preview__frame" aria-hidden="true"></div>
        </div>

        <label class="field field--wide">
          <span>Фото упаковки</span>
          <input class="input" type="file" accept="image/*" capture="environment" @change="handleImageScan" />
        </label>

        <label class="field field--wide">
          <span>Код маркировки</span>
          <input v-model="draft.markingCode" class="input" type="text" placeholder="Вставьте код вручную или получите его из сканера" />
        </label>

        <p v-if="statusMessage" class="section-copy">{{ statusMessage }}</p>
        <p v-if="scanError" class="form-error">{{ scanError }}</p>

        <div v-if="duplicateTobacco" class="status-banner status-banner--error">
          <strong>Этот код уже используется.</strong>
          <p>
            {{ duplicateTobacco.brand }} / {{ duplicateTobacco.line }} / {{ duplicateTobacco.flavorName }}
          </p>
        </div>
      </section>

      <section class="editor-card">
        <div class="editor-card__header">
          <div>
            <p class="section-label">Catalog card</p>
            <h3>Новая карточка табака</h3>
          </div>
        </div>

        <div class="editor-grid">
          <label class="field">
            <span>Бренд</span>
            <input v-model="draft.brand" class="input" type="text" list="scanner-brand-suggestions" />
          </label>

          <label class="field">
            <span>Линейка</span>
            <input v-model="draft.line" class="input" type="text" list="scanner-line-suggestions" />
          </label>

          <label class="field field--wide">
            <span>Вкус</span>
            <input v-model="draft.flavorName" class="input" type="text" list="scanner-flavor-suggestions" />
          </label>

          <label class="field">
            <span>Крепость линейки</span>
            <input v-model.number="draft.lineStrengthLevel" class="input" type="number" min="1" max="5" />
          </label>

          <label class="field">
            <span>Оценочная крепость</span>
            <input v-model.number="draft.estimatedStrengthLevel" class="input" type="number" min="1" max="5" />
          </label>

          <label class="field">
            <span>Яркость</span>
            <input v-model.number="draft.brightnessLevel" class="input" type="number" min="1" max="5" />
          </label>

          <label class="field field--wide">
            <span>Описание вкуса</span>
            <textarea
              v-model="draft.flavorDescription"
              class="input textarea"
              rows="4"
              placeholder="Например: ягодно-мятный профиль с мягкой сладостью"
            />
          </label>

          <label class="field">
            <span>В наличии</span>
            <input v-model="draft.inStock" class="toggle" type="checkbox" />
          </label>

          <label class="field">
            <span>Активен</span>
            <input v-model="draft.isActive" class="toggle" type="checkbox" />
          </label>
        </div>

        <div class="stack">
          <div>
            <p class="section-label">Tags</p>
            <div class="pill-row">
              <button
                v-for="tag in activeTobaccoTags"
                :key="tag.id"
                class="button"
                :class="{ 'button--primary': selectedTagNames.includes(tag.name) }"
                type="button"
                @click="toggleTag(tag.name)"
              >
                {{ tag.name }}
              </button>
            </div>
          </div>

          <p v-if="submitError" class="form-error">{{ submitError }}</p>
          <p v-if="submitSuccess" class="section-copy">{{ submitSuccess }}</p>

          <div class="modal-actions">
            <button class="button button--ghost" type="button" @click="resetDraft">Очистить</button>
            <button
              class="button button--primary"
              type="button"
              :disabled="isSubmitting || Boolean(duplicateTobacco)"
              @click="submitTobacco"
            >
              {{ isSubmitting ? 'Сохраняем...' : 'Добавить табак' }}
            </button>
          </div>
        </div>
      </section>
    </div>

    <datalist id="scanner-brand-suggestions">
      <option v-for="value in brandSuggestions" :key="value" :value="value" />
    </datalist>
    <datalist id="scanner-line-suggestions">
      <option v-for="value in lineSuggestions" :key="value" :value="value" />
    </datalist>
    <datalist id="scanner-flavor-suggestions">
      <option v-for="value in flavorSuggestions" :key="value" :value="value" />
    </datalist>
  </section>
</template>
