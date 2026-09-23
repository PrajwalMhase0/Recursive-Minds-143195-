'use server'

import { createClient } from '@/lib/supabase/server'
import { Booking, BookingStatus, Farmer, ProcurementCentre, NotificationLog, Procurement } from '@/types/database'
import { revalidatePath } from 'next/cache'
import * as sqlite from '@/lib/sqliteService'

export async function getFarmerProfile(farmerId: string = 'farmer_ramesh'): Promise<Farmer | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('id', farmerId)
      .single()

    if (!error && data) {
      return data
    }
  } catch (err) {
    console.warn('Supabase getFarmerProfile unavailable, falling back to SQLite:', err)
  }
  return sqlite.sqliteGetFarmerProfile(farmerId)
}

export async function getCentres(): Promise<ProcurementCentre[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('procurement_centres')
      .select('*')
      .order('name')

    if (!error && data && data.length > 0) {
      return data
    }
  } catch (err) {
    console.warn('Supabase getCentres unavailable, falling back to SQLite:', err)
  }
  return sqlite.sqliteGetCentres()
}

export async function getFarmerBookings(farmerIdOrName: string = 'farmer_ramesh'): Promise<Booking[]> {
  try {
    const supabase = await createClient()

    let targetId = farmerIdOrName

    // If a name was passed (doesn't start with 'farmer_')
    if (farmerIdOrName && !farmerIdOrName.startsWith('farmer_')) {
      const { data: fByName } = await supabase
        .from('farmers')
        .select('id')
        .ilike('name', farmerIdOrName.trim())
        .limit(1)
      if (fByName && fByName.length > 0) {
        targetId = fByName[0].id
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        farmer:farmers(*),
        procurement_centre:procurement_centres(*),
        procurements(*)
      `)
      .eq('farmer_id', targetId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      return data
    }
  } catch (err) {
    console.warn('Supabase getFarmerBookings unavailable, falling back to SQLite:', err)
  }
  return sqlite.sqliteGetFarmerBookings(farmerIdOrName)
}

export async function getOrCreateFarmer(name: string, phone: string = '', address: string = ''): Promise<Farmer> {
  try {
    const supabase = await createClient()
    const cleanPhone = phone ? phone.replace(/\D/g, '') : ''
    const digits10 = cleanPhone.slice(-10) || '9823145892'
    const formattedPhone = cleanPhone && cleanPhone.length >= 10 
      ? `+91 ${digits10.slice(0, 5)} ${digits10.slice(5)}` 
      : '+91 98231 45892'
    const targetName = name?.trim() || 'Farmer'

    let village = 'Shirur'
    let district = 'Pune Dist.'
    if (address && address.trim()) {
      const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
      if (parts.length >= 2) {
        village = parts[0]
        district = parts.slice(1).join(', ')
      } else if (parts.length === 1) {
        village = parts[0]
      }
    }

    // 1. Match by farmer NAME
    const { data: byName } = await supabase
      .from('farmers')
      .select('*')
      .ilike('name', targetName)
      .order('created_at', { ascending: false })
      .limit(1)

    if (byName && byName.length > 0) {
      const existing = byName[0]
      const updates: Partial<Farmer> = {}
      if (cleanPhone && cleanPhone.length >= 10 && cleanPhone !== '9823145892' && existing.phone !== formattedPhone) {
        updates.phone = formattedPhone
        existing.phone = formattedPhone
      }
      if (address && address.trim()) {
        updates.village = village
        updates.district = district
        existing.village = village
        existing.district = district
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('farmers').update(updates).eq('id', existing.id)
      }
      // Also sync to SQLite
      try { sqlite.sqliteGetOrCreateFarmer(existing.name, existing.phone, `${existing.village}, ${existing.district}`) } catch {}
      return existing
    }

    // 2. Secondary identification by phone
    if (cleanPhone.length >= 10 && digits10 !== '9823145892') {
      const { data: byPhone } = await supabase
        .from('farmers')
        .select('*')
        .ilike('phone', `%${digits10}%`)
        .limit(1)

      if (byPhone && byPhone.length > 0) {
        const existing = byPhone[0]
        const updates: Partial<Farmer> = {}
        if (targetName && targetName !== 'Farmer' && existing.name !== targetName) {
          updates.name = targetName
          existing.name = targetName
        }
        if (address && address.trim()) {
          updates.village = village
          updates.district = district
          existing.village = village
          existing.district = district
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from('farmers').update(updates).eq('id', existing.id)
        }
        try { sqlite.sqliteGetOrCreateFarmer(existing.name, existing.phone, `${existing.village}, ${existing.district}`) } catch {}
        return existing
      }
    }

    // 3. Create new dedicated farmer account
    const nameSlug = targetName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    const baseId = `farmer_${nameSlug || digits10}`

    const { data: idTaken } = await supabase
      .from('farmers')
      .select('id')
      .eq('id', baseId)
      .maybeSingle()

    const finalId = idTaken ? `${baseId}_${Math.floor(100 + Math.random() * 900)}` : baseId
    const uniqueCode = `KS-MH-${Math.floor(1000 + Math.random() * 9000)}`

    const newFarmer: Partial<Farmer> = {
      id: finalId,
      farmer_id_code: uniqueCode,
      name: targetName,
      phone: formattedPhone,
      village: village,
      district: district,
      state: 'Maharashtra',
      registered_crops: ['Soybean', 'Cotton', 'Onion', 'Wheat'],
      preferred_centre_id: 'centre_nashik_main',
      verified: true,
      aadhaar_last4: digits10.slice(-4),
    }

    const { data: created, error } = await supabase
      .from('farmers')
      .insert([newFarmer])
      .select()
      .single()

    if (!error && created) {
      try { sqlite.sqliteGetOrCreateFarmer(created.name, created.phone, `${created.village}, ${created.district}`) } catch {}
      return created
    }
  } catch (err) {
    console.warn('Supabase getOrCreateFarmer unavailable, falling back to SQLite:', err)
  }

  return sqlite.sqliteGetOrCreateFarmer(name, phone, address)
}

export async function getCentreQueue(centreId: string = 'all'): Promise<Booking[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('bookings')
      .select(`
        *,
        farmer:farmers(*),
        procurement_centre:procurement_centres(*),
        procurements(*)
      `)
      .in('status', ['BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'AT_COUNTER', 'GRADED', 'PROCURED', 'PAYMENT_INITIATED'])

    if (centreId && centreId !== 'all') {
      query = query.eq('centre_id', centreId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (!error && data) {
      return data
    }
  } catch (err) {
    console.warn('Supabase getCentreQueue unavailable, falling back to SQLite:', err)
  }
  return sqlite.sqliteGetCentreQueue(centreId)
}

export async function getNotifications(farmerId: string = 'farmer_ramesh'): Promise<NotificationLog[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notifications_log')
      .select('*')
      .or(`farmer_id.eq.${farmerId},farmer_id.eq.all`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      return data
    }
  } catch (err) {
    console.warn('Supabase getNotifications unavailable, falling back to SQLite:', err)
  }
  return sqlite.sqliteGetNotifications(farmerId)
}

export async function broadcastEmptySlotNotification({
  centreName,
  slotDate,
  slotTime,
  availableSpots = 5,
}: {
  centreName: string
  slotDate: string
  slotTime: string
  availableSpots?: number
}): Promise<{
  success: boolean
  message: string
  notifiedCount?: number
  alreadyBroadcast?: boolean
}> {
  let supabaseResult: { success: boolean; message: string; notifiedCount?: number; alreadyBroadcast?: boolean } | null = null
  try {
    const supabase = await createClient()

    let formattedDate = slotDate
    try {
      formattedDate = new Date(slotDate + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
      })
    } catch {}

    const msgText = `KrishiSetu Alert: Slot ${slotTime} is EMPTY (${availableSpots}/5 spots open) at ${centreName} on ${formattedDate}! Available for immediate booking without queue wait.`

    const { data: allFarmers } = await supabase.from('farmers').select('id')
    const farmerIds = allFarmers && allFarmers.length > 0 
      ? allFarmers.map((f: { id: string }) => f.id)
      : ['farmer_ramesh']

    const { data: recentBroadcasts } = await supabase
      .from('notifications_log')
      .select('id')
      .or(`message.ilike.%EMPTY%${formattedDate}%,message.ilike.%EMPTY%${slotDate}%`)
      .limit(1)

    if (recentBroadcasts && recentBroadcasts.length > 0) {
      return { success: true, alreadyBroadcast: true, message: `Alert for ${formattedDate} has already been broadcast. Only one alert per day is permitted.` }
    }

    const farmerPayloads = farmerIds.map((fId: string) => ({
      farmer_id: fId,
      booking_id: null,
      channel: 'SMS' as const,
      message: msgText,
      status: 'DELIVERED' as const,
    }))

    await supabase.from('notifications_log').insert(farmerPayloads)
    supabaseResult = { success: true, message: msgText, notifiedCount: farmerIds.length, alreadyBroadcast: false }
  } catch (err) {
    console.warn('Supabase broadcastEmptySlotNotification unavailable, falling back to SQLite:', err)
  }

  // Always mirror in SQLite
  try {
    sqlite.sqliteBroadcastEmptySlotNotification({ centreName, slotDate, slotTime, availableSpots })
  } catch {}

  revalidatePath('/')
  return supabaseResult || sqlite.sqliteBroadcastEmptySlotNotification({ centreName, slotDate, slotTime, availableSpots })
}

export async function bookSlot(formData: {
  farmerId: string
  farmerName?: string
  farmerPhone?: string
  centreId: string
  crop: string
  quantity: number
  slotDate: string
  slotTime: string
}): Promise<{
  success: boolean
  booking?: Booking | null
  error?: string
}> {
  try {
    const supabase = await createClient()

    let finalFarmerId = formData.farmerId || 'farmer_ramesh'
    try {
      const farmer = await getOrCreateFarmer(
        formData.farmerName || 'Farmer',
        formData.farmerPhone || '9823145892'
      )
      if (farmer?.id) {
        finalFarmerId = farmer.id
      }
    } catch {}

    const { data: farmerExists } = await supabase
      .from('farmers')
      .select('id')
      .eq('id', finalFarmerId)
      .maybeSingle()

    if (!farmerExists) {
      const created = await getOrCreateFarmer(formData.farmerName || 'Farmer', formData.farmerPhone || '')
      finalFarmerId = created.id
    }

    let finalCentreId = formData.centreId
    const { data: centreExists } = await supabase
      .from('procurement_centres')
      .select('id')
      .eq('id', finalCentreId)
      .maybeSingle()

    if (!centreExists) {
      finalCentreId = 'centre_nashik_main'
    }

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('centre_id', finalCentreId)
      .eq('slot_date', formData.slotDate)
      .eq('slot_time', formData.slotTime)
      .neq('status', 'CANCELLED')

    const currentCount = existingBookings?.length || 0
    if (currentCount >= 5) {
      return { success: false, error: 'Selected slot is full! Please choose another slot.' }
    }

    const bookingCode = `BK-${Math.floor(10000 + Math.random() * 90000)}`
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          booking_code: bookingCode,
          farmer_id: finalFarmerId,
          centre_id: finalCentreId,
          slot_date: formData.slotDate,
          slot_time: formData.slotTime,
          crop: formData.crop,
          approx_quantity_quintals: formData.quantity,
          status: 'BOOKED',
          queue_number: null,
        }
      ])
      .select(`
        *,
        farmer:farmers(*),
        procurement_centre:procurement_centres(*)
      `)
      .single()

    if (!error && data) {
      try {
        await supabase.from('notifications_log').insert([
          {
            farmer_id: finalFarmerId,
            booking_id: data.id,
            channel: 'SMS',
            message: `KrishiSetu: Slot confirmed for ${formData.crop} (${formData.quantity} Qtl) on ${formData.slotDate} at ${formData.slotTime}. Booking ID: ${bookingCode}.`,
            status: 'DELIVERED',
          }
        ])
      } catch {}

      // Mirror to SQLite
      try { sqlite.sqliteBookSlot(formData) } catch {}

      revalidatePath('/')
      return { success: true, booking: data }
    }
  } catch (err) {
    console.warn('Supabase bookSlot unavailable, falling back to SQLite:', err)
  }

  // Fallback to SQLite
  const res = sqlite.sqliteBookSlot(formData)
  revalidatePath('/')
  return res
}

export async function checkInFarmer(bookingId: string) {
  try {
    const supabase = await createClient()

    const { data: currentQueue } = await supabase
      .from('bookings')
      .select('queue_number')
      .not('queue_number', 'is', null)
      .order('queue_number', { ascending: false })
      .limit(1)

    const nextQueueNum = (currentQueue?.[0]?.queue_number || 17) + 1

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        status: 'IN_QUEUE',
        queue_number: nextQueueNum,
        check_in_time: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select('*, farmer:farmers(*), procurement_centre:procurement_centres(*)')
      .single()

    if (!error && booking) {
      try {
        await supabase.from('notifications_log').insert([
          {
            farmer_id: booking.farmer_id,
            booking_id: booking.id,
            channel: 'SMS',
            message: `KrishiSetu: Check-in complete! Token #${nextQueueNum}. Please wait in Shed A. You will receive an SMS alert when 3 farmers are ahead.`,
            status: 'DELIVERED',
          }
        ])
      } catch {}

      // Mirror to SQLite
      try { sqlite.sqliteCheckInFarmer(bookingId) } catch {}

      revalidatePath('/')
      return { success: true, booking }
    }
  } catch (err) {
    console.warn('Supabase checkInFarmer unavailable, falling back to SQLite:', err)
  }

  const res = sqlite.sqliteCheckInFarmer(bookingId)
  revalidatePath('/')
  return res
}

