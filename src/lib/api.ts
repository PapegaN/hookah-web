import type {
  AppUser,
  AuthResponse,
  CreateUserPayload,
  CreateOrderPayload,
  DemoAccountsResponse,
  FulfillOrderPayload,
  OrderView,
  ReferencesSnapshot,
  ReferenceEntityType,
  SubmitFeedbackPayload,
  UpdateUserPayload,
  UpsertReferencePayload,
} from '@/types/app'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new ApiError(errorText || 'Request failed', response.status)
  }

  return (await response.json()) as T
}

export const api = {
  getDemoAccounts() {
    return request<DemoAccountsResponse>('/auth/demo-accounts')
  },
  login(payload: { login: string; password: string }) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  register(payload: {
    login: string
    password: string
    email?: string
    telegramUsername?: string
  }) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  me(token: string) {
    return request<AppUser>('/auth/me', {
      token,
    })
  },
  getUsers(token: string) {
    return request<AppUser[]>('/users', {
      token,
    })
  },
  createUser(token: string, payload: CreateUserPayload) {
    return request<AppUser>('/users', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    })
  },
  updateUser(token: string, userId: string, payload: UpdateUserPayload) {
    return request<AppUser>(`/users/${userId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    })
  },
  getReferences(token: string) {
    return request<ReferencesSnapshot>('/references', {
      token,
    })
  },
  createReference(
    token: string,
    entityType: ReferenceEntityType,
    payload: UpsertReferencePayload,
  ) {
    return request(`/references/${entityType}`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    })
  },
  updateReference(
    token: string,
    entityType: ReferenceEntityType,
    itemId: string,
    payload: UpsertReferencePayload,
  ) {
    return request(`/references/${entityType}/${itemId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    })
  },
  getOrders(token: string) {
    return request<OrderView[]>('/orders', {
      token,
    })
  },
  getOrder(token: string, orderId: string) {
    return request<OrderView>(`/orders/${orderId}`, {
      token,
    })
  },
  createOrder(token: string, payload: CreateOrderPayload) {
    return request<OrderView>('/orders', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    })
  },
  startOrder(token: string, orderId: string) {
    return request<OrderView>(`/orders/${orderId}/start`, {
      method: 'PATCH',
      token,
    })
  },
  approveParticipantTable(token: string, orderId: string, clientUserId: string) {
    return request<OrderView>(`/orders/${orderId}/participants/${clientUserId}/approve-table`, {
      method: 'PATCH',
      token,
    })
  },
  fulfillOrder(token: string, orderId: string, payload: FulfillOrderPayload) {
    return request<OrderView>(`/orders/${orderId}/fulfill`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    })
  },
  submitFeedback(
    token: string,
    orderId: string,
    payload: SubmitFeedbackPayload,
  ) {
    return request<OrderView>(`/orders/${orderId}/feedback`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    })
  },
}
