'use client'

import { useEffect, useState } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { DevicesTable } from '@/components/dashboard/devices-table'
import { TimelineChart } from '@/components/dashboard/timeline-chart'
import { AggregatedTimeline } from '@/components/dashboard/aggregated-timeline'
import { RefreshCw } from 'lucide-react'

interface DashboardData {
  summary: {
    totalDevices: number
    onlineDevices: number
    offlineDevices: number
    averageUptime: number
  }
  locations: Array<{
    location: string
    total: number
    online: number
    offline: number
  }>
  devices: Array<{
    device: {
      id: string
      name: string
      location: string
      createdAt: string
      updatedAt: string
    }
    status: 'online' | 'offline'
    lastSeen: string | null
    uptime: number
    totalReports: number
  }>
  timelines: Array<{
    device: {
      id: string
      name: string
      location: string
      createdAt: string
      updatedAt: string
    }
    timeline: Array<{
      timestamp: string
      status: 'online' | 'offline'
      duration: number
    }>
  }>
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const dashboardData = await response.json()
      
      // Convert string dates to Date objects
      const processedData = {
        ...dashboardData,
        devices: dashboardData.devices.map((deviceStatus: any) => ({
          ...deviceStatus,
          device: {
            ...deviceStatus.device,
            createdAt: new Date(deviceStatus.device.createdAt),
            updatedAt: new Date(deviceStatus.device.updatedAt)
          },
          lastSeen: deviceStatus.lastSeen ? new Date(deviceStatus.lastSeen) : null
        })),
        timelines: dashboardData.timelines.map((timeline: any) => ({
          ...timeline,
          device: {
            ...timeline.device,
            createdAt: new Date(timeline.device.createdAt),
            updatedAt: new Date(timeline.device.updatedAt)
          },
          timeline: timeline.timeline.map((point: any) => ({
            ...point,
            timestamp: new Date(point.timestamp)
          }))
        }))
      }
      
      setData(processedData)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Device Health Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Monitor your devices in real-time
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

                 <div className="space-y-8">
           <StatsCards summary={data.summary} />
           
           <AggregatedTimeline timelines={data.timelines} />
           
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
             <DevicesTable devices={data.devices} />
             <TimelineChart timelines={data.timelines} />
           </div>
         </div>
      </div>
    </div>
  )
} 