export async function updateBookingStatusByOperator(
  bookingId: string, 
  newStatus: BookingStatus,
  procurementData?: {
    actualWeight: number
    grade: string
    ratePerQuintal: number
  },
  paymentDetails?: {
    paymentMode?: 'ONLINE' | 'OFFLINE'
    referenceNo?: string
    notes?: string
  }
) {
  let supabaseSuccess = false
  try {
    const supabase = await createClient()

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)
      .select('*, farmer:farmers(*)')
      .single()

    if (!error && booking) {
      supabaseSuccess = true

      if (newStatus === 'PROCURED' && procurementData) {
        const total = procurementData.actualWeight * procurementData.ratePerQuintal
        const receiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`
        
        await supabase.from('procurements').insert([
          {
            booking_id: bookingId,
            receipt_no: receiptNo,
            actual_weight_quintals: procurementData.actualWeight,
            grade: procurementData.grade,
            rate_per_quintal: procurementData.ratePerQuintal,
            total_amount: total,
            payment_status: 'INITIATED',
            payment_reference: `DBT-PFMS-${Math.floor(10000000 + Math.random() * 90000000)}`,
            notes: 'Procured via KrishiSetu Mandi Counter 1'
          }
        ])

        await supabase.from('notifications_log').insert([
          {
            farmer_id: booking.farmer_id,
            booking_id: booking.id,
            channel: 'SMS',
            message: `KrishiSetu: Weighing complete (${procurementData.actualWeight} Qtl, ${procurementData.grade}). Receipt: ${receiptNo}. Payment of Rs. ${total.toLocaleString('en-IN')} initiated to your bank account!`,
            status: 'DELIVERED',
          }
        ])
      }

      if (newStatus === 'COMPLETED') {
        const mode = paymentDetails?.paymentMode || 'ONLINE'
        const ref = paymentDetails?.referenceNo || (mode === 'OFFLINE'
          ? `CASH-APMC-${Math.floor(100000 + Math.random() * 900000)}`
          : `DBT-PFMS-${Math.floor(10000000 + Math.random() * 90000000)}`)

        await supabase
          .from('procurements')
          .update({
            payment_status: 'COMPLETED',
            payment_reference: ref,
            payment_date: new Date().toISOString(),
            notes: paymentDetails?.notes || (mode === 'OFFLINE'
              ? `Offline payment settled at APMC Cash Counter (Ref: ${ref})`
              : `Online payment settled via Direct Benefit Transfer (Ref: ${ref})`)
          })
          .eq('booking_id', bookingId)

        const smsMsg = mode === 'OFFLINE'
          ? `KrishiSetu: Payment settled! Offline cash/cheque voucher (${ref}) has been disbursed at Mandi Cash Counter. Thank you!`
          : `KrishiSetu: Payment settled! Online Direct Benefit Transfer (DBT) has been credited to your Aadhaar-linked bank account (Ref: ${ref}). Thank you!`

        await supabase.from('notifications_log').insert([
          {
            farmer_id: booking.farmer_id,
            booking_id: booking.id,
            channel: 'SMS',
            message: smsMsg,
            status: 'DELIVERED',
          }
        ])
      }

      if (newStatus === 'AT_COUNTER') {
        await supabase.from('notifications_log').insert([
          {
            farmer_id: booking.farmer_id,
            booking_id: booking.id,
            channel: 'SMS',
            message: `KrishiSetu ALERT: It's your turn! Please move your vehicle to Counter #1 for weighbridge inspection.`,
            status: 'DELIVERED',
          }
        ])
      }
    }
  } catch (err) {
    console.warn('Supabase updateBookingStatusByOperator unavailable, falling back to SQLite:', err)
  }

  // Also apply to SQLite
  try {
    sqlite.sqliteUpdateBookingStatusByOperator(bookingId, newStatus, procurementData, paymentDetails)
  } catch {}

  revalidatePath('/')
  return { success: true }
}

