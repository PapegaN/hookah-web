import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError, api } from '@/lib/api'
import type {
  AppUser,
  CreateOrderPayload,
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

export const useAppDataStore = defineStore('app-data', () => {
  const references = ref<ReferencesSnapshot>(emptyReferences())
  const users = ref<AppUser[]>([])
  const orders = ref<OrderView[]>([])
  const isBootstrapping = ref(false)
  const errorMessage = ref<string | null>(null)

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
      orders.value = ordersResponse
      users.value = usersResponse
    } catch (error) {
      errorMessage.value =
        error instanceof ApiError ? 'Не удалось загрузить данные панели.' : 'Ошибка загрузки'
      throw error
    } finally {
      isBootstrapping.value = false
    }
  }

  function reset() {
    references.value = emptyReferences()
    users.value = []
    orders.value = []
    errorMessage.value = null
  }

  async function updateUser(token: string, userId: string, payload: UpdateUserPayload) {
    const updatedUser = await api.updateUser(token, userId, payload)
    users.value = users.value.map((user) => (user.id === userId ? updatedUser : user))
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
    orders.value = [createdOrder, ...orders.value]
  }

  async function startOrder(token: string, orderId: string) {
    const updatedOrder = await api.startOrder(token, orderId)
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

  function replaceOrder(updatedOrder: OrderView) {
    orders.value = orders.value
      .map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }

  return {
    references,
    users,
    orders,
    latestClientOrder,
    isBootstrapping,
    errorMessage,
    bootstrap,
    reset,
    updateUser,
    createReference,
    updateReference,
    createOrder,
    startOrder,
    fulfillOrder,
    submitFeedback,
  }
})
