import { DeviceWithReports, DeviceStatus, DeviceTimeline, TimelinePoint } from './types'

const HEALTH_MAX_TIMEOUT = parseInt(process.env.HEALTH_MAX_TIMEOUT || '300000', 10) // 5 minutes default

export function analyzeDeviceStatus(device: DeviceWithReports): DeviceStatus {
  const now = new Date()
  const reports = device.healthReports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  
  if (reports.length === 0) {
    return {
      device,
      status: 'offline',
      lastSeen: null,
      uptime: 0,
      totalReports: 0
    }
  }

  const lastReport = reports[0]
  const timeSinceLastReport = now.getTime() - lastReport.timestamp.getTime()
  const isOnline = timeSinceLastReport <= HEALTH_MAX_TIMEOUT

  // Calculate uptime percentage
  const timeline = generateTimeline(device)
  const totalTime = now.getTime() - device.createdAt.getTime()
  const onlineTime = timeline.reduce((acc, point) => {
    return acc + (point.status === 'online' ? point.duration : 0)
  }, 0)
  
  const uptime = totalTime > 0 ? (onlineTime / totalTime) * 100 : 0

  return {
    device,
    status: isOnline ? 'online' : 'offline',
    lastSeen: lastReport.timestamp,
    uptime: Math.round(uptime * 100) / 100,
    totalReports: reports.length
  }
}

export function generateTimeline(device: DeviceWithReports): TimelinePoint[] {
  const reports = device.healthReports.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  const timeline: TimelinePoint[] = []
  
  if (reports.length === 0) {
    return [{
      timestamp: device.createdAt,
      status: 'offline',
      duration: Date.now() - device.createdAt.getTime()
    }]
  }

  let currentStatus: 'online' | 'offline' = 'offline'
  let currentPeriodStart = device.createdAt
  
  for (let i = 0; i < reports.length; i++) {
    const report = reports[i]
    const prevReport = i > 0 ? reports[i - 1] : null
    
    if (prevReport) {
      const timeSinceLastReport = report.timestamp.getTime() - prevReport.timestamp.getTime()
      
      if (timeSinceLastReport > HEALTH_MAX_TIMEOUT && currentStatus === 'online') {
        // End of online period
        timeline.push({
          timestamp: currentPeriodStart,
          status: 'online',
          duration: prevReport.timestamp.getTime() - currentPeriodStart.getTime()
        })
        
        // Start offline period
        currentStatus = 'offline'
        currentPeriodStart = prevReport.timestamp
        
        // Add offline period
        timeline.push({
          timestamp: currentPeriodStart,
          status: 'offline',
          duration: report.timestamp.getTime() - currentPeriodStart.getTime()
        })
        
        // Start new online period
        currentStatus = 'online'
        currentPeriodStart = report.timestamp
      } else if (currentStatus === 'offline') {
        // First report after offline period
        timeline.push({
          timestamp: currentPeriodStart,
          status: 'offline',
          duration: report.timestamp.getTime() - currentPeriodStart.getTime()
        })
        
        currentStatus = 'online'
        currentPeriodStart = report.timestamp
      }
    } else {
      // First report
      if (report.timestamp.getTime() - device.createdAt.getTime() > HEALTH_MAX_TIMEOUT) {
        // Device was offline before first report
        timeline.push({
          timestamp: device.createdAt,
          status: 'offline',
          duration: report.timestamp.getTime() - device.createdAt.getTime()
        })
      }
      
      currentStatus = 'online'
      currentPeriodStart = report.timestamp
    }
  }
  
  // Handle current period
  const now = new Date()
  const lastReport = reports[reports.length - 1]
  const timeSinceLastReport = now.getTime() - lastReport.timestamp.getTime()
  
  if (timeSinceLastReport > HEALTH_MAX_TIMEOUT && currentStatus === 'online') {
    // End current online period and start offline
    timeline.push({
      timestamp: currentPeriodStart,
      status: 'online',
      duration: lastReport.timestamp.getTime() - currentPeriodStart.getTime()
    })
    
    timeline.push({
      timestamp: lastReport.timestamp,
      status: 'offline',
      duration: timeSinceLastReport
    })
  } else {
    // Continue current period
    timeline.push({
      timestamp: currentPeriodStart,
      status: currentStatus,
      duration: now.getTime() - currentPeriodStart.getTime()
    })
  }
  
  return timeline
}

export function getDeviceTimeline(device: DeviceWithReports): DeviceTimeline {
  return {
    device,
    timeline: generateTimeline(device)
  }
} 