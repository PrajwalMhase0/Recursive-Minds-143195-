import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'krishisetu.db')
const db = new Database(dbPath)

console.log('🔄 Initializing SQLite database at:', dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Create KrishiSetu database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS procurement_centres (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude REAL DEFAULT 0,
    longitude REAL DEFAULT 0,
    max_capacity_per_slot INTEGER DEFAULT 20,
    contact_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS farmers (
    id TEXT PRIMARY KEY,
    farmer_id_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    village TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    registered_crops TEXT DEFAULT '[]', -- JSON array of strings
    preferred_centre_id TEXT REFERENCES procurement_centres(id) ON DELETE SET NULL,
    verified INTEGER DEFAULT 1,         -- 1 = true, 0 = false
    aadhaar_last4 TEXT DEFAULT '1234',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    booking_code TEXT UNIQUE NOT NULL,
    farmer_id TEXT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    centre_id TEXT NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
    slot_date TEXT NOT NULL,
    slot_time TEXT NOT NULL,
    crop TEXT NOT NULL,
    approx_quantity_quintals REAL NOT NULL,
    status TEXT DEFAULT 'BOOKED',
    queue_number INTEGER,
    check_in_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS procurements (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    receipt_no TEXT UNIQUE NOT NULL,
    actual_weight_quintals REAL NOT NULL,
    grade TEXT NOT NULL,
    rate_per_quintal REAL NOT NULL,
    total_amount REAL NOT NULL,
    payment_status TEXT DEFAULT 'COMPLETED',
    payment_reference TEXT,
    payment_date TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
    channel TEXT DEFAULT 'SMS',
    message TEXT NOT NULL,
    status TEXT DEFAULT 'DELIVERED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

// Seed initial procurement centres
const insertCentre = db.prepare(`
  INSERT OR IGNORE INTO procurement_centres (
    id, name, location, district, state, latitude, longitude, max_capacity_per_slot, contact_phone
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

insertCentre.run(
  'centre_nashik_main',
  'Nashik APMC Main Sub-Centre',
  'Panchavati, Nashik',
  'Nashik',
  'Maharashtra',
  20.011,
  73.79,
  25,
  '0253-2571234'
)

insertCentre.run(
  'centre_pimpalgaon',
  'Pimpalgaon Baswant APMC Market Yard',
  'Station Road, Pimpalgaon',
  'Nashik',
  'Maharashtra',
  20.174,
  73.987,
  30,
  '02554-223456'
)

insertCentre.run(
  'centre_lasalgaon',
  'Lasalgaon Onion & Grain Procurement Hub',
  'Lasalgaon Main Yard',
  'Nashik',
  'Maharashtra',
  20.147,
  74.228,
  35,
  '02550-266789'
)

// Seed default farmer profile (Ramesh Patil)
const insertFarmer = db.prepare(`
  INSERT OR IGNORE INTO farmers (
    id, farmer_id_code, name, phone, village, district, state, registered_crops, preferred_centre_id, verified, aadhaar_last4
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

insertFarmer.run(
  'farmer_ramesh',
  'MH-NSK-2024-0089',
  'Ramesh Patil',
  '9876543210',
  'Pimpalgaon Baswant',
  'Nashik',
  'Maharashtra',
  JSON.stringify(['Soybean', 'Wheat', 'Onion', 'Gram']),
  'centre_nashik_main',
  1,
  '4521'
)

// Seed sample booking
const insertBooking = db.prepare(`
  INSERT OR IGNORE INTO bookings (
    id, booking_code, farmer_id, centre_id, slot_date, slot_time, crop, approx_quantity_quintals, status, queue_number
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const sampleDate = new Date().toISOString().split('T')[0]

insertBooking.run(
  'book_sample_01',
  'KS-849201',
  'farmer_ramesh',
  'centre_nashik_main',
  sampleDate,
  '10:00 AM - 11:00 AM',
  'Soybean',
  35.5,
  'CONFIRMED',
  12
)

console.log('✅ SQLite tables created and seeded successfully!')
db.close()
