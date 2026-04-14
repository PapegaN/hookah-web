import { describe, expect, it } from 'vitest'

import type { TobaccoReference } from '@/types/app'
import {
  filterTobaccos,
  mergeTobaccoSelection,
  removeTobaccoSelection,
} from '@/utils/tobacco'

const tobaccos: TobaccoReference[] = [
  {
    id: 'a',
    brand: 'Darkside',
    line: 'Core',
    flavorName: 'Supernova',
    lineStrengthLevel: 4,
    estimatedStrengthLevel: 5,
    brightnessLevel: 4,
    flavorDescription: 'Icy mint',
    flavorTags: [{ id: 'tag-a', name: 'Мятный', isActive: true }],
    inStock: true,
    isActive: true,
  },
  {
    id: 'b',
    brand: 'Musthave',
    line: 'Classic',
    flavorName: 'Kiwi Smoothie',
    lineStrengthLevel: 3,
    estimatedStrengthLevel: 3,
    brightnessLevel: 3,
    flavorDescription: 'Creamy kiwi mix',
    flavorTags: [{ id: 'tag-b', name: 'Фруктовый', isActive: true }],
    inStock: true,
    isActive: true,
  },
  {
    id: 'c',
    brand: 'Archive',
    line: 'Hidden',
    flavorName: 'Old Pear',
    lineStrengthLevel: 2,
    estimatedStrengthLevel: 2,
    brightnessLevel: 2,
    flavorDescription: 'Should not appear',
    flavorTags: [],
    inStock: false,
    isActive: false,
  },
]

describe('tobacco utils', () => {
  it('filters only active tobaccos by brand, strength and search', () => {
    const result = filterTobaccos(tobaccos, {
      brand: 'darkside',
      strength: '5',
      search: 'mint',
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('a')
  })

  it('adds items without duplicates and respects the limit', () => {
    const result = mergeTobaccoSelection(['a', 'b'], 'c', 2)

    expect(result).toEqual(['a', 'b'])
    expect(mergeTobaccoSelection(['a'], 'a')).toEqual(['a'])
  })

  it('removes selected tobacco by id', () => {
    expect(removeTobaccoSelection(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
  })
})
