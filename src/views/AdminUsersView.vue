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
  { value: 'admin', label: 'Администратор' },
  { value: 'hookah_master', label: 'Кальянный мастер' },
  { value: 'client', label: 'Клиент' },
]

const tabItems = computed(() => [
  {
    key: 'pending' as const,
    label: 'Ожидают апрув',
    count: appDataStore.users.filter((user) => !user.isApproved).length,
  },
  {
    key: 'approved' as const,
    label: 'Подтверждённые',
    count: appDataStore.users.filter((user) => user.isApproved).length,
  },
  {
    key: 'all' as const,
    label: 'Все',
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
  editingUserId.value ? 'Редактировать пользователя' : 'Добавить пользователя',
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
    <div class="panel__header panel__header--compact-mobile">
      <div>
        <p class="section-label">Admin users</p>
        <h2>Пользователи и доступы</h2>
      </div>
      <button class="button button--primary button--full-width-mobile" type="button" @click="openCreateModal">
        Добавить пользователя
      </button>
    </div>

    <p class="section-copy">
      Регистрация теперь создаёт пользователя без доступа. Администратор может подтвердить
      аккаунт, скорректировать роль и добавить новых пользователей вручную из этой таблицы.
    </p>

    <div class="tab-row tab-row--scrollable">
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
            <th scope="col">Логин</th>
            <th scope="col">Роль</th>
            <th scope="col">Статус</th>
            <th scope="col">Контакты</th>
            <th scope="col">Апрув</th>
            <th scope="col">Действия</th>
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
                {{ user.isApproved ? 'Подтверждён' : 'Ожидает апрув' }}
              </span>
            </td>
            <td data-label="Контакты">
              <p>{{ user.email ?? 'Email не указан' }}</p>
              <p>{{ user.telegramUsername ?? 'Telegram не указан' }}</p>
            </td>
            <td data-label="Апрув">
              <p>{{ formatDateTime(user.approvedAt) }}</p>
              <p v-if="user.approvedBy" class="section-copy">Подтвердил: {{ user.approvedBy.login }}</p>
            </td>
            <td data-label="Действия">
              <div class="pill-row">
                <button class="button button--ghost" type="button" @click="openEditModal(user)">
                  Изменить
                </button>
                <button
                  v-if="!user.isApproved"
                  class="button button--secondary"
                  type="button"
                  @click="approveUser(user)"
                >
                  Апрувнуть
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredUsers.length === 0">
            <td colspan="6" class="data-table__empty">
              В этой вкладке пока нет пользователей.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <section class="modal-card">
        <div class="panel__header panel__header--compact-mobile">
          <div>
            <p class="section-label">User editor</p>
            <h3>{{ modalTitle }}</h3>
          </div>
          <button class="button button--ghost" type="button" @click="closeModal">Закрыть</button>
        </div>

        <div class="editor-grid">
          <label class="field">
            <span>Логин</span>
            <input v-model="modalDraft.login" class="input" type="text" autocomplete="username" />
          </label>

          <label v-if="!editingUserId" class="field">
            <span>Пароль</span>
            <input
              v-model="modalDraft.password"
              class="input"
              type="password"
              autocomplete="new-password"
            />
          </label>

          <label class="field">
            <span>Роль</span>
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
            <span>Доступ открыт</span>
            <input v-model="modalDraft.isApproved" class="toggle" type="checkbox" />
          </label>
        </div>

        <div class="modal-actions">
          <button class="button button--ghost" type="button" @click="closeModal">Отмена</button>
          <button class="button button--primary" type="button" @click="submitModal">
            Сохранить
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>