export async function rescheduleMissedSlot({
  bookingId,
  newDate,
  newSlotTime,
  newCentreId,
  reason = 'Unable to make it to the procurement centre on time',
}: {
  bookingId: string
  newDate: string
  newSlotTime: string
  newCentreId?: string
  reason?: string
}) {
  try {
    const supabase = await createClient()

    const { data: currentBooking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*, farmer:farmers(*), procurement_centre:procurement_centres(*)')
      .eq('id', bookingId)
      .single()

    if (!fetchErr && currentBooking) {
      const updatePayload: {
        slot_date: string
        slot_time: string
        status: BookingStatus
        queue_number: number | null
        check_in_time: null
        centre_id?: string
      } = {
        slot_date: newDate,
        slot_time: newSlotTime,
        status: 'BOOKED',
        queue_number: null,
        check_in_time: null,
      }

      if (newCentreId) {
        updatePayload.centre_id = newCentreId
      }

      const { data: updatedBooking, error: updateErr } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId)
        .select('*, farmer:farmers(*), procurement_centre:procurement_centres(*)')
        .single()

      if (!updateErr && updatedBooking) {
        const formattedDate = new Date(newDate + 'T00:00:00').toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })

        try {
          await supabase.from('notifications_log').insert([
            {
              farmer_id: currentBooking.farmer_id,
              booking_id: bookingId,
              channel: 'SMS',
              message: `KrishiSetu Alert: Your missed slot ${currentBooking.booking_code} has been successfully recovered & rescheduled to ${formattedDate} (${newSlotTime}). Reason: ${reason}. No penalty applied.`,
              status: 'DELIVERED',
            }
          ])
        } catch {}

        try {
          sqlite.sqliteRescheduleMissedSlot({ bookingId, newDate, newSlotTime, newCentreId, reason })
        } catch {}

        revalidatePath('/')
        return { success: true, booking: updatedBooking }
      }
    }
  } catch (err) {
    console.warn('Supabase rescheduleMissedSlot unavailable, falling back to SQLite:', err)
  }

  const res = sqlite.sqliteRescheduleMissedSlot({ bookingId, newDate, newSlotTime, newCentreId, reason })
  revalidatePath('/')
  return res
}
