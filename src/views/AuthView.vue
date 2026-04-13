<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()

const mode = ref<'login' | 'register'>('login')

const loginForm = reactive({
  login: 'admin',
  password: 'admin',
})

const registerForm = reactive({
  login: '',
  password: '',
  email: '',
  telegramUsername: '',
})

onMounted(() => {
  void sessionStore.loadDemoAccounts().catch(() => undefined)
})

async function submitLogin() {
  await sessionStore.login(loginForm)

  const redirectTarget =
    typeof route.query.redirect === 'string' ? route.query.redirect : '/'

  await router.push(redirectTarget)
}

async function submitRegister() {
  await sessionStore.register({
    login: registerForm.login,
    password: registerForm.password,
    email: registerForm.email || undefined,
    telegramUsername: registerForm.telegramUsername || undefined,
  })
  await router.push('/client/order/new')
}

function fillDemoAccount(login: string, password: string) {
  loginForm.login = login
  loginForm.password = password
  mode.value = 'login'
}

const roleLabels = {
  admin: 'Администратор',
  hookah_master: 'Кальянный мастер',
  client: 'Клиент',
}
</script>

<template>
  <div class="auth-layout">
    <section class="auth-hero">
      <p class="eyebrow">Hookah Admin Panel</p>
      <h1>Адаптивная административная панель кальянной</h1>
      <p>
        Один интерфейс для администратора, мастера и клиента: управление
        пользователями, справочниками и заказами от выбора вкусов до оценки
        готового кальяна.
      </p>

      <div class="hero-highlights">
        <article class="hero-highlights__item">
          <strong>Админ</strong>
          <span>Пользователи, роли и редактирование справочников.</span>
        </article>
        <article class="hero-highlights__item">
          <strong>Мастер</strong>
          <span>Рабочий борд заказов и фактическая забивка.</span>
        </article>
        <article class="hero-highlights__item">
          <strong>Клиент</strong>
          <span>Конструктор вкусов, ожидание заказа и отзыв.</span>
        </article>
      </div>
    </section>

    <section class="auth-card">
      <div class="tab-row">
        <button
          class="tab-row__button"
          :class="{ 'tab-row__button--active': mode === 'login' }"
          type="button"
          @click="mode = 'login'"
        >
          Вход
        </button>
        <button
          class="tab-row__button"
          :class="{ 'tab-row__button--active': mode === 'register' }"
          type="button"
          @click="mode = 'register'"
        >
          Регистрация
        </button>
      </div>

      <form v-if="mode === 'login'" class="auth-form" @submit.prevent="submitLogin">
        <label class="field">
          <span>Логин</span>
          <input v-model="loginForm.login" class="input" type="text" autocomplete="username" />
        </label>

        <label class="field">
          <span>Пароль</span>
          <input
            v-model="loginForm.password"
            class="input"
            type="password"
            autocomplete="current-password"
          />
        </label>

        <p v-if="sessionStore.errorMessage" class="form-error">{{ sessionStore.errorMessage }}</p>

        <button class="button button--primary" type="submit" :disabled="sessionStore.isSubmitting">
          Войти в систему
        </button>
      </form>

      <form v-else class="auth-form" @submit.prevent="submitRegister">
        <label class="field">
          <span>Логин</span>
          <input v-model="registerForm.login" class="input" type="text" autocomplete="username" />
        </label>

        <label class="field">
          <span>Пароль</span>
          <input
            v-model="registerForm.password"
            class="input"
            type="password"
            autocomplete="new-password"
          />
        </label>

        <label class="field">
          <span>Email</span>
          <input v-model="registerForm.email" class="input" type="email" autocomplete="email" />
        </label>

        <label class="field">
          <span>Telegram username</span>
          <input v-model="registerForm.telegramUsername" class="input" type="text" />
        </label>

        <p v-if="sessionStore.errorMessage" class="form-error">{{ sessionStore.errorMessage }}</p>

        <button class="button button--primary" type="submit" :disabled="sessionStore.isSubmitting">
          Создать аккаунт клиента
        </button>
      </form>

      <section v-if="sessionStore.demoAccounts" class="demo-panel">
        <div class="demo-panel__header">
          <div>
            <p class="section-label">Demo accounts</p>
            <h3>Быстрый вход для проверки ролей</h3>
          </div>
          <span class="pill">
            default {{ sessionStore.demoAccounts.defaultAdmin.login }} /
            {{ sessionStore.demoAccounts.defaultAdmin.password }}
          </span>
        </div>

        <div class="demo-panel__grid">
          <button
            v-for="account in sessionStore.demoAccounts.accounts"
            :key="account.login"
            class="demo-account"
            type="button"
            @click="fillDemoAccount(account.login, account.password)"
          >
            <strong>{{ roleLabels[account.role] }}</strong>
            <span>{{ account.login }} / {{ account.password }}</span>
          </button>
        </div>
      </section>
    </section>
  </div>
</template>
