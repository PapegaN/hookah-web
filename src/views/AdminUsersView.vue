<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import type { AppUser, CreateUserPayload, UpdateUserPayload, UserRole } from '@/types/app'
import { formatDateTime } from '@/utils/date'

type UserFilterTab = 'pending' | 'approved' | 'all'

interface UserDraft {
  login: string
  password: string
  role: UserRole
  email: string
  telegramUsername: string
  isApproved: boolean
}

const sessionStore = useSessionStore()
const appDataStore = useAppDataStore()

const activeTab = ref<UserFilterTab>('pending')
const isModalOpen = ref(false)
const editingUserId = ref<string | null>(null)
const modalDraft = reactive<UserDraft>(buildDraft())

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'admin', label: 'РђРґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ' },
  { value: 'hookah_master', label: 'РљР°Р»СЊСЏРЅРЅС‹Р№ РјР°СЃС‚РµСЂ' },
  { value: 'client', label: 'РљР»РёРµРЅС‚' },
]

const tabItems = computed(() => [
  {
    key: 'pending' as const,
    label: 'РћР¶РёРґР°СЋС‚ Р°РїСЂСѓРІ',
    count: appDataStore.users.filter((user) => !user.isApproved).length,
  },
  {
    key: 'approved' as const,
    label: 'РџРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ',
    count: appDataStore.users.filter((user) => user.isApproved).length,
  },
  {
    key: 'all' as const,
    label: 'Р’СЃРµ',
    count: appDataStore.users.length,
  },
])

const filteredUsers = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return appDataStore.users.filter((user) => !user.isApproved)
    case 'approved':
      return appDataStore.users.filter((user) => user.isApproved)
    default:
      return appDataStore.users
  }
})

const modalTitle = computed(() =>
  editingUserId.value ? 'Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ' : 'Р”РѕР±Р°РІРёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ',
)

function buildDraft(user?: AppUser): UserDraft {
  return {
    login: user?.login ?? '',
    password: '',
    role: user?.role ?? 'client',
    email: user?.email ?? '',
    telegramUsername: user?.telegramUsername ?? '',
    isApproved: user?.isApproved ?? true,
  }
}

function openCreateModal() {
  editingUserId.value = null
  Object.assign(modalDraft, buildDraft())
  isModalOpen.value = true
}

function openEditModal(user: AppUser) {
  editingUserId.value = user.id
  Object.assign(modalDraft, buildDraft(user))
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingUserId.value = null
  Object.assign(modalDraft, buildDraft())
}

async function submitModal() {
  if (!sessionStore.accessToken) {
    return
  }

  if (editingUserId.value) {
    const payload: UpdateUserPayload = {
      login: modalDraft.login.trim(),
      role: modalDraft.role,
      email: modalDraft.email.trim() || undefined,
      telegramUsername: modalDraft.telegramUsername.trim() || undefined,
      isApproved: modalDraft.isApproved,
    }

    await appDataStore.updateUser(sessionStore.accessToken, editingUserId.value, payload)
  } else {
    const payload: CreateUserPayload = {
      login: modalDraft.login.trim(),
      password: modalDraft.password,
      role: modalDraft.role,
      email: modalDraft.email.trim() || undefined,
      telegramUsername: modalDraft.telegramUsername.trim() || undefined,
      isApproved: modalDraft.isApproved,
    }

    await appDataStore.createUser(sessionStore.accessToken, payload)
  }

  closeModal()
}

