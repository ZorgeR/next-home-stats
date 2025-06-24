'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/utils"
import { DeviceStatus } from "@/lib/types"

interface DevicesTableProps {
  devices: DeviceStatus[]
}

function StatusBadge({ status }: { status: 'online' | 'offline' }) {
  return (
    <Badge 
      variant={status === 'online' ? 'default' : 'destructive'}
      className={status === 'online' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
    >
      {status}
    </Badge>
  )
}

export function DevicesTable({ devices }: DevicesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 font-medium">Device Name</th>
                <th className="text-left py-2 px-4 font-medium">Location</th>
                <th className="text-left py-2 px-4 font-medium">Status</th>
                <th className="text-left py-2 px-4 font-medium">Last Seen</th>
                <th className="text-left py-2 px-4 font-medium">Uptime</th>
                <th className="text-left py-2 px-4 font-medium">Reports</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((deviceStatus) => (
                <tr key={deviceStatus.device.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4 font-medium">{deviceStatus.device.name}</td>
                  <td className="py-2 px-4 text-muted-foreground">{deviceStatus.device.location}</td>
                  <td className="py-2 px-4">
                    <StatusBadge status={deviceStatus.status} />
                  </td>
                  <td className="py-2 px-4 text-muted-foreground">
                    {deviceStatus.lastSeen 
                      ? formatRelativeTime(deviceStatus.lastSeen)
                      : 'Never'
                    }
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            deviceStatus.uptime > 90 ? 'bg-green-500' :
                            deviceStatus.uptime > 70 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(deviceStatus.uptime, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {deviceStatus.uptime.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-muted-foreground">
                    {deviceStatus.totalReports}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {devices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No devices found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 