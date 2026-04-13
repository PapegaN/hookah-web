import type { TobaccoReference } from '@/types/app'

export interface TobaccoFilters {
  brand: string
  strength: string
  search: string
}

export function filterTobaccos(
  tobaccos: TobaccoReference[],
  filters: TobaccoFilters,
): TobaccoReference[] {
  const normalizedSearch = filters.search.trim().toLowerCase()

  return tobaccos.filter((tobacco) => {
    const matchesBrand =
      !filters.brand || tobacco.brand.toLowerCase() === filters.brand.toLowerCase()
    const matchesStrength =
      !filters.strength || String(tobacco.estimatedStrengthLevel) === filters.strength
    const matchesSearch =
      !normalizedSearch ||
      [tobacco.brand, tobacco.line, tobacco.flavorName, tobacco.flavorDescription]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)

    return tobacco.isActive && matchesBrand && matchesStrength && matchesSearch
  })
}

export function mergeTobaccoSelection(
  currentSelection: string[],
  tobaccoId: string,
  limit = 3,
): string[] {
  if (currentSelection.includes(tobaccoId)) {
    return currentSelection
  }

  if (currentSelection.length >= limit) {
    return currentSelection
  }

  return [...currentSelection, tobaccoId]
}

export function removeTobaccoSelection(
  currentSelection: string[],
  tobaccoId: string,
): string[] {
  return currentSelection.filter((entry) => entry !== tobaccoId)
}
