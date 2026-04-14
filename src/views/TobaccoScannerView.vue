<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'

import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import type { TobaccoReference, UpsertReferencePayload } from '@/types/app'

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

interface ParsedMarkingCode {
  normalizedCode: string
  gtin?: string
  serial?: string
  cryptoTail?: string
  parserLabel: string
}

interface TobaccoDraft {
  brand: string
  line: string
  flavorName: string
  markingCode: string
  markingGtin: string
  lineStrengthLevel: number
  estimatedStrengthLevel: number
  brightnessLevel: number
  flavorDescription: string
  inStock: boolean
  isActive: boolean
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor
  }
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
const enrichmentSource = ref('')

const draft = reactive<TobaccoDraft>(buildEmptyDraft())

const activeTobaccoTags = computed(() =>
  appDataStore.references.tobaccoTags.filter((tag) => tag.isActive),
)

const brandSuggestions = computed(() =>
  buildSuggestions(appDataStore.references.tobaccos.map((item) => item.brand)),
)
const lineSuggestions = computed(() =>
  buildSuggestions(appDataStore.references.tobaccos.map((item) => item.line)),
)
const flavorSuggestions = computed(() =>
  buildSuggestions(appDataStore.references.tobaccos.map((item) => item.flavorName)),
)

const canUseLiveScanner = computed(
  () => typeof window !== 'undefined' && Boolean(window.BarcodeDetector && navigator.mediaDevices?.getUserMedia),
)

const parsedMarking = computed(() => parseMarkingCode(draft.markingCode))

const duplicateTobacco = computed(() => {
  const normalizedCode = parsedMarking.value?.normalizedCode
  if (!normalizedCode) {
    return undefined
  }

  return appDataStore.references.tobaccos.find((item) => item.markingCode === normalizedCode)
})

const matchedSkuByGtin = computed(() => {
  const gtin = parsedMarking.value?.gtin
  if (!gtin) {
    return undefined
  }

  return appDataStore.references.tobaccos.find(
    (item) => item.markingGtin === gtin && item.markingCode !== parsedMarking.value?.normalizedCode,
  )
})

function buildEmptyDraft(): TobaccoDraft {
  return {
    brand: '',
    line: '',
    flavorName: '',
    markingCode: '',
    markingGtin: '',
    lineStrengthLevel: 3,
    estimatedStrengthLevel: 3,
    brightnessLevel: 3,
    flavorDescription: '',
    inStock: true,
    isActive: true,
  }
}

function buildSuggestions(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, 'ru'),
  )
}

function parseMarkingCode(input: string): ParsedMarkingCode | undefined {
  // Group separator (ASCII 0x1D, GS) используется в DataMatrix маркировке.
  // Создаём RegExp через конструктор, чтобы избежать предупреждения линтера.
  const gsChar = String.fromCharCode(0x1d)
  const gsRegex = new RegExp(gsChar, 'g')
  const normalizedCode = input.replace(gsRegex, '').replace(/\s+/g, '').trim()

  if (!normalizedCode) {
    return undefined
  }

  const raw = normalizedCode.startsWith(']d2') ? normalizedCode.slice(3) : normalizedCode

  const ai01 = raw.match(/01(\d{14})/)
  const ai21 = raw.match(/21([0-9A-Za-z!"%&'()*+,\-./:;<=>?_]{1,20})/)
  const ai91 = raw.match(/91([0-9A-Za-z]{1,90})/)

  return {
    normalizedCode: raw,
    gtin: ai01?.[1],
    serial: ai21?.[1],
    cryptoTail: ai91?.[1],
    parserLabel: ai01 ? 'GS1 Data Matrix' : 'Raw code',
  }
}

function hydrateDraftFromKnownSku(item: TobaccoReference) {
  draft.brand = item.brand
  draft.line = item.line
  draft.flavorName = item.flavorName
  draft.markingGtin = item.markingGtin ?? parsedMarking.value?.gtin ?? ''
  draft.lineStrengthLevel = item.lineStrengthLevel
  draft.estimatedStrengthLevel = item.estimatedStrengthLevel
  draft.brightnessLevel = item.brightnessLevel
  draft.flavorDescription = item.flavorDescription
  draft.inStock = true
  draft.isActive = item.isActive
  selectedTagNames.value = item.flavorTags.map((tag) => tag.name)
}

function enrichDraftFromScan(code: string) {
  draft.markingCode = code
  draft.markingGtin = parseMarkingCode(code)?.gtin ?? ''
  submitSuccess.value = ''
  submitError.value = ''
  scanError.value = ''
  enrichmentSource.value = ''

  if (duplicateTobacco.value) {
    hydrateDraftFromKnownSku(duplicateTobacco.value)
    enrichmentSource.value = 'Точный код уже есть в каталоге, карточка заполнена по существующей позиции.'
    statusMessage.value = 'Найдено полное совпадение маркировки. Проверьте карточку и при необходимости обновите наличие.'
    return
  }

  if (matchedSkuByGtin.value) {
    hydrateDraftFromKnownSku(matchedSkuByGtin.value)
    enrichmentSource.value = 'Нашли знакомый SKU по GTIN и подтянули производителя, линейку и описание.'
    statusMessage.value = 'Код разобран, товар распознан по GTIN. Осталось подтвердить карточку.'
    return
  }

  statusMessage.value = parsedMarking.value?.gtin
    ? 'Код разобран, GTIN определён. Заполните карточку нового SKU и сохраните табак.'
    : 'Код считан, но определить GTIN не удалось. Проверьте строку и заполните карточку вручную.'
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
        scanError.value =
          'Не удалось распознать код в текущем кадре. Попробуйте изменить угол, убрать блики или поднести банку ближе.'
      }

      scanLoopId.value = window.setTimeout(() => {
        void scanFrame()
      }, 700)
    }

    statusMessage.value = 'Наведите камеру на честный знак упаковки.'
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
  stopScanner()
  enrichDraftFromScan(code)
}

function parseCurrentCode() {
  if (!draft.markingCode.trim()) {
    scanError.value = 'Введите код маркировки или отсканируйте упаковку.'
    return
  }

  enrichDraftFromScan(draft.markingCode)
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
      markingGtin: draft.markingGtin.trim() || undefined,
      lineStrengthLevel: draft.lineStrengthLevel,
      estimatedStrengthLevel: draft.estimatedStrengthLevel,
      brightnessLevel: draft.brightnessLevel,
      flavorDescription: draft.flavorDescription.trim(),
      flavorTags: selectedTagNames.value,
      inStock: draft.inStock,
      isActive: draft.isActive,
    }

    await appDataStore.createReference(sessionStore.accessToken, 'tobaccos', payload)

    submitSuccess.value = 'Карточка табака сохранена в каталоге.'
    statusMessage.value = 'Можно сразу переходить к следующей банке.'
    resetDraft()
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Не удалось сохранить табак.'
  } finally {
    isSubmitting.value = false
  }
}

