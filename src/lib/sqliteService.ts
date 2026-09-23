import { db } from '@/lib/db'
import {
  Booking,
  BookingStatus,
  Farmer,
  ProcurementCentre,
  NotificationLog,
  Procurement,
} from '@/types/database'

function formatFarmer(row: any): Farmer {
  let crops: string[] = []
  try {
    crops = typeof row.registered_crops === 'string' ? JSON.parse(row.registered_crops) : (row.registered_crops || [])
  } catch {
    crops = ['Soybean', 'Wheat']
  }
  return {
    id: row.id,
    farmer_id_code: row.farmer_id_code || `KS-${row.id}`,
    name: row.name,
    phone: row.phone,
    village: row.village || '',
    district: row.district || '',
    state: row.state || 'Maharashtra',
    registered_crops: crops,
    preferred_centre_id: row.preferred_centre_id || '',
    verified: Boolean(row.verified),
    aadhaar_last4: row.aadhaar_last4 || '1234',
    created_at: row.created_at,
  }
}

function formatCentre(row: any): ProcurementCentre {
  return {
    id: row.id,
    name: row.name,
    location: row.location || '',
    district: row.district || '',
    state: row.state || 'Maharashtra',
    latitude: Number(row.latitude) || 0,
    longitude: Number(row.longitude) || 0,
    max_capacity_per_slot: Number(row.max_capacity_per_slot) || 20,
    contact_phone: row.contact_phone || '',
    created_at: row.created_at,
  }
}

export function sqliteGetFarmerProfile(farmerId: string = 'farmer_ramesh'): Farmer | null {
  try {
    const row = db.prepare('SELECT * FROM farmers WHERE id = ?').get(farmerId) as any
    return row ? formatFarmer(row) : null
  } catch (err) {
    console.error('sqliteGetFarmerProfile error:', err)
    return null
  }
}

export function sqliteGetCentres(): ProcurementCentre[] {
  try {
    const rows = db.prepare('SELECT * FROM procurement_centres ORDER BY name ASC').all() as any[]
    return rows.map(formatCentre)
  } catch (err) {
    console.error('sqliteGetCentres error:', err)
    return []
  }
}

export function sqliteGetFarmerBookings(farmerIdOrName: string = 'farmer_ramesh'): Booking[] {
  try {
    let targetId = farmerIdOrName
    if (farmerIdOrName && !farmerIdOrName.startsWith('farmer_')) {
      const fByName = db
        .prepare('SELECT id FROM farmers WHERE LOWER(name) = LOWER(?) LIMIT 1')
        .get(farmerIdOrName.trim()) as any
      if (fByName?.id) {
        targetId = fByName.id
      }
    }

    const rows = db
      .prepare(`
        SELECT 
          b.*,
          f.id as f_id, f.farmer_id_code as f_code, f.name as f_name, f.phone as f_phone,
          f.village as f_village, f.district as f_district, f.state as f_state,
          f.registered_crops as f_crops, f.preferred_centre_id as f_pref_centre,
          f.verified as f_verified, f.aadhaar_last4 as f_aadhaar, f.created_at as f_created,
          c.id as c_id, c.name as c_name, c.location as c_location, c.district as c_district,
          c.state as c_state, c.latitude as c_lat, c.longitude as c_lng,
          c.max_capacity_per_slot as c_capacity, c.contact_phone as c_phone, c.created_at as c_created
        FROM bookings b
        LEFT JOIN farmers f ON b.farmer_id = f.id
        LEFT JOIN procurement_centres c ON b.centre_id = c.id
        WHERE b.farmer_id = ?
        ORDER BY b.created_at DESC
      `)
      .all(targetId) as any[]

    return rows.map((r) => {
      const procurements = (db
        .prepare('SELECT * FROM procurements WHERE booking_id = ? ORDER BY created_at ASC')
        .all(r.id) as any[]) as Procurement[]

      return {
        id: r.id,
        booking_code: r.booking_code,
        farmer_id: r.farmer_id,
        centre_id: r.centre_id,
        slot_date: r.slot_date,
        slot_time: r.slot_time,
        crop: r.crop,
        approx_quantity_quintals: Number(r.approx_quantity_quintals),
        status: r.status as BookingStatus,
        queue_number: r.queue_number ? Number(r.queue_number) : null,
        check_in_time: r.check_in_time || null,
        created_at: r.created_at,
        farmer: r.f_id
          ? formatFarmer({
              id: r.f_id,
              farmer_id_code: r.f_code,
              name: r.f_name,
              phone: r.f_phone,
              village: r.f_village,
              district: r.f_district,
              state: r.f_state,
              registered_crops: r.f_crops,
              preferred_centre_id: r.f_pref_centre,
              verified: r.f_verified,
              aadhaar_last4: r.f_aadhaar,
              created_at: r.f_created,
            })
          : undefined,
        procurement_centre: r.c_id
          ? formatCentre({
              id: r.c_id,
              name: r.c_name,
              location: r.c_location,
              district: r.c_district,
              state: r.c_state,
              latitude: r.c_lat,
              longitude: r.c_lng,
              max_capacity_per_slot: r.c_capacity,
              contact_phone: r.c_phone,
              created_at: r.c_created,
            })
          : undefined,
        procurements,
      }
    })
  } catch (err) {
    console.error('sqliteGetFarmerBookings error:', err)
    return []
  }
}

