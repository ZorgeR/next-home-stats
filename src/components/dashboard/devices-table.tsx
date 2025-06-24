'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/utils"
import { DeviceStatus } from "@/lib/types"
import { Monitor, Clock, Activity } from "lucide-react"

interface DevicesTableProps {
  devices: DeviceStatus[]
}

function StatusBadge({ status }: { status: 'online' | 'offline' }) {
  if (status === 'online') {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
        <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
        <span className="text-xs font-medium text-emerald-400 compact-text">ONLINE</span>
      </div>
    )
  }
  
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
      <span className="text-xs font-medium text-red-400 compact-text">OFFLINE</span>
    </div>
  )
}

export function DevicesTable({ devices }: DevicesTableProps) {
  const onlineCount = devices.filter(d => d.status === 'online').length
  const totalCount = devices.length
  
  return (
    <Card className="enterprise-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-sm font-bold text-foreground compact-text">
                Device Status
              </CardTitle>
              <p className="text-xs text-muted-foreground compact-text">
                {totalCount} devices • {onlineCount} online
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <div className="enterprise-card border border-border rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/10">
                  <th className="text-left py-2 px-3 font-semibold text-foreground compact-text">Device</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground compact-text">Location</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground compact-text">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground compact-text">Last Seen</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground compact-text">Uptime</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground compact-text">Reports</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((deviceStatus) => (
                  <tr key={deviceStatus.device.id} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                          <Monitor className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground compact-text">{deviceStatus.device.name}</div>
                          <div className="text-xs text-muted-foreground compact-text font-mono">{deviceStatus.device.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-muted-foreground compact-text">{deviceStatus.device.location}</span>
                    </td>
                    <td className="py-2 px-3">
                      <StatusBadge status={deviceStatus.status} />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground compact-text font-mono">
                          {deviceStatus.lastSeen 
                            ? formatRelativeTime(deviceStatus.lastSeen)
                            : 'Never'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-secondary rounded-full h-1 overflow-hidden">
                          <div 
                            className={`h-1 rounded-full transition-all duration-300 ${
                              deviceStatus.uptime > 90 ? 'bg-emerald-500' :
                              deviceStatus.uptime > 70 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(deviceStatus.uptime, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono compact-text ${
                          deviceStatus.uptime > 90 ? 'text-emerald-400' :
                          deviceStatus.uptime > 70 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {deviceStatus.uptime.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-blue-500/10 flex items-center justify-center">
                          <span className="text-xs font-mono text-blue-400">{deviceStatus.totalReports}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {devices.length === 0 && (
              <div className="text-center py-8">
                <Monitor className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-foreground mb-1 compact-text">No Devices</h3>
                <p className="text-xs text-muted-foreground compact-text">Start monitoring devices to see them here.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 