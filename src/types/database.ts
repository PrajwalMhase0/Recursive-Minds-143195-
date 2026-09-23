export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ProcurementCentre {
  id: string
  name: string
  location: string
  district: string
  state: string
  latitude: number
  longitude: number
  max_capacity_per_slot: number
  contact_phone: string
  created_at?: string
}

export interface Farmer {
  id: string
  farmer_id_code: string
  name: string
  phone: string
  village: string
  district: string
  state: string
  registered_crops: string[]
  preferred_centre_id: string
  verified: boolean
  aadhaar_last4: string
  created_at?: string
}

export type BookingStatus =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'IN_QUEUE'
  | 'AT_COUNTER'
  | 'GRADED'
  | 'PROCURED'
  | 'PAYMENT_INITIATED'
  | 'COMPLETED'
  | 'CANCELLED'

export interface Booking {
  id: string
  booking_code: string
  farmer_id: string
  centre_id: string
  slot_date: string
  slot_time: string
  crop: string
  approx_quantity_quintals: number
  status: BookingStatus
  queue_number: number | null
  check_in_time: string | null
  created_at?: string
  // Joins
  farmer?: Farmer
  procurement_centre?: ProcurementCentre
  procurements?: Procurement[]
}

export interface Procurement {
  id: string
  booking_id: string
  receipt_no: string
  actual_weight_quintals: number
  grade: string
  rate_per_quintal: number
  total_amount: number
  payment_status: 'PENDING' | 'INITIATED' | 'COMPLETED'
  payment_reference: string | null
  payment_date: string | null
  notes: string | null
  created_at?: string
}

export interface NotificationLog {
  id: string
  farmer_id: string
  booking_id: string | null
  channel: 'SMS' | 'IN_APP' | 'VOICE'
  message: string
  status: 'DELIVERED' | 'SENT'
  created_at: string
}