export function sqliteGetOrCreateFarmer(
  name: string,
  phone: string = '',
  address: string = ''
): Farmer {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : ''
  const digits10 = cleanPhone.slice(-10) || '9823145892'
  const formattedPhone =
    cleanPhone && cleanPhone.length >= 10
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

  // 1. Check existing by name
  const existingByName = db
    .prepare('SELECT * FROM farmers WHERE LOWER(name) = LOWER(?) ORDER BY created_at DESC LIMIT 1')
    .get(targetName) as any

  if (existingByName) {
    if (cleanPhone.length >= 10 && cleanPhone !== '9823145892') {
      db.prepare('UPDATE farmers SET phone = ? WHERE id = ?').run(formattedPhone, existingByName.id)
      existingByName.phone = formattedPhone
    }
    return formatFarmer(existingByName)
  }

  // 2. Check existing by phone
  if (cleanPhone.length >= 10 && digits10 !== '9823145892') {
    const existingByPhone = db
      .prepare('SELECT * FROM farmers WHERE phone LIKE ? LIMIT 1')
      .get(`%${digits10}%`) as any
    if (existingByPhone) {
      if (targetName !== 'Farmer') {
        db.prepare('UPDATE farmers SET name = ? WHERE id = ?').run(targetName, existingByPhone.id)
        existingByPhone.name = targetName
      }
      return formatFarmer(existingByPhone)
    }
  }

  // 3. Insert new farmer
  const nameSlug = targetName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  const baseId = `farmer_${nameSlug || digits10}`
  const existingId = db.prepare('SELECT id FROM farmers WHERE id = ?').get(baseId)
  const finalId = existingId ? `${baseId}_${Math.floor(100 + Math.random() * 900)}` : baseId
  const uniqueCode = `KS-MH-${Math.floor(1000 + Math.random() * 9000)}`

  db.prepare(`
    INSERT INTO farmers (
      id, farmer_id_code, name, phone, village, district, state, registered_crops, preferred_centre_id, verified, aadhaar_last4
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    finalId,
    uniqueCode,
    targetName,
    formattedPhone,
    village,
    district,
    'Maharashtra',
    JSON.stringify(['Soybean', 'Cotton', 'Onion', 'Wheat']),
    'centre_nashik_main',
    1,
    digits10.slice(-4)
  )

  const created = db.prepare('SELECT * FROM farmers WHERE id = ?').get(finalId)
  return formatFarmer(created)
}

export function sqliteGetCentreQueue(centreId: string = 'all'): Booking[] {
  try {
    let query = `
      SELECT 
        b.*,
        f.id as f_id, f.farmer_id_code as f_code, f.name as f_name, f.phone as f_phone,
        f.village as f_village, f.district as f_district, f.state as f_state,
        f.registered_crops as f_crops, f.preferred_centre_id as f_pref_centre,
        f.verified as f_verified, f.aadhaar_last4 as f_aadhaar, f.created_at as f_created,
        c.id as c_id, c.name as c_name, c.location as c_location, c.district as c_district,
        c.state as c_state, c.latitude as c_lat, c.longitude as c_lng,
        c.max_capacity_per_slot as c_capacity, c.contact_phone as c_phone, c.created_at as c_created
      FROM bookings b
      LEFT JOIN farmers f ON b.farmer_id = f.id
      LEFT JOIN procurement_centres c ON b.centre_id = c.id
      WHERE b.status IN ('BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'AT_COUNTER', 'GRADED', 'PROCURED', 'PAYMENT_INITIATED')
    `
    const params: any[] = []
    if (centreId && centreId !== 'all') {
      query += ' AND b.centre_id = ?'
      params.push(centreId)
    }
    query += ' ORDER BY b.created_at DESC'

    const rows = db.prepare(query).all(...params) as any[]
    return rows.map((r) => {
      const procurements = (db
        .prepare('SELECT * FROM procurements WHERE booking_id = ? ORDER BY created_at ASC')
        .all(r.id) as any[]) as Procurement[]

      return {
        id: r.id,
        booking_code: r.booking_code,
        farmer_id: r.farmer_id,
        centre_id: r.centre_id,
        slot_date: r.slot_date,
        slot_time: r.slot_time,
        crop: r.crop,
        approx_quantity_quintals: Number(r.approx_quantity_quintals),
        status: r.status as BookingStatus,
        queue_number: r.queue_number ? Number(r.queue_number) : null,
        check_in_time: r.check_in_time || null,
        created_at: r.created_at,
        farmer: r.f_id
          ? formatFarmer({
              id: r.f_id,
              farmer_id_code: r.f_code,
              name: r.f_name,
              phone: r.f_phone,
              village: r.f_village,
              district: r.f_district,
              state: r.f_state,
              registered_crops: r.f_crops,
              preferred_centre_id: r.f_pref_centre,
              verified: r.f_verified,
              aadhaar_last4: r.f_aadhaar,
              created_at: r.f_created,
            })
          : undefined,
        procurement_centre: r.c_id
          ? formatCentre({
              id: r.c_id,
              name: r.c_name,
              location: r.c_location,
              district: r.c_district,
              state: r.c_state,
              latitude: r.c_lat,
              longitude: r.c_lng,
              max_capacity_per_slot: r.c_capacity,
              contact_phone: r.c_phone,
              created_at: r.c_created,
            })
          : undefined,
        procurements,
      }
    })
  } catch (err) {
    console.error('sqliteGetCentreQueue error:', err)
    return []
  }
}

export function sqliteGetNotifications(farmerId: string = 'farmer_ramesh'): NotificationLog[] {
  try {
    const rows = db
      .prepare(`
        SELECT * FROM notification_logs
        WHERE farmer_id = ? OR farmer_id = 'all'
        ORDER BY created_at DESC
        LIMIT 20
      `)
      .all(farmerId) as any[]
    return rows.map((r) => ({
      id: r.id,
      farmer_id: r.farmer_id,
      booking_id: r.booking_id || null,
      channel: r.channel || 'SMS',
      message: r.message,
      status: r.status || 'DELIVERED',
      created_at: r.created_at,
    }))
  } catch (err) {
    console.error('sqliteGetNotifications error:', err)
    return []
  }
}

export function sqliteBookSlot(formData: {
  farmerId: string
  farmerName?: string
  farmerPhone?: string
  centreId: string
  crop: string
  quantity: number
  slotDate: string
  slotTime: string
}): { success: boolean; booking?: Booking | null; error?: string } {
  const farmer = sqliteGetOrCreateFarmer(
    formData.farmerName || 'Farmer',
    formData.farmerPhone || '9823145892'
  )

  let finalCentreId = formData.centreId
  const centreExists = db.prepare('SELECT id FROM procurement_centres WHERE id = ?').get(finalCentreId)
  if (!centreExists) {
    finalCentreId = 'centre_nashik_main'
  }

  // Capacity check
  const activeCount = db
    .prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE centre_id = ? AND slot_date = ? AND slot_time = ? AND status != 'CANCELLED'
    `)
    .get(finalCentreId, formData.slotDate, formData.slotTime) as any

  if ((activeCount?.count || 0) >= 5) {
    return { success: false, error: 'Selected slot is full! Please choose another slot.' }
  }

  const bookingId = 'book_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
  const bookingCode = `BK-${Math.floor(10000 + Math.random() * 90000)}`

  db.prepare(`
    INSERT INTO bookings (
      id, booking_code, farmer_id, centre_id, slot_date, slot_time, crop, approx_quantity_quintals, status, queue_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'BOOKED', NULL)
  `).run(
    bookingId,
    bookingCode,
    farmer.id,
    finalCentreId,
    formData.slotDate,
    formData.slotTime,
    formData.crop,
    formData.quantity
  )

  // Insert SMS log
  const notifId = 'notif_' + Date.now()
  db.prepare(`
    INSERT INTO notification_logs (id, farmer_id, booking_id, channel, message, status)
    VALUES (?, ?, ?, 'SMS', ?, 'DELIVERED')
  `).run(
    notifId,
    farmer.id,
    bookingId,
    `KrishiSetu: Slot confirmed for ${formData.crop} (${formData.quantity} Qtl) on ${formData.slotDate} at ${formData.slotTime}. Booking ID: ${bookingCode}.`
  )

  const createdBookings = sqliteGetFarmerBookings(farmer.id)
  const booking = createdBookings.find((b) => b.id === bookingId) || null

  return { success: true, booking }
}

export function sqliteCheckInFarmer(bookingId: string) {
  const currentMax = db
    .prepare('SELECT MAX(queue_number) as max_q FROM bookings WHERE queue_number IS NOT NULL')
    .get() as any

  const nextQueueNum = (currentMax?.max_q || 17) + 1
  const checkInTime = new Date().toISOString()

  db.prepare(`
    UPDATE bookings
    SET status = 'IN_QUEUE', queue_number = ?, check_in_time = ?
    WHERE id = ?
  `).run(nextQueueNum, checkInTime, bookingId)

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any
  if (booking) {
    db.prepare(`
      INSERT INTO notification_logs (id, farmer_id, booking_id, channel, message, status)
      VALUES (?, ?, ?, 'SMS', ?, 'DELIVERED')
    `).run(
      'notif_' + Date.now(),
      booking.farmer_id,
      booking.id,
      `KrishiSetu: Check-in complete! Token #${nextQueueNum}. Please wait in Shed A. You will receive an SMS alert when 3 farmers are ahead.`
    )
  }

  const allBookings = sqliteGetCentreQueue('all')
  const updatedBooking = allBookings.find((b) => b.id === bookingId) || booking

  return { success: true, booking: updatedBooking }
}

export function sqliteUpdateBookingStatusByOperator(
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
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(newStatus, bookingId)
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any

  if (newStatus === 'PROCURED' && procurementData && booking) {
    const total = procurementData.actualWeight * procurementData.ratePerQuintal
    const receiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`
    const procId = 'proc_' + Date.now()

    db.prepare(`
      INSERT INTO procurements (
        id, booking_id, receipt_no, actual_weight_quintals, grade, rate_per_quintal, total_amount, payment_status, payment_reference, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'INITIATED', ?, 'Procured via KrishiSetu Mandi Counter 1')
    `).run(
      procId,
      bookingId,
      receiptNo,
      procurementData.actualWeight,
      procurementData.grade,
      procurementData.ratePerQuintal,
      total,
      `DBT-PFMS-${Math.floor(10000000 + Math.random() * 90000000)}`
    )

    db.prepare(`
      INSERT INTO notification_logs (id, farmer_id, booking_id, channel, message, status)
      VALUES (?, ?, ?, 'SMS', ?, 'DELIVERED')
    `).run(
      'notif_' + Date.now(),
      booking.farmer_id,
      booking.id,
      `KrishiSetu: Weighing complete (${procurementData.actualWeight} Qtl, ${procurementData.grade}). Receipt: ${receiptNo}. Payment of Rs. ${total.toLocaleString('en-IN')} initiated to your bank account!`
    )
  }

  if (newStatus === 'COMPLETED' && booking) {
    const mode = paymentDetails?.paymentMode || 'ONLINE'
    const ref =
      paymentDetails?.referenceNo ||
      (mode === 'OFFLINE'
        ? `CASH-APMC-${Math.floor(100000 + Math.random() * 900000)}`
        : `DBT-PFMS-${Math.floor(10000000 + Math.random() * 90000000)}`)

    db.prepare(`
      UPDATE procurements
      SET payment_status = 'COMPLETED', payment_reference = ?, payment_date = ?, notes = ?
      WHERE booking_id = ?
    `).run(
      ref,
      new Date().toISOString(),
      paymentDetails?.notes || (mode === 'OFFLINE' ? `Offline payment settled at APMC Cash Counter (Ref: ${ref})` : `Online payment settled via Direct Benefit Transfer (Ref: ${ref})`),
      bookingId
    )

    const smsMsg =
      mode === 'OFFLINE'
        ? `KrishiSetu: Payment settled! Offline cash/cheque voucher (${ref}) has been disbursed at Mandi Cash Counter. Thank you!`
        : `KrishiSetu: Payment settled! Online Direct Benefit Transfer (DBT) has been credited to your Aadhaar-linked bank account (Ref: ${ref}). Thank you!`

    db.prepare(`
      INSERT INTO notification_logs (id, farmer_id, booking_id, channel, message, status)
      VALUES (?, ?, ?, 'SMS', ?, 'DELIVERED')
    `).run('notif_' + Date.now(), booking.farmer_id, booking.id, smsMsg)
  }

  if (newStatus === 'AT_COUNTER' && booking) {
    db.prepare(`
      INSERT INTO notification_logs (id, farmer_id, booking_id, channel, message, status)
      VALUES (?, ?, ?, 'SMS', ?, 'DELIVERED')
    `).run(
      'notif_' + Date.now(),
      booking.farmer_id,
      booking.id,
      `KrishiSetu ALERT: It's your turn! Please move your vehicle to Counter #1 for weighbridge inspection.`
    )
  }

  return { success: true }
}