function resetDraft() {
  Object.assign(draft, buildEmptyDraft())
  selectedTagNames.value = []
  enrichmentSource.value = ''
  scanError.value = ''
  submitError.value = ''
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
        <h2>Сканер честного знака</h2>
        <p class="section-copy">
          Сценарий для телефона: считываем Data Matrix, разбираем GTIN, пытаемся распознать SKU и
          заполняем карточку табака до состояния “проверь и подтверди”.
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
            <h3>Сканирование упаковки</h3>
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
            <button v-if="isScanning" class="button button--ghost" type="button" @click="stopScanner">
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
          <input
            v-model="draft.markingCode"
            class="input"
            type="text"
            placeholder="Вставьте строку вручную, если код уже считан внешним сканером"
          />
        </label>

        <div class="pill-row">
          <button class="button button--secondary" type="button" @click="parseCurrentCode">
            Разобрать текущий код
          </button>
        </div>

        <div v-if="parsedMarking" class="stats-grid">
          <article class="metric-card">
            <p class="section-label">Format</p>
            <strong>{{ parsedMarking.parserLabel }}</strong>
            <p class="section-copy">Нормализованный формат для поиска и сохранения</p>
          </article>
          <article class="metric-card">
            <p class="section-label">GTIN</p>
            <strong>{{ parsedMarking.gtin ?? 'Не найден' }}</strong>
            <p class="section-copy">Используем как идентификатор SKU</p>
          </article>
          <article class="metric-card">
            <p class="section-label">Serial</p>
            <strong>{{ parsedMarking.serial ?? 'Не найден' }}</strong>
            <p class="section-copy">Серийная часть упаковки</p>
          </article>
        </div>

        <p v-if="statusMessage" class="section-copy">{{ statusMessage }}</p>
        <p v-if="scanError" class="form-error">{{ scanError }}</p>

        <div v-if="duplicateTobacco" class="status-banner">
          <strong>Точный код уже известен системе.</strong>
          <p>{{ duplicateTobacco.brand }} / {{ duplicateTobacco.line }} / {{ duplicateTobacco.flavorName }}</p>
        </div>

        <div v-else-if="matchedSkuByGtin" class="status-banner">
          <strong>Найден знакомый товар по GTIN.</strong>
          <p>{{ matchedSkuByGtin.brand }} / {{ matchedSkuByGtin.line }} / {{ matchedSkuByGtin.flavorName }}</p>
          <p class="section-copy">{{ enrichmentSource }}</p>
        </div>
      </section>

      <section class="editor-card">
        <div class="editor-card__header">
          <div>
            <p class="section-label">Catalog card</p>
            <h3>Подтверждение карточки</h3>
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
            <span>GTIN</span>
            <input v-model="draft.markingGtin" class="input" type="text" readonly />
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
            <p class="section-label">Теги</p>
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
              {{ isSubmitting ? 'Сохраняем...' : 'Подтвердить и добавить' }}
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
