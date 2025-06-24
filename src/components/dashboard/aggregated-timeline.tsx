'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts'
import { DeviceTimeline } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { TimelineLegend } from "./timeline-legend"
import { Clock, Activity, BarChart3 } from "lucide-react"

interface AggregatedTimelineProps {
  timelines: DeviceTimeline[]
}

type TimePeriod = '5min' | '15min' | '30min' | '1hour' | '2hour' | '6hour' | '1day'

const TIME_PERIODS = {
  '5min': { label: '5min', minutes: 5 },
  '15min': { label: '15min', minutes: 15 },
  '30min': { label: '30min', minutes: 30 },
  '1hour': { label: '1hr', minutes: 60 },
  '2hour': { label: '2hr', minutes: 120 },
  '6hour': { label: '6hr', minutes: 360 },
  '1day': { label: '1day', minutes: 1440 }
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
        total: data.online.size + data.offline.size,
        uptimePercentage: data.online.size / (data.online.size + data.offline.size) * 100
      }))
      .filter(item => item.total > 0) // Only show periods with devices
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [timelines, selectedPeriod])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-black border border-border rounded p-3 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3 w-3 text-blue-400" />
            <p className="font-semibold text-foreground compact-text">{data.timeLabel}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400">Online</span>
              <span className="text-emerald-400 font-mono">{data.online}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-400">Offline</span>
              <span className="text-red-400 font-mono">{data.offline}</span>
            </div>
            <div className="border-t border-border pt-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-foreground font-mono">{data.total}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const totalDevices = Math.max(...aggregatedData.map(d => d.total), 0)
  const avgUptime = aggregatedData.length > 0 
    ? aggregatedData.reduce((acc, d) => acc + d.uptimePercentage, 0) / aggregatedData.length 
    : 0

  return (
    <Card className="enterprise-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-sm font-bold text-foreground compact-text">
                Device Status Timeline
              </CardTitle>
              <p className="text-xs text-muted-foreground compact-text">
                {totalDevices} devices • {avgUptime.toFixed(1)}% avg uptime
              </p>
            </div>
          </div>
          <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[100px] h-8 bg-secondary border-border text-foreground text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIME_PERIODS).map(([key, { label }]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {aggregatedData.length > 0 ? (
          <div className="space-y-3">
            <div className="enterprise-card border border-border rounded p-3">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={aggregatedData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 30,
                    bottom: 30,
                  }}
                  barCategoryGap="10%"
                  maxBarSize={40}
                >
                  <defs>
                    <linearGradient id="onlineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="offlineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return selectedPeriod === '1day' 
                        ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    height={30}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="offline" 
                    stackId="devices" 
                    fill="url(#offlineGradient)" 
                    radius={[0, 0, 1, 1]}
                  />
                  <Bar 
                    dataKey="online" 
                    stackId="devices" 
                    fill="url(#onlineGradient)" 
                    radius={[1, 1, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                <span className="text-foreground">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span className="text-foreground">Offline</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Period: {TIME_PERIODS[selectedPeriod].label}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-foreground mb-1 compact-text">No Timeline Data</h3>
            <p className="text-xs text-muted-foreground compact-text">Start monitoring devices to see timeline data.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 