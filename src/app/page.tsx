import { KrishiSetuApp } from '@/components/KrishiSetuApp'
import { 
  getFarmerProfile, 
  getCentres, 
  getFarmerBookings, 
  getCentreQueue, 
  getNotifications 
} from '@/lib/actions'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [
    initialFarmer,
    initialCentres,
    initialBookings,
    initialCentreQueue,
    initialNotifications,
  ] = await Promise.all([
    getFarmerProfile('farmer_ramesh'),
    getCentres(),
    getFarmerBookings('farmer_ramesh'),
    getCentreQueue('mandi_shirur'),
    getNotifications('farmer_ramesh'),
  ])

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
