import { NextRequest, NextResponse } from 'next/server'
import { getAllCedaRates, fetchCedaCommodityRate, CEDA_COMMODITY_MAP } from '@/lib/cedaAgmarknetService'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cropQuery = searchParams.get('crop')?.toLowerCase().trim()
    const refresh = searchParams.get('refresh') === 'true'
    const stateId = Number(searchParams.get('state_id')) || 27
    const districtId = Number(searchParams.get('district_id')) || 516

    // If requesting a specific single crop
    if (cropQuery && CEDA_COMMODITY_MAP[cropQuery]) {
      const meta = CEDA_COMMODITY_MAP[cropQuery]
      const specific = await fetchCedaCommodityRate(meta.id, stateId, districtId)

      if (specific) {
        return NextResponse.json({
          success: true,
          crop: cropQuery,
          hindiName: meta.hindi,
          marathiName: meta.marathi,
          data: specific,
          govtMsp: meta.msp,
          source: 'https://agmarknet.ceda.ashoka.edu.in/',
          lastSynced: new Date().toISOString(),
        })
      }
    }

    // Otherwise return all tracked commodities
    const rates = await getAllCedaRates(refresh)

    return NextResponse.json({
      success: true,
      count: rates.length,
      source: 'CEDA Agri Market Data (agmarknet.ceda.ashoka.edu.in)',
      provider: 'Directorate of Marketing & Inspection (DMI), Ministry of Agriculture and Farmers Welfare',
      lastSynced: new Date().toISOString(),
      rates,
    })
  } catch (err: any) {
    console.error('Error in /api/mandi-rates:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch mandi rates' },
      { status: 500 }
    )
  }
}
