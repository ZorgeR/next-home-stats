import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceName = searchParams.get('device_name')
    const location = searchParams.get('location')
    const accessKey = searchParams.get('access_key')
    const accessToken = searchParams.get('access_token')

    // Validate required parameters
    if (!deviceName || !location || !accessKey || !accessToken) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters: device_name, location, access_key, access_token' 
        },
        { status: 400 }
      )
    }

    // Optional: Validate access credentials
    const envAccessKey = process.env.API_ACCESS_KEY
    const envAccessToken = process.env.API_ACCESS_TOKEN
    
    if (envAccessKey && envAccessToken) {
      if (accessKey !== envAccessKey || accessToken !== envAccessToken) {
        return NextResponse.json(
          { error: 'Invalid access credentials' },
          { status: 401 }
        )
      }
    }

    // Find or create device
    let device = await prisma.device.findUnique({
      where: {
        name_location: {
          name: deviceName,
          location: location
        }
      }
    })

    if (!device) {
      device = await prisma.device.create({
        data: {
          name: deviceName,
          location: location,
          accessKey: accessKey,
          accessToken: accessToken
        }
      })
    }

    // Create health report
    const healthReport = await prisma.healthReport.create({
      data: {
        deviceId: device.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        location: device.location
      },
      report: {
        id: healthReport.id,
        timestamp: healthReport.timestamp
      }
    })

  } catch (error) {
    console.error('Health report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 