export function sqliteRescheduleMissedSlot({
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
  const currentBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any
  if (!currentBooking) {
    return { success: false, error: 'Booking record not found' }
  }

  let updateQuery = `
    UPDATE bookings
    SET slot_date = ?, slot_time = ?, status = 'BOOKED', queue_number = NULL, check_in_time = NULL
  `
  const params: any[] = [newDate, newSlotTime]
  if (newCentreId) {
    updateQuery += ', centre_id = ?'
    params.push(newCentreId)
  }
  updateQuery += ' WHERE id = ?'
  params.push(bookingId)

  db.prepare(updateQuery).run(...params)

  const formattedDate = new Date(newDate + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  db.prepare(`
    INSERT INTO notification_logs (id, farmer_id, booking_id, channel, message, status)
    VALUES (?, ?, ?, 'SMS', ?, 'DELIVERED')
  `).run(
    'notif_' + Date.now(),
    currentBooking.farmer_id,
    bookingId,
    `KrishiSetu Alert: Your missed slot ${currentBooking.booking_code} has been successfully recovered & rescheduled to ${formattedDate} (${newSlotTime}). Reason: ${reason}. No penalty applied.`
  )

  const allBookings = sqliteGetCentreQueue('all')
  const updatedBooking = allBookings.find((b) => b.id === bookingId) || null

  return { success: true, booking: updatedBooking }
}

export function sqliteBroadcastEmptySlotNotification({
  centreName,
  slotDate,
  slotTime,
  availableSpots = 5,
}: {
  centreName: string
  slotDate: string
  slotTime: string
  availableSpots?: number
}): { success: boolean; message: string; notifiedCount?: number; alreadyBroadcast?: boolean } {
  let formattedDate = slotDate
  try {
    formattedDate = new Date(slotDate + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      weekday: 'short',
    })
  } catch {}

  const msgText = `KrishiSetu Alert: Slot ${slotTime} is EMPTY (${availableSpots}/5 spots open) at ${centreName} on ${formattedDate}! Available for immediate booking without queue wait.`

  const farmers = db.prepare('SELECT id FROM farmers').all() as any[]
  const farmerIds = farmers.length > 0 ? farmers.map((f) => f.id) : ['farmer_ramesh']

  const insertNotif = db.prepare(`
    INSERT INTO notification_logs (id, farmer_id, booking_id, channel, message, status)
    VALUES (?, ?, NULL, 'SMS', ?, 'DELIVERED')
  `)

  for (const fId of farmerIds) {
    insertNotif.run('notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), fId, msgText)
  }

  return { success: true, message: msgText, notifiedCount: farmerIds.length, alreadyBroadcast: false }
}
