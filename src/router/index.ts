import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import { pinia } from '@/plugins/pinia'
import { useSessionStore } from '@/stores/session'
import type { UserRole } from '@/types/app'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresGuest?: boolean
    allowPending?: boolean
    roles?: UserRole[]
  }
}

function getDefaultRoute(role?: UserRole, isApproved = true) {
  if (!isApproved) {
    return '/pending-approval'
  }

  switch (role) {
    case 'admin':
      return '/admin/users'
    case 'hookah_master':
      return '/staff/orders'
    case 'client':
      return '/client/order/new'
    default:
      return '/'
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/views/AuthView.vue'),
    meta: {
      requiresAuth: false,
      requiresGuest: true,
    },
  },
  {
    path: '/pending-approval',
    name: 'pending-approval',
    component: () => import('@/views/PendingApprovalView.vue'),
    meta: {
      requiresAuth: true,
      allowPending: true,
    },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/AdminUsersView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin'],
    },
  },
  {
    path: '/admin/references',
    name: 'admin-references',
    component: () => import('@/views/AdminReferencesView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin'],
    },
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('@/views/AdminSettingsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin'],
    },
  },
  {
    path: '/staff/orders',
    name: 'staff-orders',
    component: () => import('@/views/StaffOrdersView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'hookah_master'],
    },
  },
  {
    path: '/staff/orders/:id',
    name: 'staff-order-detail',
    component: () => import('@/views/StaffOrderDetailView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'hookah_master'],
    },
  },
  {
    path: '/staff/marking',
    name: 'staff-marking',
    component: () => import('@/views/TobaccoScannerView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'hookah_master'],
    },
  },
  {
    path: '/client/order/new',
    name: 'client-order-new',
    component: () => import('@/views/ClientOrderBuilderView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['client'],
    },
  },
  {
    path: '/client/order/status',
    name: 'client-order-status',
    component: () => import('@/views/ClientOrderStatusView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['client'],
    },
  },
  {
    path: '/inventory',
    redirect: '/admin/references',
  },
  {
    path: '/orders',
    redirect: '/staff/orders',
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      requiresAuth: false,
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const sessionStore = useSessionStore(pinia)

  sessionStore.hydrateFromStorage()

  if (to.meta.requiresGuest && sessionStore.isAuthenticated) {
    return getDefaultRoute(
      sessionStore.currentUser?.role,
      sessionStore.currentUser?.isApproved !== false,
    )
  }

  if (to.meta.requiresAuth === false) {
    return true
  }

  if (!sessionStore.isAuthenticated) {
    return {
      name: 'auth',
      query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined,
    }
  }

  if (sessionStore.currentUser?.isApproved === false && !to.meta.allowPending) {
    return '/pending-approval'
  }

  if (to.name === 'pending-approval' && sessionStore.currentUser?.isApproved !== false) {
    return getDefaultRoute(sessionStore.currentUser?.role, true)
  }

  if (to.meta.roles && !to.meta.roles.includes(sessionStore.currentUser!.role)) {
    return getDefaultRoute(
      sessionStore.currentUser?.role,
      sessionStore.currentUser?.isApproved !== false,
    )
  }

  return true
})

export default router
