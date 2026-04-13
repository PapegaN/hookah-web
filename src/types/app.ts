export type UserRole = 'admin' | 'hookah_master' | 'client'

export type OrderStatus = 'new' | 'in_progress' | 'ready_for_feedback' | 'rated'

export type OrderTimelineEventType =
  | 'created'
  | 'participant_joined'
  | 'participant_table_approved'
  | 'started'
  | 'delivered'
  | 'feedback_received'

export type TableApprovalStatus = 'pending' | 'approved'

export interface UserPreview {
  id: string
  login: string
}

export type ReferenceEntityType =
  | 'tobaccos'
  | 'hookahs'
  | 'bowls'
  | 'kalauds'
  | 'charcoals'

export type SettingsResource = ReferenceEntityType | 'users' | 'orders' | 'backup'

export interface AppUser {
  id: string
  login: string
  role: UserRole
  email?: string
  telegramUsername?: string
  isApproved: boolean
  approvedAt?: string
  approvedBy?: UserPreview
  createdAt: string
  updatedAt: string
}

export interface TobaccoReference {
  id: string
  brand: string
  line: string
  flavorName: string
  lineStrengthLevel: number
  estimatedStrengthLevel: number
  brightnessLevel: number
  flavorDescription: string
  isActive: boolean
}

export interface HookahReference {
  id: string
  manufacturer: string
  name: string
  innerDiameterMm: number
  hasDiffuser: boolean
  isActive: boolean
}

export interface BowlReference {
  id: string
  manufacturer: string
  name: string
  bowlType: 'phunnel' | 'killer' | 'turka' | 'elian'
  material?: string
  capacityBucket: 'bucket' | 'large' | 'medium' | 'small' | 'very_small'
  isActive: boolean
}

export interface KalaudReference {
  id: string
  manufacturer: string
  name: string
  material?: string
  color?: string
  isActive: boolean
}

export interface CharcoalReference {
  id: string
  manufacturer: string
  name: string
  sizeLabel: string
  isActive: boolean
}

export interface ReferencesSnapshot {
  tobaccos: TobaccoReference[]
  hookahs: HookahReference[]
  bowls: BowlReference[]
  kalauds: KalaudReference[]
  charcoals: CharcoalReference[]
}

export interface OrderFeedback {
  client: AppUser
  ratingScore: number
  ratingReview?: string
  submittedAt: string
}

export interface OrderParticipant {
  client: AppUser
  description: string
  joinedAt: string
  requestedTobaccos: TobaccoReference[]
  tableApprovalStatus: TableApprovalStatus
  tableApprovedAt?: string
  tableApprovedBy?: UserPreview
  feedback?: OrderFeedback
}

export interface OrderTimelineEntry {
  id: string
  type: OrderTimelineEventType
  status: OrderStatus
  occurredAt: string
  actor?: AppUser
  note: string
}

export interface OrderView {
  id: string
  tableLabel: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
  deliveredAt?: string
  feedbackAt?: string
  acceptedBy?: AppUser
  participants: OrderParticipant[]
  requestedTobaccos: TobaccoReference[]
  actualTobaccos: TobaccoReference[]
  packingComment?: string
  feedbacks: OrderFeedback[]
  timeline: OrderTimelineEntry[]
}

export interface OrderNotification {
  id: string
  orderId: string
  tableLabel: string
  title: string
  message: string
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  user: AppUser
}

export interface DemoAccount {
  login: string
  password: string
  role: UserRole
}

export interface DemoAccountsResponse {
  defaultAdmin: {
    login: string
    password: string
  }
  accounts: DemoAccount[]
}

export interface UpdateUserPayload {
  login?: string
  role?: UserRole
  email?: string
  telegramUsername?: string
  isApproved?: boolean
}

export interface CreateUserPayload {
  login: string
  password: string
  role: UserRole
  email?: string
  telegramUsername?: string
  isApproved?: boolean
}

export interface UpsertReferencePayload {
  brand?: string
  line?: string
  flavorName?: string
  lineStrengthLevel?: number
  estimatedStrengthLevel?: number
  brightnessLevel?: number
  flavorDescription?: string
  manufacturer?: string
  name?: string
  innerDiameterMm?: number
  hasDiffuser?: boolean
  bowlType?: BowlReference['bowlType']
  material?: string
  capacityBucket?: BowlReference['capacityBucket']
  color?: string
  sizeLabel?: string
  isActive?: boolean
}

export interface CreateOrderPayload {
  tableLabel: string
  description: string
  requestedTobaccoIds: string[]
}

export interface FulfillOrderPayload {
  actualTobaccoIds: string[]
  packingComment?: string
}

export interface SubmitFeedbackPayload {
  ratingScore: number
  ratingReview?: string
}

export interface SettingsExportResponse<T = unknown> {
  resource: SettingsResource
  exportedAt: string
  data: T
}

export interface SettingsImportResponse {
  resource: SettingsResource
  importedAt: string
  importedCount: number
}

export type EditableReferenceItem =
  | TobaccoReference
  | HookahReference
  | BowlReference
  | KalaudReference
  | CharcoalReference

export interface ReferenceFieldOption {
  label: string
  value: string
}

export interface ReferenceFieldConfig {
  key: string
  label: string
  kind: 'text' | 'textarea' | 'number' | 'boolean' | 'select'
  min?: number
  max?: number
  step?: number
  options?: ReferenceFieldOption[]
}

export interface ReferenceTableColumn {
  key: string
  label: string
  getValue: (item: EditableReferenceItem) => string
}
