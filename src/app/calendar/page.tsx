import React from 'react'
import { Calendar } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="h-6 w-6 text-gray-700" />
        <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-600">
          <p>Calendar view coming soon</p>
        </div>
      </div>
    </div>
  )
}