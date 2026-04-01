/**
 * NHTSA Vehicle API Integration
 * Fetches makes and models from the National Highway Traffic Safety Administration
 * https://vpic.nhtsa.dot.gov/api/
 */

const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles'

export interface NHTSAMake {
  Make_ID: number
  Make_Name: string
}

export interface NHTSAModel {
  Model_ID: number
  Model_Name: string
  Make_ID: number
  Make_Name: string
}

export interface NHTSAModelYear {
  Model_ID: number
  Model_Name: string
  Make_ID: number
  Make_Name: string
}

/**
 * Fetch all makes for passenger cars
 */
export async function getAllMakes(): Promise<NHTSAMake[]> {
  const url = `${NHTSA_BASE_URL}/GetMakesForVehicleType/car?format=json`
  
  const res = await fetch(url, { next: { revalidate: 86400 } }) // Cache for 24h
  if (!res.ok) {
    throw new Error(`NHTSA API error: ${res.status}`)
  }
  
  const data = await res.json()
  return data.Results || []
}

/**
 * Fetch models for a specific make
 */
export async function getModelsForMake(makeId: number): Promise<NHTSAModel[]> {
  const url = `${NHTSA_BASE_URL}/GetModelsForMakeId/${makeId}?format=json`
  
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) {
    throw new Error(`NHTSA API error: ${res.status}`)
  }
  
  const data = await res.json()
  return data.Results || []
}

/**
 * Fetch models for a make and year
 */
export async function getModelsForMakeYear(
  makeId: number,
  year: number
): Promise<NHTSAModelYear[]> {
  const url = `${NHTSA_BASE_URL}/GetModelsForMakeIdYear/makeId/${makeId}/modelyear/${year}?format=json`
  
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) {
    throw new Error(`NHTSA API error: ${res.status}`)
  }
  
  const data = await res.json()
  return data.Results || []
}

/**
 * Popular makes to prioritize in the dropdown (pre-sorted)
 */
export const POPULAR_MAKES = [
  'Toyota',
  'Honda',
  'Ford',
  'Chevrolet',
  'Tesla',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Lexus',
  'Nissan',
  'Hyundai',
  'Kia',
  'Subaru',
  'Mazda',
  'Volkswagen',
  'Jeep',
  'Ram',
  'GMC',
  'Dodge',
  'Porsche',
]

/**
 * Years available for vehicle selection (current year + 1 down to 2000)
 */
export function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear + 1; y >= 2000; y--) {
    years.push(y)
  }
  return years
}

/**
 * Normalize make name for consistent matching
 */
export function normalizeMakeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Sort makes with popular ones first
 */
export function sortMakesWithPopularFirst<T extends { name: string }>(
  makes: T[]
): T[] {
  const popularSet = new Set(POPULAR_MAKES.map(normalizeMakeName))
  
  return [...makes].sort((a, b) => {
    const aPopular = popularSet.has(normalizeMakeName(a.name))
    const bPopular = popularSet.has(normalizeMakeName(b.name))
    
    if (aPopular && !bPopular) return -1
    if (!aPopular && bPopular) return 1
    
    // Both popular or both not - sort by popularity order or alphabetically
    if (aPopular && bPopular) {
      const aIndex = POPULAR_MAKES.findIndex(
        p => normalizeMakeName(p) === normalizeMakeName(a.name)
      )
      const bIndex = POPULAR_MAKES.findIndex(
        p => normalizeMakeName(p) === normalizeMakeName(b.name)
      )
      return aIndex - bIndex
    }
    
    return a.name.localeCompare(b.name)
  })
}
