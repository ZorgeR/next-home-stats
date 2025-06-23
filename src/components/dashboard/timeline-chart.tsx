'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DeviceTimeline } from "@/lib/types"
import { formatDuration, formatDate } from "@/lib/utils"

interface TimelineChartProps {
  timelines: DeviceTimeline[]
  selectedDevice?: string
}

export function TimelineChart({ timelines, selectedDevice }: TimelineChartProps) {
  // Filter to selected device or show all
  const filteredTimelines = selectedDevice 
    ? timelines.filter(t => t.device.id === selectedDevice)
    : timelines

  // Transform timeline data for chart
  const chartData = filteredTimelines.flatMap(deviceTimeline => 
    deviceTimeline.timeline.map(point => ({
      device: deviceTimeline.device.name,
      location: deviceTimeline.device.location,
      timestamp: point.timestamp.getTime(),
      duration: point.duration / (1000 * 60), // Convert to minutes
      status: point.status,
      startTime: formatDate(point.timestamp),
      durationText: formatDuration(point.duration)
    }))
  ).sort((a, b) => a.timestamp - b.timestamp)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{data.device}</p>
          <p className="text-sm text-gray-600">{data.location}</p>
          <p className="text-sm">
            Status: <span className={`font-medium ${data.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
              {data.status}
            </span>
          </p>
          <p className="text-sm">Start: {data.startTime}</p>
          <p className="text-sm">Duration: {data.durationText}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="w-full">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 60,
                  bottom: 80,
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
                    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis 
                  width={60}
                  label={{ value: 'Duration (minutes)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="duration" name="Duration" maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.status === 'online' ? '#10b981' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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