'use client'

import { useEffect, useState } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { DevicesTable } from '@/components/dashboard/devices-table'
import { TimelineChart } from '@/components/dashboard/timeline-chart'
import { AggregatedTimeline } from '@/components/dashboard/aggregated-timeline'
import { Button } from '@/components/ui/button'
import { RefreshCw, Activity, Shield } from 'lucide-react'

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
      const processedData: DashboardData = {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm compact-text">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-foreground mb-1 compact-text">Connection Error</h2>
          <p className="text-red-400 mb-4 text-sm compact-text">{error}</p>
          <Button onClick={fetchData} size="sm" className="bg-primary hover:bg-primary/90">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm compact-text">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Compact Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground compact-text">
                  Device Health Monitor
                </h1>
                <p className="text-muted-foreground text-xs compact-text">
                  {data.summary.totalDevices} devices • {data.summary.onlineDevices} online
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {lastUpdated && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground compact-text">Updated</p>
                  <p className="text-xs font-mono text-primary compact-text">{lastUpdated.toLocaleTimeString()}</p>
                </div>
              )}
              <Button
                onClick={fetchData}
                disabled={loading}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Content */}
      <div className="container mx-auto py-4 px-4">
        <div className="space-y-4">
          <StatsCards summary={data.summary} />
          <AggregatedTimeline timelines={data.timelines} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <DevicesTable devices={data.devices} />
            <TimelineChart timelines={data.timelines} />
          </div>
        </div>
      </div>
    </div>
  )
} 