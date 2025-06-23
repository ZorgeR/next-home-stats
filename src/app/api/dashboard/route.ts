import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeDeviceStatus, getDeviceTimeline } from '@/lib/health-analyzer'
import { DeviceWithReports } from '@/lib/types'

export async function GET() {
  try {
    // Fetch all devices with their health reports
    const devices = await prisma.device.findMany({
      include: {
        healthReports: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1000 // Limit to last 1000 reports per device
        }
      }
    }) as DeviceWithReports[]

    // Analyze each device status
    const deviceStatuses = devices.map(device => analyzeDeviceStatus(device))
    
    // Generate timeline data
    const deviceTimelines = devices.map(device => getDeviceTimeline(device))

    // Calculate summary statistics
    const totalDevices = devices.length
    const onlineDevices = deviceStatuses.filter(status => status.status === 'online').length
    const offlineDevices = totalDevices - onlineDevices
    const averageUptime = totalDevices > 0 
      ? deviceStatuses.reduce((acc, status) => acc + status.uptime, 0) / totalDevices 
      : 0

    // Get locations summary
    const locations = [...new Set(devices.map(device => device.location))]
    const locationStats = locations.map(location => {
      const locationDevices = deviceStatuses.filter(status => status.device.location === location)
      const onlineInLocation = locationDevices.filter(status => status.status === 'online').length
      
      return {
        location,
        total: locationDevices.length,
        online: onlineInLocation,
        offline: locationDevices.length - onlineInLocation
      }
    })

    return NextResponse.json({
      summary: {
        totalDevices,
        onlineDevices,
        offlineDevices,
        averageUptime: Math.round(averageUptime * 100) / 100
      },
      locations: locationStats,
      devices: deviceStatuses,
      timelines: deviceTimelines
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 