'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Brush } from 'recharts'
import { DeviceTimeline } from "@/lib/types"
import { formatDuration, formatDate } from "@/lib/utils"
import { Monitor, Clock, Activity, BarChart3 } from "lucide-react"

interface TimelineChartProps {
  timelines: DeviceTimeline[]
  selectedDevice?: string
}

export function TimelineChart({ timelines, selectedDevice: initialSelectedDevice }: TimelineChartProps) {
  const [selectedDevice, setSelectedDevice] = useState<string>(initialSelectedDevice || 'all')
  
  // Filter to selected device or show all
  const filteredTimelines = selectedDevice === 'all' 
    ? timelines 
    : timelines.filter(t => t.device.id === selectedDevice)

  // Transform timeline data for chart
  const chartData = filteredTimelines.flatMap(deviceTimeline => 
    deviceTimeline.timeline.map(point => ({
      device: deviceTimeline.device.name,
      location: deviceTimeline.device.location,
      deviceId: deviceTimeline.device.id,
      timestamp: point.timestamp.getTime(),
      duration: point.duration / (1000 * 60), // Convert to minutes
      status: point.status,
      startTime: formatDate(point.timestamp),
      durationText: formatDuration(point.duration),
      efficiency: point.status === 'online' ? Math.min(100, (point.duration / (1000 * 60 * 60)) * 10) : 0 // Efficiency score
    }))
  ).sort((a, b) => a.timestamp - b.timestamp)

  const deviceOptions = [
    { id: 'all', name: 'All Devices', location: 'Multiple Locations' },
    ...timelines.map(t => ({ id: t.device.id, name: t.device.name, location: t.device.location }))
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-black border border-border rounded p-3 text-xs max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="h-3 w-3 text-primary" />
            <p className="font-semibold text-foreground compact-text">{data.device}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between p-2 bg-secondary rounded">
              <span className={`${data.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.status.toUpperCase()}
              </span>
              {data.status === 'online' && (
                <span className="text-blue-400 font-mono text-xs">{data.efficiency.toFixed(0)}%</span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="text-blue-400 font-mono">{data.durationText}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const onlineData = chartData.filter(d => d.status === 'online')
  const offlineData = chartData.filter(d => d.status === 'offline')
  const totalDuration = chartData.reduce((acc, d) => acc + d.duration, 0)

  return (
    <Card className="enterprise-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-sm font-bold text-foreground compact-text">
                Device Activity Timeline
              </CardTitle>
              <p className="text-xs text-muted-foreground compact-text">
                {chartData.length} events • {(totalDuration / 60).toFixed(1)}h total
              </p>
            </div>
          </div>
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger className="w-[140px] h-8 bg-secondary border-border text-foreground text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {deviceOptions.map((device) => (
                <SelectItem key={device.id} value={device.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-3 w-3" />
                    <span>{device.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {chartData.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="enterprise-card border border-border rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-medium text-foreground compact-text">Online</span>
                </div>
                <div className="text-xl font-bold text-emerald-400 compact-text">{onlineData.length}</div>
                <div className="text-xs text-muted-foreground compact-text">{((onlineData.length / chartData.length) * 100).toFixed(0)}%</div>
              </div>
              <div className="enterprise-card border border-border rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-medium text-foreground compact-text">Offline</span>
                </div>
                <div className="text-xl font-bold text-red-400 compact-text">{offlineData.length}</div>
                <div className="text-xs text-muted-foreground compact-text">{((offlineData.length / chartData.length) * 100).toFixed(0)}%</div>
              </div>
              <div className="enterprise-card border border-border rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-2 h-2 text-blue-400" />
                  <span className="text-xs font-medium text-foreground compact-text">Avg Duration</span>
                </div>
                <div className="text-xl font-bold text-blue-400 compact-text">{(totalDuration / chartData.length).toFixed(0)}m</div>
                <div className="text-xs text-muted-foreground compact-text">per event</div>
              </div>
            </div>

            <div className="enterprise-card border border-border rounded p-3">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 30,
                    bottom: 40,
                  }}
                >
                  <defs>
                    <linearGradient id="onlineBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="offlineBarGradient" x1="0" y1="0" x2="0" y2="1">
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
                      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    height={40}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="duration" barSize={8} radius={[1, 1, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.status === 'online' ? 'url(#onlineBarGradient)' : 'url(#offlineBarGradient)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                <span className="text-foreground">Online Period</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span className="text-foreground">Offline Period</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Monitor className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-foreground mb-1 compact-text">No Timeline Data</h3>
            <p className="text-xs text-muted-foreground compact-text">Select a device or wait for activity data.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}