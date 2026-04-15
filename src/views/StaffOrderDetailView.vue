<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BlendComposer from '@/components/BlendComposer.vue'
import ReferenceSearchSelect from '@/components/ReferenceSearchSelect.vue'
import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import type { FulfillOrderPayload, OrderSetup, PackingStyle } from '@/types/app'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const appDataStore = useAppDataStore()
const sessionStore = useSessionStore()

const packingStyleLabels: Record<PackingStyle, string> = {
  layers: 'Слоями',
  sectors: 'Секторами',
  kompot: 'Компот',
  custom: 'Необычная',
}

const timelineLabels = {
  created: 'Заказ создан',
  participant_joined: 'К заказу присоединился гость',
  participant_table_approved: 'Гость подтверждён за столом',
  started: 'Заказ взят в работу',
  delivered: 'Заказ отдан',
  feedback_received: 'Получен отзыв',
}

const draft = reactive<FulfillOrderPayload>({
  actualBlend: [],
  actualSetup: {
    heatingSystemType: 'coal',
    packingStyle: 'kompot',
    customPackingStyle: '',
    hookahId: '',
    bowlId: '',
    kalaudId: '',
    charcoalId: '',
    electricHeadId: '',
    charcoalCount: 3,
    warmupMode: 'with_cap',
    warmupDurationMinutes: 6,
  },
  packingComment: '',
})

const orderId = computed(() => String(route.params.id ?? ''))
const order = computed(() => appDataStore.orders.find((item) => item.id === orderId.value) ?? null)

const hookahOptions = computed(() =>
  appDataStore.references.hookahs.map((item) => ({
    id: item.id,
    title: `${item.manufacturer} ${item.name}`,
  })),
)
const bowlOptions = computed(() =>
  appDataStore.references.bowls.map((item) => ({
    id: item.id,
    title: `${item.manufacturer} ${item.name}`,
  })),
)
const kalaudOptions = computed(() =>
  appDataStore.references.kalauds.map((item) => ({
    id: item.id,
    title: `${item.manufacturer} ${item.name}`,
  })),
)
const charcoalOptions = computed(() =>
  appDataStore.references.charcoals.map((item) => ({
    id: item.id,
    title: `${item.manufacturer} ${item.name}`,
  })),
)
const electricHeadOptions = computed(() =>
  appDataStore.references.electricHeads.map((item) => ({
    id: item.id,
    title: `${item.manufacturer} ${item.name}`,
  })),
)

watchEffect(() => {
  if (!order.value) {
    return
  }

  if (draft.actualBlend.length === 0 && order.value.requestedBlend.length > 0) {
    draft.actualBlend = order.value.requestedBlend.map((item) => ({
      tobaccoId: item.tobacco.id,
      percentage: item.percentage,
    }))
  }

  if (!draft.packingComment && order.value.packingComment) {
    draft.packingComment = order.value.packingComment
  }

  if (!draft.actualSetup.hookahId && order.value.requestedSetup) {
    draft.actualSetup = {
      heatingSystemType: order.value.requestedSetup.heatingSystemType,
      packingStyle: order.value.requestedSetup.packingStyle,
      customPackingStyle: order.value.requestedSetup.customPackingStyle ?? '',
      hookahId: order.value.requestedSetup.hookah?.id ?? '',
      bowlId: order.value.requestedSetup.bowl?.id ?? '',
      kalaudId: order.value.requestedSetup.kalaud?.id ?? '',
      charcoalId: order.value.requestedSetup.charcoal?.id ?? '',
      electricHeadId: order.value.requestedSetup.electricHead?.id ?? '',
      charcoalCount: order.value.requestedSetup.charcoalCount ?? 3,
      warmupMode: order.value.requestedSetup.warmupMode ?? 'with_cap',
      warmupDurationMinutes: order.value.requestedSetup.warmupDurationMinutes ?? 6,
    }
  }
})

function formatPackingStyle(setup?: OrderSetup) {
  if (!setup?.packingStyle) {
    return 'Не указано'
  }

  if (setup.packingStyle === 'custom') {
    return setup.customPackingStyle?.trim() || 'Необычная'
  }

  return packingStyleLabels[setup.packingStyle]
}

async function goBack() {
  await router.push('/staff/orders')
}

async function takeOrder() {
  if (!sessionStore.accessToken || !order.value) return
  await appDataStore.startOrder(sessionStore.accessToken, order.value.id)
}

async function approveParticipant(clientUserId: string) {
  if (!sessionStore.accessToken || !order.value) return
  await appDataStore.approveParticipantTable(sessionStore.accessToken, order.value.id, clientUserId)
}

