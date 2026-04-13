import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError, api } from '@/lib/api'
import type {
  AppUser,
  CreateUserPayload,
  CreateOrderPayload,
  OrderNotification,
  OrderView,
  ReferenceEntityType,
  ReferencesSnapshot,
  SubmitFeedbackPayload,
  UpdateUserPayload,
  UpsertReferencePayload,
} from '@/types/app'

const emptyReferences = (): ReferencesSnapshot => ({
  tobaccos: [],
  hookahs: [],
  bowls: [],
  kalauds: [],
  charcoals: [],
})

interface OrderSnapshot {
  updatedAt: string
  participantCount: number
  status: OrderView['status']
}

export const useAppDataStore = defineStore('app-data', () => {
  const references = ref<ReferencesSnapshot>(emptyReferences())
  const users = ref<AppUser[]>([])
  const orders = ref<OrderView[]>([])
  const staffNotifications = ref<OrderNotification[]>([])
  const isBootstrapping = ref(false)
  const errorMessage = ref<string | null>(null)
  const orderSnapshots = ref<Record<string, OrderSnapshot>>({})

  const latestClientOrder = computed(() => orders.value[0] ?? null)

  async function bootstrap(token: string, currentUser: AppUser) {
    isBootstrapping.value = true
    errorMessage.value = null

    try {
      const [referencesResponse, ordersResponse, usersResponse] = await Promise.all([
        api.getReferences(token),
        api.getOrders(token),
        currentUser.role === 'admin' ? api.getUsers(token) : Promise.resolve([]),
      ])

      references.value = referencesResponse
      applyOrders(ordersResponse, {
        currentUser,
        notify: false,
      })
      users.value = sortUsers(usersResponse)
    } catch (error) {
      errorMessage.value =
        error instanceof ApiError
          ? 'Не удалось загрузить данные панели.'
          : 'Ошибка загрузки'
      throw error
    } finally {
      isBootstrapping.value = false
    }
  }

  async function refreshOrders(
    token: string,
    currentUser: AppUser,
    options: {
      notify?: boolean
    } = {},
  ) {
    const nextOrders = await api.getOrders(token)
    applyOrders(nextOrders, {
      currentUser,
      notify: options.notify ?? false,
    })
  }

  function reset() {
    references.value = emptyReferences()
    users.value = []
    orders.value = []
    staffNotifications.value = []
    errorMessage.value = null
    orderSnapshots.value = {}
  }

  async function updateUser(token: string, userId: string, payload: UpdateUserPayload) {
    const updatedUser = await api.updateUser(token, userId, payload)
    users.value = sortUsers(users.value.map((user) => (user.id === userId ? updatedUser : user)))
  }

  async function createUser(token: string, payload: CreateUserPayload) {
    const createdUser = await api.createUser(token, payload)
    users.value = sortUsers([createdUser, ...users.value.filter((user) => user.id !== createdUser.id)])
  }

  async function createReference(
    token: string,
    entityType: ReferenceEntityType,
    payload: UpsertReferencePayload,
  ) {
    await api.createReference(token, entityType, payload)
    references.value = await api.getReferences(token)
  }

  async function updateReference(
    token: string,
    entityType: ReferenceEntityType,
    itemId: string,
    payload: UpsertReferencePayload,
  ) {
    await api.updateReference(token, entityType, itemId, payload)
    references.value = await api.getReferences(token)
  }

  async function createOrder(token: string, payload: CreateOrderPayload) {
    const createdOrder = await api.createOrder(token, payload)
    replaceOrder(createdOrder)
  }

  async function startOrder(token: string, orderId: string) {
    const updatedOrder = await api.startOrder(token, orderId)
    replaceOrder(updatedOrder)
  }

  async function approveParticipantTable(token: string, orderId: string, clientUserId: string) {
    const updatedOrder = await api.approveParticipantTable(token, orderId, clientUserId)
    replaceOrder(updatedOrder)
  }

  async function fulfillOrder(
    token: string,
    orderId: string,
    payload: {
      actualTobaccoIds: string[]
      packingComment?: string
    },
  ) {
    const updatedOrder = await api.fulfillOrder(token, orderId, payload)
    replaceOrder(updatedOrder)
  }

  async function submitFeedback(
    token: string,
    orderId: string,
    payload: SubmitFeedbackPayload,
  ) {
    const updatedOrder = await api.submitFeedback(token, orderId, payload)
    replaceOrder(updatedOrder)
  }

  function dismissNotification(notificationId: string) {
    staffNotifications.value = staffNotifications.value.filter(
      (notification) => notification.id !== notificationId,
    )
  }

  function clearNotifications() {
    staffNotifications.value = []
  }

  function applyOrders(
    nextOrders: OrderView[],
    options: {
      currentUser: AppUser
      notify: boolean
    },
  ) {
    const nextSnapshots = buildOrderSnapshots(nextOrders)

    if (options.notify && options.currentUser.role !== 'client') {
      const notifications = buildNotifications(orderSnapshots.value, nextOrders)

      if (notifications.length > 0) {
        staffNotifications.value = [...notifications, ...staffNotifications.value].slice(0, 5)
      }
    }

    orders.value = sortOrders(nextOrders)
    orderSnapshots.value = nextSnapshots
  }

  function replaceOrder(updatedOrder: OrderView) {
    const nextOrders = sortOrders([
      updatedOrder,
      ...orders.value.filter((order) => order.id !== updatedOrder.id),
    ])

    orders.value = nextOrders
    orderSnapshots.value = buildOrderSnapshots(nextOrders)
  }

  return {
    references,
    users,
    orders,
    staffNotifications,
    latestClientOrder,
    isBootstrapping,
    errorMessage,
    bootstrap,
    refreshOrders,
    reset,
    updateUser,
    createUser,
    createReference,
    updateReference,
    createOrder,
    approveParticipantTable,
    startOrder,
    fulfillOrder,
    submitFeedback,
    dismissNotification,
    clearNotifications,
  }
})

function sortOrders(items: OrderView[]) {
  return items.slice().sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function sortUsers(items: AppUser[]) {
  return items
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function buildOrderSnapshots(items: OrderView[]) {
  return Object.fromEntries(
    items.map((order) => [
      order.id,
      {
        updatedAt: order.updatedAt,
        participantCount: order.participants.length,
        status: order.status,
      } satisfies OrderSnapshot,
    ]),
  )
}

function buildNotifications(
  previousSnapshots: Record<string, OrderSnapshot>,
  nextOrders: OrderView[],
): OrderNotification[] {
  return nextOrders.flatMap((order) => {
    const previous = previousSnapshots[order.id]
    const createdAt = new Date().toISOString()

    if (!previous && order.status === 'new') {
      return [
        {
          id: `${order.id}:${createdAt}:created`,
          orderId: order.id,
          tableLabel: order.tableLabel,
          title: 'Новый заказ',
          message: `${order.tableLabel}: новый заказ ожидает мастера.`,
          createdAt,
        },
      ]
    }

    if (
      previous &&
      order.participants.length > previous.participantCount &&
      (order.status === 'new' || order.status === 'in_progress')
    ) {
      return [
        {
          id: `${order.id}:${createdAt}:participant`,
          orderId: order.id,
          tableLabel: order.tableLabel,
          title: 'Новый гость у стола',
          message: `${order.tableLabel}: к заказу присоединился ещё один клиент.`,
          createdAt,
        },
      ]
    }

    return []
  })
}
