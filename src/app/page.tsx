import { KrishiSetuApp } from '@/components/KrishiSetuApp'
import { 
  getFarmerProfile, 
  getCentres, 
  getFarmerBookings, 
  getCentreQueue, 
  getNotifications 
} from '@/lib/actions'
import { Farmer, ProcurementCentre, Booking, NotificationLog } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function Page() {
  let initialFarmer: Farmer | null = null
  let initialCentres: ProcurementCentre[] = []
  let initialBookings: Booking[] = []
  let initialCentreQueue: Booking[] = []
  let initialNotifications: NotificationLog[] = []

  try {
    const results = await Promise.allSettled([
      getFarmerProfile('farmer_ramesh'),
      getCentres(),
      getFarmerBookings('farmer_ramesh'),
      getCentreQueue('mandi_shirur'),
      getNotifications('farmer_ramesh'),
    ])

    initialFarmer = results[0].status === 'fulfilled' ? results[0].value : null
    initialCentres = results[1].status === 'fulfilled' ? results[1].value : []
    initialBookings = results[2].status === 'fulfilled' ? results[2].value : []
    initialCentreQueue = results[3].status === 'fulfilled' ? results[3].value : []
    initialNotifications = results[4].status === 'fulfilled' ? results[4].value : []
  } catch (err) {
    console.error('Initial data fetch fallback caught:', err)
  }

  return (
    <KrishiSetuApp
      initialFarmer={initialFarmer}
      initialCentres={initialCentres}
      initialBookings={initialBookings}
      initialCentreQueue={initialCentreQueue}
      initialNotifications={initialNotifications}
    />
  )
}
