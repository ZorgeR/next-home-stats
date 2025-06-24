'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts'
import { DeviceTimeline } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { TimelineLegend } from "./timeline-legend"
import { Clock, Zap, Activity } from "lucide-react"

interface AggregatedTimelineProps {
  timelines: DeviceTimeline[]
}

type TimePeriod = '5min' | '15min' | '30min' | '1hour' | '2hour' | '6hour' | '1day'

const TIME_PERIODS = {
  '5min': { label: '5 minutes', minutes: 5, icon: '⚡' },
  '15min': { label: '15 minutes', minutes: 15, icon: '🔄' },
  '30min': { label: '30 minutes', minutes: 30, icon: '⏰' },
  '1hour': { label: '1 hour', minutes: 60, icon: '🕐' },
  '2hour': { label: '2 hours', minutes: 120, icon: '🕑' },
  '6hour': { label: '6 hours', minutes: 360, icon: '🕕' },
  '1day': { label: '1 day', minutes: 1440, icon: '📅' }
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
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <p className="font-semibold text-gray-900">{data.timeLabel}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-emerald-700 font-medium">Online</span>
              </div>
              <span className="text-sm font-bold text-emerald-800">{data.online} devices</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-700 font-medium">Offline</span>
              </div>
              <span className="text-sm font-bold text-red-800">{data.offline} devices</span>
            </div>
            <div className="border-t pt-1 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-sm font-bold text-gray-900">{data.total} devices</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-bold text-blue-600">{data.uptimePercentage.toFixed(1)}%</span>
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
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Device Count Timeline</CardTitle>
              <p className="text-blue-100 text-sm mt-1">
                Real-time device status aggregation • {totalDevices} total devices • {avgUptime.toFixed(1)}% avg uptime
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-300" />
            <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-[200px] bg-white/10 border-white/30 text-white">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIME_PERIODS).map(([key, { label, icon }]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {aggregatedData.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={aggregatedData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 40,
                    bottom: 50,
                  }}
                >
                  <defs>
                    <linearGradient id="onlineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="offlineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
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
                    angle={-45}
                    textAnchor="end"
                    height={50}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis 
                    label={{ value: 'Device Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#475569', fontSize: '14px', fontWeight: 'bold' } }}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    iconType="rect"
                    wrapperStyle={{ paddingBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}
                  />
                  <Brush 
                    dataKey="timestamp" 
                    height={30} 
                    stroke="#8b5cf6" 
                    fill="#f3f4f6"
                    travellerWidth={15}
                  />
                  <Bar 
                    dataKey="offline" 
                    stackId="devices" 
                    fill="url(#offlineGradient)" 
                    name="Offline Devices" 
                    barSize={20}
                    radius={[0, 0, 2, 2]}
                  />
                  <Bar 
                    dataKey="online" 
                    stackId="devices" 
                    fill="url(#onlineGradient)" 
                    name="Online Devices" 
                    barSize={20}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-8 bg-white rounded-lg border border-gray-200 px-6 py-3 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-sm shadow-sm"></div>
                  <span className="text-sm font-semibold text-gray-700">Online Devices</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-sm shadow-sm"></div>
                  <span className="text-sm font-semibold text-gray-700">Offline Devices</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Period: {TIME_PERIODS[selectedPeriod].label}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timeline Data</h3>
            <p className="text-gray-600">Start monitoring devices to see timeline data here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 