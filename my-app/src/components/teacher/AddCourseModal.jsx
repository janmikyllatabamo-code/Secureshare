import React, { useState } from 'react'
import { X, BookOpen } from 'lucide-react'

export const AddCourseModal = ({ onClose, onSave }) => {
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [selectedDays, setSelectedDays] = useState([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState('')

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const handleSubmit = () => {
    if (!courseCode || !courseName) {
      setError('Course Code and Course Name are required')
      return
    }
    
    if (selectedDays.length === 0) {
      setError('Please select at least one day')
      return
    }
    
    if (!startTime || !endTime) {
      setError('Please select both start and end times')
      return
    }

    setError('')
    if (onSave) {
      onSave({
        courseCode,
        courseName,
        schedule: {
          days: selectedDays,
          startTime,
          endTime
        }
      })
    }
    if (onClose) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D]'>
              <BookOpen className='w-5 h-5 text-white' />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Add New Course</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Course Code */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Course Code <span className='text-red-500'>*</span>
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g., CS101"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7A1C1C] focus:border-transparent outline-none"
              />
            </div>

            {/* Course Name */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Course Name <span className='text-red-500'>*</span>
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., Introduction to Computer Science"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7A1C1C] focus:border-transparent outline-none"
              />
            </div>

            {/* Day Selection */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Schedule Days <span className='text-red-500'>*</span>
              </label>
              <div className='flex flex-wrap gap-2'>
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      selectedDays.includes(day)
                        ? 'bg-[#7A1C1C] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Inputs */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Start Time <span className='text-red-500'>*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7A1C1C] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  End Time <span className='text-red-500'>*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7A1C1C] focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50'>
          <button 
            onClick={onClose}
            className='px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-white transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className='px-6 py-2.5 bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold rounded-lg transition-colors'
          >
            Create Course
          </button>
        </div>
      </div>
    </div>
  )
}

