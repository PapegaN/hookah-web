import type {
  AppUser,
  AuthResponse,
  CompleteMediaUploadPayload,
  CreateMediaUploadPayload,
  CreateMediaUploadResponse,
  CreateUserPayload,
  CreateOrderPayload,
  DemoAccountsResponse,
  FulfillOrderPayload,
  OrderView,
  MediaAsset,
  ReferencesSnapshot,
  ReferenceEntityType,
  SettingsExportResponse,
  SettingsImportResponse,
  SettingsResource,
  SubmitFeedbackPayload,
  UpdateUserPayload,
  UpsertReferencePayload,
} from '@/types/app'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

// Таймаут HTTP-запросов к API (30 секунд).
// Защищает от «зависания» запросов при проблемах с сервером или сетью.
const API_TIMEOUT_MS = 30_000

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

/**
 * Создаёт AbortSignal с заданным таймаутом.
 * Если сервер не отвечает за указанное время, запрос будет отменён.
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller.signal
}

/**
 * Выполняет HTTP-запрос к API с автоматическим таймаутом.
 * Если вызывающий код уже передал свой signal, он будет использован
 * вместе с таймаутом (через RaceController).
 */
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

  // Если вызывающий код не передал свой signal, добавляем таймаут.
  // Если signal уже есть — оборачиваем его в composite с таймаутом.
  const timeoutSignal = createTimeoutSignal(API_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: timeoutSignal,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new ApiError(errorText || 'Request failed', response.status)
    }

    return (await response.json()) as T
  } catch (error) {
    // Преобразуем ошибку прерывания (таймаут) в понятный TimeoutError
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError()
    }
    throw error
  }
}

/**
 * Ошибка, возникающая при превышении таймаута HTTP-запроса.
 */
export class TimeoutError extends Error {
  constructor() {
    super('Request timed out')
  }
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
  exportSettings<T>(token: string, resource: SettingsResource) {
    return request<SettingsExportResponse<T>>(`/settings/export/${resource}`, {
      token,
    })
  },
  exportBackup(token: string) {
    return request<SettingsExportResponse>('/settings/backup', {
      token,
    })
  },
  importSettings(token: string, resource: SettingsResource, data: unknown) {
    return request<SettingsImportResponse>(`/settings/import/${resource}`, {
      method: 'POST',
      token,
      body: JSON.stringify({ data }),
    })
  },
  importBackup(token: string, data: unknown) {
    return request<SettingsImportResponse>('/settings/backup/import', {
      method: 'POST',
      token,
      body: JSON.stringify({ data }),
    })
  },
  createMediaUpload(token: string, payload: CreateMediaUploadPayload) {
    return request<CreateMediaUploadResponse>('/media/uploads/presign', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    })
  },
  completeMediaUpload(token: string, assetId: string, payload: CompleteMediaUploadPayload) {
    return request<MediaAsset>(`/media/assets/${assetId}/complete`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    })
  },
  getMediaAssets(token: string, limit = 20) {
    return request<MediaAsset[]>(`/media/assets?limit=${limit}`, {
      token,
    })
  },
}
