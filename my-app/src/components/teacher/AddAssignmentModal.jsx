import React, { useState } from 'react'
import { X, FileText, Paperclip } from 'lucide-react'

export const AddAssignmentModal = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [maxPoints, setMaxPoints] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = () => {
    // Reset error
    setError('')

    // Validate required fields
    if (!title.trim()) {
      setError('Assignment Title is required')
      return
    }

    if (!dueDate) {
      setError('Due Date is required')
      return
    }

    if (!dueTime) {
      setError('Due Time is required')
      return
    }

    if (!maxPoints || parseFloat(maxPoints) <= 0) {
      setError('Max Points/Grade must be a positive number')
      return
    }

    // Combine due date and time
    const dueDateTime = `${dueDate} ${dueTime}`

    // Prepare file data for consumer; include raw file for upload
    const fileData = attachedFile ? {
      name: attachedFile.name,
      size: attachedFile.size,
      type: attachedFile.type,
      url: URL.createObjectURL(attachedFile),
      rawFile: attachedFile
    } : null

    // Call onSave with assignment data
    if (onSave) {
      onSave({
        title: title.trim(),
        description: description.trim(),
        dueDate,
        dueTime,
        dueDateTime,
        maxPoints: parseFloat(maxPoints),
        attachedFile: fileData
      })
    }

    // Close modal
    if (onClose) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D]'>
              <FileText className='w-5 h-5 text-white' />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Add New Assignment</h2>
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

            {/* Assignment Title */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Assignment's Title <span className='text-red-500'>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Assignment 1: Introduction to Programming"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7A1C1C] focus:border-transparent outline-none"
              />
            </div>

            {/* Assignment Description */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Assignment's Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter detailed instructions for the assignment..."
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7A1C1C] focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Due Date and Due Time */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Due Date <span className='text-red-500'>*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7A1C1C] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Due Time <span className='text-red-500'>*</span>
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7A1C1C] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Max Points/Grade */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Max Points/Grade <span className='text-red-500'>*</span>
              </label>
              <input
                type="number"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
                placeholder="e.g., 100"
                min="1"
                step="0.01"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7A1C1C] focus:border-transparent outline-none"
              />
            </div>

            {/* File Attachment */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Attach Document
              </label>
              <label className='block'>
                <input
                  type='file'
                  className='hidden'
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAttachedFile(e.target.files[0])
                    }
                  }}
                  accept='.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip'
                />
                <div className='flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-[#7A1C1C] transition-colors cursor-pointer'>
                  <Paperclip className='w-5 h-5 text-slate-400' />
                  <span className='text-sm font-medium text-slate-600'>
                    {attachedFile ? attachedFile.name : 'Choose File (Optional)'}
                  </span>
                </div>
              </label>
              {attachedFile && (
                <div className='mt-2 flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setAttachedFile(null)}
                    className='text-xs text-red-600 hover:text-red-700 font-medium'
                  >
                    Remove
                  </button>
                  <span className='text-xs text-slate-500'>
                    • {(attachedFile.size / 1024).toFixed(2)} KB
                  </span>
                </div>
              )}
              <p className='mt-2 text-xs text-slate-500'>
                Accepted formats: PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP
              </p>
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
            Create Assignment
          </button>
        </div>
      </div>
    </div>
  )
}


