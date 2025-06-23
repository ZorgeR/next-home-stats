'use client'

interface TimelineLegendProps {
  className?: string
}

export function TimelineLegend({ className = "" }: TimelineLegendProps) {
  return (
    <div className={`flex items-center justify-center space-x-6 text-sm ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-green-500 rounded"></div>
        <span className="text-gray-700">Online</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-red-500 rounded"></div>
        <span className="text-gray-700">Offline</span>
      </div>
    </div>
  )
} 