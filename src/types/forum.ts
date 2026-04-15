import type { ReferenceEntityType } from '@/types/app'

export type PublicForumSectionKey = Extract<
  ReferenceEntityType,
  'tobaccos' | 'hookahs' | 'bowls' | 'kalauds' | 'charcoals' | 'electric_heads'
>

export interface PublicForumParameter {
  label: string
  value: string
}

export interface PublicForumComment {
  id: string
  authorName: string
  createdAt: string
  text: string
  photoUrls: string[]
}

export interface PublicForumReview {
  id: string
  authorName: string
  createdAt: string
  rating: number
  text: string
  photoUrls: string[]
}

export interface PublicForumSectionSummary {
  key: PublicForumSectionKey
  title: string
  description: string
  itemCount: number
  brands: string[]
}

export interface PublicForumCatalogItem {
  id: string
  section: PublicForumSectionKey
  brand: string
  model: string
  title: string
  subtitle: string
  description: string
  imageUrl?: string
  ratingAverage: number
  reviewCount: number
  commentCount: number
  parameters: PublicForumParameter[]
}

export interface PublicForumCatalogSnapshot {
  sections: PublicForumSectionSummary[]
  items: PublicForumCatalogItem[]
}

export interface PublicForumItemDetail extends PublicForumCatalogItem {
  comments: PublicForumComment[]
  reviews: PublicForumReview[]
}
