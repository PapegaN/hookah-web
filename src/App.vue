<script setup lang="ts">
const navigationItems = [
  { name: 'Панель', to: '/' },
  { name: 'Табак и остатки', to: '/inventory' },
  { name: 'Заказы', to: '/orders' },
]
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Hookah Lounge Control</p>
        <h1>Операционная панель кальянной</h1>
      </div>
      <nav class="navigation" aria-label="Основная навигация">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="navigation__link"
        >
          {{ item.name }}
        </RouterLink>
      </nav>
    </header>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>
