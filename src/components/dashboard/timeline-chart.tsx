'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Brush } from 'recharts'
import { DeviceTimeline } from "@/lib/types"
import { formatDuration, formatDate } from "@/lib/utils"
import { Monitor, MapPin, Clock, Activity, Filter } from "lucide-react"

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
        <div className="bg-card p-4 border border-border rounded-lg shadow-xl backdrop-blur-sm max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 bg-primary/10 rounded">
              <Monitor className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground">{data.device}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{data.location}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${data.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${data.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {data.status.toUpperCase()}
                </span>
              </div>
              {data.status === 'online' && (
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">{data.efficiency.toFixed(0)}% efficiency</span>
                </div>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Start Time
                </span>
                <span className="font-medium text-card-foreground">{data.startTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-bold text-blue-400">{data.durationText}</span>
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
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Monitor className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Device Timeline</CardTitle>
              <p className="text-purple-100 text-sm mt-1">
                Individual device activity periods • {chartData.length} events • {(totalDuration / 60).toFixed(1)}h total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-yellow-300" />
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger className="w-[220px] bg-white/10 border-white/30 text-white">
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                {deviceOptions.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-3 w-3" />
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-xs text-muted-foreground">{device.location}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {chartData.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium text-card-foreground">Online Events</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{onlineData.length}</div>
                <div className="text-xs text-muted-foreground">{((onlineData.length / chartData.length) * 100).toFixed(1)}% of total</div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-card-foreground">Offline Events</span>
                </div>
                <div className="text-2xl font-bold text-red-400">{offlineData.length}</div>
                <div className="text-xs text-muted-foreground">{((offlineData.length / chartData.length) * 100).toFixed(1)}% of total</div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span className="text-sm font-medium text-card-foreground">Avg Duration</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">{(totalDuration / chartData.length).toFixed(0)}m</div>
                <div className="text-xs text-muted-foreground">per event</div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 50,
                    bottom: 70,
                  }}
                >
                  <defs>
                    <linearGradient id="onlineBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#059669" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#047857" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="offlineBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#dc2626" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    label={{ value: 'Duration (min)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--foreground))', fontSize: '12px' } }}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Brush 
                    dataKey="timestamp" 
                    height={25} 
                    stroke="#a855f7" 
                    fill="hsl(var(--muted))"
                    travellerWidth={12}
                  />
                  <Bar dataKey="duration" name="Duration" barSize={12} radius={[2, 2, 0, 0]}>
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
            
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-8 bg-card rounded-lg border border-border px-6 py-3 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-sm shadow-sm"></div>
                  <span className="text-sm font-semibold text-card-foreground">Online Period</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-sm shadow-sm"></div>
                  <span className="text-sm font-semibold text-card-foreground">Offline Period</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>Device Activity Timeline</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Device Timeline Data</h3>
            <p className="text-muted-foreground">Select a device or wait for activity data to appear.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}