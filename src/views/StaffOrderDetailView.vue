<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BlendComposer from '@/components/BlendComposer.vue'
import ReferenceSearchSelect from '@/components/ReferenceSearchSelect.vue'
import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import type { FulfillOrderPayload } from '@/types/app'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const appDataStore = useAppDataStore()
const sessionStore = useSessionStore()

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
    warmupMode: 'with_cap' as const,
    warmupDurationMinutes: 6,
  },
  packingComment: '',
})

const orderId = computed(() => String(route.params.id ?? ''))
const order = computed(() => appDataStore.orders.find((item) => item.id === orderId.value) ?? null)

const hookahOptions = computed(() => appDataStore.references.hookahs.map((item) => ({ id: item.id, title: `${item.manufacturer} ${item.name}` })))
const bowlOptions = computed(() => appDataStore.references.bowls.map((item) => ({ id: item.id, title: `${item.manufacturer} ${item.name}` })))
const kalaudOptions = computed(() => appDataStore.references.kalauds.map((item) => ({ id: item.id, title: `${item.manufacturer} ${item.name}` })))
const charcoalOptions = computed(() => appDataStore.references.charcoals.map((item) => ({ id: item.id, title: `${item.manufacturer} ${item.name}` })))
const electricHeadOptions = computed(() => appDataStore.references.electricHeads.map((item) => ({ id: item.id, title: `${item.manufacturer} ${item.name}` })))

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
        draft.actualSetup.packingStyle === 'custom' ? draft.actualSetup.customPackingStyle : undefined,
      hookahId: draft.actualSetup.hookahId || undefined,
      bowlId: draft.actualSetup.heatingSystemType === 'coal' ? draft.actualSetup.bowlId || undefined : undefined,
      kalaudId: draft.actualSetup.heatingSystemType === 'coal' ? draft.actualSetup.kalaudId || undefined : undefined,
      charcoalId: draft.actualSetup.heatingSystemType === 'coal' ? draft.actualSetup.charcoalId || undefined : undefined,
      electricHeadId:
        draft.actualSetup.heatingSystemType === 'electric' ? draft.actualSetup.electricHeadId || undefined : undefined,
    },
    packingComment: draft.packingComment,
  })
}
</script>

<template>
  <section v-if="order" class="stack">
    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">{{ order.tableLabel }}</p>
          <h2>Карточка заказа</h2>
        </div>
        <div class="pill-row">
          <span class="pill">{{ order.status }}</span>
          <button class="button button--ghost" type="button" @click="goBack">К списку</button>
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
      <div class="panel__header">
        <div>
          <p class="section-label">Guests</p>
          <h3>Люди за столом</h3>
        </div>
      </div>

      <div class="participant-list">
        <article v-for="participant in order.participants" :key="participant.client.id" class="participant-card">
          <div class="editor-card__header">
            <div>
              <p class="section-label">{{ participant.client.login }}</p>
              <h4>{{ formatDateTime(participant.joinedAt) }}</h4>
            </div>
            <span class="pill" :class="{ 'pill--muted': participant.tableApprovalStatus !== 'approved' }">
              {{ participant.tableApprovalStatus === 'approved' ? 'Подтверждён' : 'Ожидает подтверждения' }}
            </span>
          </div>

          <p>{{ participant.description }}</p>

          <div class="pill-row">
            <span v-for="item in participant.requestedBlend" :key="item.tobacco.id" class="pill">
              {{ item.tobacco.brand }} / {{ item.tobacco.flavorName }} - {{ item.percentage }}%
            </span>
          </div>

          <button v-if="participant.tableApprovalStatus !== 'approved'" class="button button--secondary" type="button" @click="approveParticipant(participant.client.id)">
            Подтвердить за столом
          </button>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">Requested</p>
          <h3>Что просили гости</h3>
        </div>
      </div>

      <div class="pill-row">
        <span v-for="item in order.requestedBlend" :key="item.tobacco.id" class="pill">
          {{ item.tobacco.brand }} / {{ item.tobacco.flavorName }} - {{ item.percentage }}%
        </span>
      </div>
      <p class="section-copy">
        Тип: {{ order.requestedSetup?.heatingSystemType === 'electric' ? 'Электрическая чаша' : 'Уголь + калауд' }}
      </p>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-label">Packing</p>
          <h3>Фактическая забивка</h3>
        </div>
      </div>

      <div v-if="order.actualBlend.length > 0" class="pill-row">
        <span v-for="item in order.actualBlend" :key="item.tobacco.id" class="pill">
          {{ item.tobacco.brand }} / {{ item.tobacco.flavorName }} - {{ item.percentage }}%
        </span>
      </div>

      <p v-if="order.packingComment" class="section-copy">Комментарий мастера: {{ order.packingComment }}</p>

      <button v-if="order.status === 'new'" class="button button--secondary" type="button" @click="takeOrder">
        Взять в работу
      </button>

      <div v-if="order.status === 'new' || order.status === 'in_progress'" class="stack">
        <BlendComposer
          v-model="draft.actualBlend"
          title="Фактический микс"
          description="Укажите, что реально пошло в чашу и в каких процентах."
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
          <ReferenceSearchSelect v-model="draft.actualSetup.electricHeadId" label="Электрическая чаша" :options="electricHeadOptions" />
        </div>

        <label class="field">
          <span>Комментарий мастера</span>
          <textarea v-model="draft.packingComment" class="input textarea" rows="4" placeholder="Например: сделал мягче, добавил больше холода и облегчил сладость." />
        </label>

        <button class="button button--primary" type="button" @click="fulfillOrder">
          Отдать заказ
        </button>
      </div>
    </section>
  </section>

  <section v-else class="panel">
    <p class="section-label">Order not found</p>
    <h2>Заказ не найден</h2>
    <button class="button button--ghost" type="button" @click="goBack">Назад</button>
  </section>
</template>
