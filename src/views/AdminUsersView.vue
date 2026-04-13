<script setup lang="ts">
import { reactive } from 'vue'

import { useAppDataStore } from '@/stores/app-data'
import { useSessionStore } from '@/stores/session'
import type { AppUser, UserRole } from '@/types/app'

const sessionStore = useSessionStore()
const appDataStore = useAppDataStore()

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'admin', label: 'Администратор' },
  { value: 'hookah_master', label: 'Кальянный мастер' },
  { value: 'client', label: 'Клиент' },
]

interface UserDraft {
  login: string
  role: UserRole
  email: string
  telegramUsername: string
}

const drafts = reactive<Record<string, UserDraft>>({})

function buildDraft(user: AppUser): UserDraft {
  return {
    login: user.login,
    role: user.role,
    email: user.email ?? '',
    telegramUsername: user.telegramUsername ?? '',
  }
}

function getDraft(user: AppUser): UserDraft {
  let draft = drafts[user.id]

  if (!draft) {
    draft = buildDraft(user)
    drafts[user.id] = draft
  }

  return draft
}

async function saveUser(userId: string) {
  if (!sessionStore.accessToken) {
    return
  }

  const draft = drafts[userId]

  if (!draft) {
    return
  }

  await appDataStore.updateUser(sessionStore.accessToken, userId, {
    login: draft.login,
    role: draft.role,
    email: draft.email || undefined,
    telegramUsername: draft.telegramUsername || undefined,
  })
}
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <p class="section-label">Admin users</p>
        <h2>Управление пользователями</h2>
      </div>
      <p class="section-copy">
        Администратор может менять роль, контакты и логин пользователя. Пока
        регистрация создает клиентов, а дефолтный пользователь `admin/admin`
        доступен сразу.
      </p>
    </div>

    <div class="stack">
      <article v-for="user in appDataStore.users" :key="user.id" class="editor-card">
        <div class="editor-card__header">
          <div>
            <p class="section-label">User</p>
            <h3>{{ user.login }}</h3>
          </div>
          <span class="pill">{{ user.role }}</span>
        </div>

        <div class="editor-grid">
          <label class="field">
            <span>Логин</span>
            <input v-model="getDraft(user).login" class="input" type="text" />
          </label>

          <label class="field">
            <span>Роль</span>
            <select v-model="getDraft(user).role" class="input">
              <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Email</span>
            <input v-model="getDraft(user).email" class="input" type="email" />
          </label>

          <label class="field">
            <span>Telegram</span>
            <input v-model="getDraft(user).telegramUsername" class="input" type="text" />
          </label>
        </div>

        <button class="button button--secondary" type="button" @click="saveUser(user.id)">
          Сохранить пользователя
        </button>
      </article>
    </div>
  </section>
</template>
