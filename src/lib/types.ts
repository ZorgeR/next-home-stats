export interface Device {
  id: string
  name: string
  location: string
  createdAt: Date
  updatedAt: Date
}

export interface HealthReport {
  id: string
  deviceId: string
  timestamp: Date
  createdAt: Date
}

export interface DeviceWithReports extends Device {
  healthReports: HealthReport[]
}

export interface DeviceStatus {
  device: Device
  status: 'online' | 'offline'
  lastSeen: Date | null
  uptime: number // percentage
  totalReports: number
}

export interface TimelinePoint {
  timestamp: Date
  status: 'online' | 'offline'
  duration: number // in milliseconds
}

export interface DeviceTimeline {
  device: Device
  timeline: TimelinePoint[]
} 