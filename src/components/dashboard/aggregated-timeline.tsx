'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DeviceTimeline } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { TimelineLegend } from "./timeline-legend"

interface AggregatedTimelineProps {
  timelines: DeviceTimeline[]
}

type TimePeriod = '5min' | '15min' | '30min' | '1hour' | '2hour' | '6hour' | '1day'

const TIME_PERIODS = {
  '5min': { label: '5 minutes', minutes: 5 },
  '15min': { label: '15 minutes', minutes: 15 },
  '30min': { label: '30 minutes', minutes: 30 },
  '1hour': { label: '1 hour', minutes: 60 },
  '2hour': { label: '2 hours', minutes: 120 },
  '6hour': { label: '6 hours', minutes: 360 },
  '1day': { label: '1 day', minutes: 1440 }
}

export function AggregatedTimeline({ timelines }: AggregatedTimelineProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('5min')

  const aggregatedData = useMemo(() => {
    if (timelines.length === 0) return []

    const periodMinutes = TIME_PERIODS[selectedPeriod].minutes
    const periodMs = periodMinutes * 60 * 1000

    // Find the time range
    const allTimestamps = timelines.flatMap(t => 
      t.timeline.map(p => p.timestamp.getTime())
    )
    
    if (allTimestamps.length === 0) return []

    const minTime = Math.min(...allTimestamps)
    const maxTime = Math.max(...allTimestamps, Date.now())
    
    // Create time buckets
    const buckets = new Map<number, { online: Set<string>, offline: Set<string> }>()
    
    // Round down to nearest period boundary
    const startTime = Math.floor(minTime / periodMs) * periodMs
    const endTime = Math.ceil(maxTime / periodMs) * periodMs
    
    // Initialize buckets
    for (let time = startTime; time <= endTime; time += periodMs) {
      buckets.set(time, { online: new Set(), offline: new Set() })
    }

    // Process each device timeline
    timelines.forEach(deviceTimeline => {
      const deviceId = deviceTimeline.device.id
      const timeline = deviceTimeline.timeline
      
      if (timeline.length === 0) {
        // Device has no reports, mark as offline for all periods
        for (let time = startTime; time <= endTime; time += periodMs) {
          buckets.get(time)?.offline.add(deviceId)
        }
        return
      }

      // Sort timeline by timestamp
      const sortedTimeline = [...timeline].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      
      for (let time = startTime; time <= endTime; time += periodMs) {
        const periodStart = time
        const periodEnd = time + periodMs
        
        // Find the status of this device during this period
        let deviceStatus = 'offline' // Default to offline
        
        // Check if device had any online time during this period
        for (const point of sortedTimeline) {
          const pointStart = point.timestamp.getTime()
          const pointEnd = pointStart + point.duration
          
          // Check if this timeline point overlaps with our period
          if (pointStart < periodEnd && pointEnd > periodStart) {
            if (point.status === 'online') {
              deviceStatus = 'online'
              break // Device was online during this period
            }
          }
        }
        
        const bucket = buckets.get(time)
        if (bucket) {
          if (deviceStatus === 'online') {
            bucket.online.add(deviceId)
            bucket.offline.delete(deviceId) // Remove from offline if it was there
          } else {
            bucket.offline.add(deviceId)
          }
        }
      }
    })

    // Convert to chart data
    return Array.from(buckets.entries())
      .map(([time, data]) => ({
        timestamp: time,
        timeLabel: formatDate(new Date(time)),
        online: data.online.size,
        offline: data.offline.size,
        total: data.online.size + data.offline.size
      }))
      .filter(item => item.total > 0) // Only show periods with devices
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [timelines, selectedPeriod])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{data.timeLabel}</p>
          <p className="text-sm text-green-600">Online: {data.online} devices</p>
          <p className="text-sm text-red-600">Offline: {data.offline} devices</p>
          <p className="text-sm text-gray-600">Total: {data.total} devices</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Device Count Timeline</CardTitle>
          <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIME_PERIODS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
                {aggregatedData.length > 0 ? (
          <div>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={aggregatedData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return selectedPeriod === '1day' 
                      ? date.toLocaleDateString() 
                      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  label={{ value: 'Device Count', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="offline" stackId="devices" fill="#ef4444" name="Offline" />
                <Bar dataKey="online" stackId="devices" fill="#10b981" name="Online" />
              </BarChart>
            </ResponsiveContainer>
            <TimelineLegend className="mt-4" />
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No timeline data available
          </div>
        )}
      </CardContent>
    </Card>
  )
} 