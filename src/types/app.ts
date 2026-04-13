export type UserRole = 'admin' | 'hookah_master' | 'client'

export type OrderStatus = 'new' | 'in_progress' | 'ready_for_feedback' | 'rated'

export type ReferenceEntityType =
  | 'tobaccos'
  | 'hookahs'
  | 'bowls'
  | 'kalauds'
  | 'charcoals'

export interface AppUser {
  id: string
  login: string
  role: UserRole
  email?: string
  telegramUsername?: string
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

export interface OrderView {
  id: string
  status: OrderStatus
  description: string
  createdAt: string
  updatedAt: string
  deliveredAt?: string
  client: AppUser
  acceptedBy?: AppUser
  requestedTobaccos: TobaccoReference[]
  actualTobaccos: TobaccoReference[]
  packingComment?: string
  ratingScore?: number
  ratingReview?: string
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