async function approveUser(user: AppUser) {
  if (!sessionStore.accessToken) {
    return
  }

  await appDataStore.updateUser(sessionStore.accessToken, user.id, {
    isApproved: true,
  })
}
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Admin users</p>
        <h2>РџРѕР»СЊР·РѕРІР°С‚РµР»Рё Рё РґРѕСЃС‚СѓРїС‹</h2>
      </div>
      <button class="button button--primary" type="button" @click="openCreateModal">
        Р”РѕР±Р°РІРёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
      </button>
    </div>

    <p class="section-copy">
      Р РµРіРёСЃС‚СЂР°С†РёСЏ С‚РµРїРµСЂСЊ СЃРѕР·РґР°С‘С‚ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Р±РµР· РґРѕСЃС‚СѓРїР°. РђРґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ РјРѕР¶РµС‚ РїРѕРґС‚РІРµСЂРґРёС‚СЊ
      Р°РєРєР°СѓРЅС‚, СЃРєРѕСЂСЂРµРєС‚РёСЂРѕРІР°С‚СЊ СЂРѕР»СЊ Рё РґРѕР±Р°РІРёС‚СЊ РЅРѕРІС‹С… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РІСЂСѓС‡РЅСѓСЋ РёР· СЌС‚РѕР№ С‚Р°Р±Р»РёС†С‹.
    </p>

    <div class="tab-row">
      <button
        v-for="tab in tabItems"
        :key="tab.key"
        class="tab-row__button"
        :class="{ 'tab-row__button--active': activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >
        {{ tab.label }} В· {{ tab.count }}
      </button>
    </div>
  </section>

  <section class="panel">
    <div class="table-shell">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col">Р›РѕРіРёРЅ</th>
            <th scope="col">Р РѕР»СЊ</th>
            <th scope="col">РЎС‚Р°С‚СѓСЃ</th>
            <th scope="col">РљРѕРЅС‚Р°РєС‚С‹</th>
            <th scope="col">РђРїСЂСѓРІ</th>
            <th scope="col">Р”РµР№СЃС‚РІРёСЏ</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td data-label="Логин">
              <strong>{{ user.login }}</strong>
              <p class="section-copy">{{ formatDateTime(user.createdAt) }}</p>
            </td>
            <td data-label="Роль">{{ roleOptions.find((option) => option.value === user.role)?.label ?? user.role }}</td>
            <td data-label="Статус">
              <span class="pill" :class="{ 'pill--muted': !user.isApproved }">
                {{ user.isApproved ? 'РџРѕРґС‚РІРµСЂР¶РґС‘РЅ' : 'РћР¶РёРґР°РµС‚ Р°РїСЂСѓРІ' }}
              </span>
            </td>
            <td data-label="Контакты">
              <p>{{ user.email ?? 'Email РЅРµ СѓРєР°Р·Р°РЅ' }}</p>
              <p>{{ user.telegramUsername ?? 'Telegram РЅРµ СѓРєР°Р·Р°РЅ' }}</p>
            </td>
            <td data-label="Апрув">
              <p>{{ formatDateTime(user.approvedAt) }}</p>
              <p v-if="user.approvedBy" class="section-copy">РџРѕРґС‚РІРµСЂРґРёР»: {{ user.approvedBy.login }}</p>
            </td>
            <td data-label="Действия">
              <div class="pill-row">
                <button class="button button--ghost" type="button" @click="openEditModal(user)">
                  РР·РјРµРЅРёС‚СЊ
                </button>
                <button
                  v-if="!user.isApproved"
                  class="button button--secondary"
                  type="button"
                  @click="approveUser(user)"
                >
                  РђРїСЂСѓРІРЅСѓС‚СЊ
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredUsers.length === 0">
            <td colspan="6" class="data-table__empty">
              Р’ СЌС‚РѕР№ РІРєР»Р°РґРєРµ РїРѕРєР° РЅРµС‚ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <section class="modal-card">
        <div class="panel__header">
          <div>
            <p class="section-label">User editor</p>
            <h3>{{ modalTitle }}</h3>
          </div>
          <button class="button button--ghost" type="button" @click="closeModal">Р—Р°РєСЂС‹С‚СЊ</button>
        </div>

        <div class="editor-grid">
          <label class="field">
            <span>Р›РѕРіРёРЅ</span>
            <input v-model="modalDraft.login" class="input" type="text" autocomplete="username" />
          </label>

          <label v-if="!editingUserId" class="field">
            <span>РџР°СЂРѕР»СЊ</span>
            <input
              v-model="modalDraft.password"
              class="input"
              type="password"
              autocomplete="new-password"
            />
          </label>

          <label class="field">
            <span>Р РѕР»СЊ</span>
            <select v-model="modalDraft.role" class="input">
              <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Email</span>
            <input v-model="modalDraft.email" class="input" type="email" autocomplete="email" />
          </label>

          <label class="field">
            <span>Telegram</span>
            <input v-model="modalDraft.telegramUsername" class="input" type="text" />
          </label>

          <label class="field">
            <span>Р”РѕСЃС‚СѓРї РѕС‚РєСЂС‹С‚</span>
            <input v-model="modalDraft.isApproved" class="toggle" type="checkbox" />
          </label>
        </div>

        <div class="modal-actions">
          <button class="button button--ghost" type="button" @click="closeModal">РћС‚РјРµРЅР°</button>
          <button class="button button--primary" type="button" @click="submitModal">
            РЎРѕС…СЂР°РЅРёС‚СЊ
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>



