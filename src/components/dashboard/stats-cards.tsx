'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Wifi, WifiOff, TrendingUp, Server } from "lucide-react"

interface StatsCardsProps {
  summary: {
    totalDevices: number
    onlineDevices: number
    offlineDevices: number
    averageUptime: number
  }
}

export function StatsCards({ summary }: StatsCardsProps) {
  const uptimeColor = summary.averageUptime >= 95 ? 'text-emerald-400' : 
                      summary.averageUptime >= 80 ? 'text-yellow-400' : 'text-red-400'
  
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Devices */}
      <Card className="enterprise-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide compact-text">
              Total Devices
            </CardTitle>
            <Server className="h-4 w-4 text-blue-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold text-foreground mb-1 compact-text">{summary.totalDevices}</div>
          <p className="text-xs text-muted-foreground compact-text">
            Registered
          </p>
        </CardContent>
      </Card>
      
      {/* Online Devices */}
      <Card className="enterprise-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide compact-text">
              Online
            </CardTitle>
            <Wifi className="h-4 w-4 text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold text-emerald-400 mb-1 compact-text">{summary.onlineDevices}</div>
          <p className="text-xs text-muted-foreground compact-text">
            Active now
          </p>
        </CardContent>
      </Card>
      
      {/* Offline Devices */}
      <Card className="enterprise-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide compact-text">
              Offline
            </CardTitle>
            <WifiOff className="h-4 w-4 text-red-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold text-red-400 mb-1 compact-text">{summary.offlineDevices}</div>
          <p className="text-xs text-muted-foreground compact-text">
            Not responding
          </p>
        </CardContent>
      </Card>
      
      {/* Average Uptime */}
      <Card className="enterprise-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide compact-text">
              Uptime
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`text-2xl font-bold mb-1 compact-text ${uptimeColor}`}>
            {summary.averageUptime.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground compact-text">
            Average
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 