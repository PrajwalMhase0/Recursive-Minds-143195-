/**
 * Slot Distribution Service
 * Allows APMC Mandi Operators to distribute, create, and customize time slots
 * and slot capacities for particular dates, which dynamically appear in the
 * Farmer Booking section.
 */

export interface DistributedSlot {
  time: string
  booked: number
  max: number
  distributedByOperator?: boolean
  notes?: string
  createdAt?: string
}

const STORAGE_KEY = 'krishisetu_distributed_slots_v1'

// In-memory cache
const memorySlots: Record<string, DistributedSlot[]> = {}

function getStoredData(): Record<string, DistributedSlot[]> {
  if (typeof window === 'undefined') return memorySlots
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {}
  return memorySlots
}

function saveStoredData(data: Record<string, DistributedSlot[]>) {
  Object.assign(memorySlots, data)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      window.dispatchEvent(new CustomEvent('krishisetu_slots_updated', { detail: data }))
    } catch {}
  }
}

/**
 * Get all operator-distributed slots for a specific date (YYYY-MM-DD)
 */
export function getCustomDistributedSlots(dateStr: string): DistributedSlot[] {
  const data = getStoredData()
  return data[dateStr] || []
}

/**
 * Add a new time slot or increase capacity for a specific date
 */
export function addDistributedSlot(
  dateStr: string,
  newSlot: { time: string; max: number; notes?: string }
): DistributedSlot[] {
  const data = getStoredData()
  const existingList = [...(data[dateStr] || [])]

  const existingIndex = existingList.findIndex(
    (s) => s.time.trim().toLowerCase() === newSlot.time.trim().toLowerCase()
  )

  if (existingIndex >= 0) {
    // Update existing distributed slot
    existingList[existingIndex] = {
      ...existingList[existingIndex],
      max: Number(newSlot.max),
      notes: newSlot.notes || existingList[existingIndex].notes,
      distributedByOperator: true,
    }
  } else {
    // Add new slot
    existingList.push({
      time: newSlot.time.trim(),
      booked: 0,
      max: Number(newSlot.max),
      distributedByOperator: true,
      notes: newSlot.notes || 'Operator Distributed Window',
      createdAt: new Date().toISOString(),
    })
  }

  data[dateStr] = existingList
  saveStoredData(data)
  return existingList
}

/**
 * Remove an operator-distributed slot
 */
export function removeDistributedSlot(dateStr: string, time: string): DistributedSlot[] {
  const data = getStoredData()
  if (!data[dateStr]) return []

  data[dateStr] = data[dateStr].filter(
    (s) => s.time.trim().toLowerCase() !== time.trim().toLowerCase()
  )
  saveStoredData(data)
  return data[dateStr]
}