async function fulfillOrder() {
  if (!sessionStore.accessToken || !order.value) return
  await appDataStore.fulfillOrder(sessionStore.accessToken, order.value.id, {
    actualBlend: draft.actualBlend,
    actualSetup: {
      ...draft.actualSetup,
      customPackingStyle:
        draft.actualSetup.packingStyle === 'custom'
          ? draft.actualSetup.customPackingStyle
          : undefined,
      hookahId: draft.actualSetup.hookahId || undefined,
      bowlId:
        draft.actualSetup.heatingSystemType === 'coal'
          ? draft.actualSetup.bowlId || undefined
          : undefined,
      kalaudId:
        draft.actualSetup.heatingSystemType === 'coal'
          ? draft.actualSetup.kalaudId || undefined
          : undefined,
      charcoalId:
        draft.actualSetup.heatingSystemType === 'coal'
          ? draft.actualSetup.charcoalId || undefined
          : undefined,
      electricHeadId:
        draft.actualSetup.heatingSystemType === 'electric'
          ? draft.actualSetup.electricHeadId || undefined
          : undefined,
    },
    packingComment: draft.packingComment,
  })
}
</script>

<template>
  <section v-if="order" class="stack">
    <section class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">{{ order.tableLabel }}</p>
          <h2>Карточка заказа</h2>
        </div>
        <div class="pill-row pill-row--stretch-mobile">
          <span class="pill">{{ order.status }}</span>
          <button class="button button--ghost button--full-width-mobile" type="button" @click="goBack">
            К списку
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <article class="task-card">
          <p class="task-card__status">Создан</p>
          <h4>{{ formatDateTime(order.createdAt) }}</h4>
        </article>
        <article class="task-card">
          <p class="task-card__status">Отдан</p>
          <h4>{{ formatDateTime(order.deliveredAt) }}</h4>
        </article>
        <article class="task-card">
          <p class="task-card__status">Последний отзыв</p>
          <h4>{{ formatDateTime(order.feedbackAt) }}</h4>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">Гости</p>
          <h3>Люди за столом</h3>
        </div>
        <span class="pill">{{ order.participants.length }} гостей</span>
      </div>

      <div class="participant-list">
        <article v-for="participant in order.participants" :key="participant.client.id" class="participant-card">
          <div class="editor-card__header editor-card__header--stack-mobile">
            <div>
              <p class="section-label">{{ participant.client.login }}</p>
              <h4>{{ formatDateTime(participant.joinedAt) }}</h4>
            </div>
            <span class="pill" :class="{ 'pill--muted': participant.tableApprovalStatus !== 'approved' }">
              {{ participant.tableApprovalStatus === 'approved' ? 'Подтверждён' : 'Ждёт подтверждения' }}
            </span>
          </div>

          <p class="section-copy">{{ participant.description }}</p>

          <div class="pill-row">
            <span v-if="participant.wantsCooling" class="pill pill--muted">С холодком</span>
            <span v-if="participant.wantsMint" class="pill pill--muted">С мятой</span>
            <span v-if="participant.wantsSpicy" class="pill pill--muted">Пряный</span>
          </div>

          <div class="pill-row">
            <span v-for="item in participant.requestedBlend" :key="item.tobacco.id" class="pill">
              {{ item.tobacco.brand }} / {{ item.tobacco.flavorName }} · {{ item.percentage }}%
            </span>
          </div>

          <button
            v-if="participant.tableApprovalStatus !== 'approved'"
            class="button button--secondary button--full-width-mobile"
            type="button"
            @click="approveParticipant(participant.client.id)"
          >
            Подтвердить за столом
          </button>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">Запрос</p>
          <h3>Что просили гости</h3>
        </div>
      </div>

      <div class="order-setup-grid">
        <article class="task-card">
          <p class="task-card__status">Запрошенный микс</p>
          <div class="pill-row">
            <span v-for="item in order.requestedBlend" :key="item.tobacco.id" class="pill">
              {{ item.tobacco.brand }} / {{ item.tobacco.flavorName }} · {{ item.percentage }}%
            </span>
          </div>
        </article>

        <article class="task-card">
          <p class="task-card__status">Запрошенный сетап</p>
          <div class="setup-summary">
            <p class="section-copy">
              Тип:
              {{ order.requestedSetup?.heatingSystemType === 'electric' ? 'Электрическая чаша' : 'Уголь + калауд' }}
            </p>
            <p class="section-copy">Забивка: {{ formatPackingStyle(order.requestedSetup) }}</p>
            <p class="section-copy" v-if="order.requestedSetup?.hookah">
              Кальян: {{ order.requestedSetup.hookah.manufacturer }} {{ order.requestedSetup.hookah.name }}
            </p>
            <p class="section-copy" v-if="order.requestedSetup?.bowl">
              Чашка: {{ order.requestedSetup.bowl.manufacturer }} {{ order.requestedSetup.bowl.name }}
            </p>
            <p class="section-copy" v-if="order.requestedSetup?.kalaud">
              Калауд: {{ order.requestedSetup.kalaud.manufacturer }} {{ order.requestedSetup.kalaud.name }}
            </p>
            <p class="section-copy" v-if="order.requestedSetup?.charcoal">
              Уголь: {{ order.requestedSetup.charcoal.manufacturer }} {{ order.requestedSetup.charcoal.name }}
            </p>
            <p class="section-copy" v-if="order.requestedSetup?.electricHead">
              Электрическая чаша:
              {{ order.requestedSetup.electricHead.manufacturer }} {{ order.requestedSetup.electricHead.name }}
            </p>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">Факт</p>
          <h3>Фактическая забивка</h3>
        </div>
      </div>

      <div v-if="order.actualBlend.length > 0 || order.actualSetup" class="order-setup-grid">
        <article class="task-card" v-if="order.actualBlend.length > 0">
          <p class="task-card__status">Готовый микс</p>
          <div class="pill-row">
            <span v-for="item in order.actualBlend" :key="item.tobacco.id" class="pill">
              {{ item.tobacco.brand }} / {{ item.tobacco.flavorName }} · {{ item.percentage }}%
            </span>
          </div>
        </article>

        <article class="task-card" v-if="order.actualSetup">
          <p class="task-card__status">Готовый сетап</p>
          <div class="setup-summary">
            <p class="section-copy">
              Тип:
              {{ order.actualSetup.heatingSystemType === 'electric' ? 'Электрическая чаша' : 'Уголь + калауд' }}
            </p>
            <p class="section-copy">Забивка: {{ formatPackingStyle(order.actualSetup) }}</p>
          </div>
        </article>
      </div>

      <p v-if="order.packingComment" class="section-copy">Комментарий мастера: {{ order.packingComment }}</p>

      <button
        v-if="order.status === 'new'"
        class="button button--secondary button--full-width-mobile"
        type="button"
        @click="takeOrder"
      >
        Взять в работу
      </button>

      <div v-if="order.status === 'new' || order.status === 'in_progress'" class="stack">
        <BlendComposer
          v-model="draft.actualBlend"
          title="Фактический микс"
          description="Укажите, что реально ушло в чашу и в каком соотношении."
          :tobaccos="appDataStore.references.tobaccos"
        />

        <div class="editor-grid">
          <label class="field">
            <span>Система прогрева</span>
            <select v-model="draft.actualSetup.heatingSystemType" class="input">
              <option value="coal">Уголь + калауд</option>
              <option value="electric">Электрическая чаша Hookah Pro</option>
            </select>
          </label>

          <ReferenceSearchSelect v-model="draft.actualSetup.hookahId" label="Кальян" :options="hookahOptions" />
        </div>

        <div v-if="draft.actualSetup.heatingSystemType === 'coal'" class="editor-grid">
          <ReferenceSearchSelect v-model="draft.actualSetup.bowlId" label="Чашка" :options="bowlOptions" />
          <ReferenceSearchSelect v-model="draft.actualSetup.kalaudId" label="Калауд" :options="kalaudOptions" />
          <ReferenceSearchSelect v-model="draft.actualSetup.charcoalId" label="Уголь" :options="charcoalOptions" />
        </div>

        <div v-else class="editor-grid">
          <ReferenceSearchSelect
            v-model="draft.actualSetup.electricHeadId"
            label="Электрическая чаша"
            :options="electricHeadOptions"
          />
        </div>

        <label class="field">
          <span>Комментарий мастера</span>
          <textarea
            v-model="draft.packingComment"
            class="input textarea"
            rows="4"
            placeholder="Например: сделал мягче, добавил больше холода и снизил сладость."
          />
        </label>

        <button class="button button--primary button--full-width-mobile" type="button" @click="fulfillOrder">
          Отдать заказ
        </button>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header panel__header--compact-mobile">
        <div>
          <p class="section-label">История</p>
          <h3>Лента статусов</h3>
        </div>
      </div>

      <div class="timeline-list">
        <article v-for="event in order.timeline" :key="event.id" class="timeline-item">
          <div class="timeline-item__header">
            <strong>{{ timelineLabels[event.type] }}</strong>
            <span>{{ formatDateTime(event.occurredAt) }}</span>
          </div>
          <p>{{ event.note }}</p>
        </article>
      </div>
    </section>
  </section>

  <section v-else class="panel empty-state">
    <p class="section-label">Заказ не найден</p>
    <h2>Не удалось открыть карточку заказа</h2>
    <button class="button button--ghost button--full-width-mobile" type="button" @click="goBack">
      Назад
    </button>
  </section>
</template>
