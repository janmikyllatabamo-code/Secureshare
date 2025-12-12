import React, { useState } from 'react'
import { X, Upload, FileText, Download, Paperclip, Eye } from 'lucide-react'
import { FilePreviewModal } from '../portal/FilePreviewModal'

export const AssignmentSubmissionModal = ({ assignment, onClose, onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [submissionType, setSubmissionType] = useState('individual')
  const [groupMemberEmails, setGroupMemberEmails] = useState('')
  const [error, setError] = useState('')
  const [previewFile, setPreviewFile] = useState(null)
  
  const isSubmitted = assignment?.status === 'submitted'

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setError('')
    }
  }

  const handleSubmit = () => {
    if (!isSubmitted) {
      if (!selectedFile) {
        setError('Please select a file to upload')
        return
      }
      
      if (submissionType === 'group' && !groupMemberEmails.trim()) {
        setError('Please enter group member emails')
        return
      }
    }
    
    setError('')
    if (onSubmit) {
      onSubmit({
        assignmentId: assignment.id,
        file: selectedFile,
        submissionType,
        groupMemberEmails: submissionType === 'group' ? groupMemberEmails : null
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 my-4 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D]'>
              <Upload className='w-5 h-5 text-white' />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Submit Assignment</h2>
              <p className="text-sm text-slate-600">{assignment?.title || 'Assignment'}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Assignment Info */}
            {assignment && (
              <div>
                <h3 className='font-semibold text-slate-800 mb-4 text-lg'>Assignment Details</h3>
                <div className='bg-slate-50 rounded-lg p-5 space-y-4'>
                  {/* Top Row: Title, Due Date, Status */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                      <p className='font-medium text-slate-700 mb-1 text-xs uppercase tracking-wide'>Title</p>
                      <p className='text-slate-800 font-medium'>{assignment.title}</p>
                    </div>
                    
                    <div>
                      <p className='font-medium text-slate-700 mb-1 text-xs uppercase tracking-wide'>Due Date</p>
                      <p className='text-slate-800 font-medium'>{assignment.dueDate}</p>
                    </div>

                    {assignment.status && (
                      <div>
                        <p className='font-medium text-slate-700 mb-1 text-xs uppercase tracking-wide'>Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          assignment.status === 'submitted' 
                            ? 'bg-green-100 text-green-800' 
                            : assignment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {assignment.status === 'submitted' ? 'Submitted' : 
                           assignment.status === 'pending' ? 'Pending' : 'Not Started'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Assignment Description */}
                  {assignment.description && (
                    <div className='border-t border-slate-200 pt-4'>
                      <p className='font-medium text-slate-700 mb-2 text-xs uppercase tracking-wide'>Description</p>
                      <div className='bg-white rounded-lg p-4 border border-slate-200 max-h-48 overflow-y-auto'>
                        <p className='text-slate-700 whitespace-pre-wrap text-sm leading-relaxed'>{assignment.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Teacher's Attached Document */}
                  {assignment.attachedFile && (
                    <div className='border-t border-slate-200 pt-4'>
                      <p className='font-medium text-slate-700 mb-2 text-xs uppercase tracking-wide'>Instructional Material</p>
                      <div className='flex items-center gap-3'>
                        <button
                          onClick={() => setPreviewFile({ name: assignment.attachedFile.name, url: assignment.attachedFile.url, ext: (assignment.attachedFile.name || '').split('.').pop() })}
                          className='flex items-center gap-2 px-4 py-2.5 bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-medium rounded-lg transition-colors text-sm'
                        >
                          <Eye className='w-4 h-4' />
                          <span>Preview: {assignment.attachedFile.name}</span>
                        </button>
                        {assignment.attachedFile.size && (
                          <span className='text-xs text-slate-500'>
                            ({(assignment.attachedFile.size / 1024).toFixed(2)} KB)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submission Type Selection - Only show if not submitted */}
            {!isSubmitted && (
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Submission Type <span className='text-red-500'>*</span>
                </label>
                <div className='flex gap-4'>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='submissionType'
                      value='individual'
                      checked={submissionType === 'individual'}
                      onChange={(e) => setSubmissionType(e.target.value)}
                      className='w-4 h-4 text-[#7A1C1C] focus:ring-[#7A1C1C]'
                    />
                    <span className='text-slate-700'>Individual</span>
                  </label>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='submissionType'
                      value='group'
                      checked={submissionType === 'group'}
                      onChange={(e) => setSubmissionType(e.target.value)}
                      className='w-4 h-4 text-[#7A1C1C] focus:ring-[#7A1C1C]'
                    />
                    <span className='text-slate-700'>Group</span>
                  </label>
                </div>
              </div>
            )}

            {/* Group Member Emails - Only show if group type selected and not submitted */}
            {!isSubmitted && submissionType === 'group' && (
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Group Member Emails <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  value={groupMemberEmails}
                  onChange={(e) => setGroupMemberEmails(e.target.value)}
                  placeholder='email1@example.com, email2@example.com'
                  className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#7A1C1C] focus:border-transparent outline-none'
                />
                <p className='mt-1 text-xs text-slate-500'>
                  Enter email addresses separated by commas
                </p>
              </div>
            )}

            {/* File Upload - Only show if not submitted */}
            {!isSubmitted && (
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Upload File <span className='text-red-500'>*</span>
                </label>
                <label className='block'>
                  <input
                    type='file'
                    className='hidden'
                    onChange={handleFileSelect}
                    accept='.pdf,.doc,.docx,.ppt,.pptx'
                  />
                  <div className='flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-[#7A1C1C] transition-colors cursor-pointer'>
                    <Upload className='w-5 h-5 text-slate-400' />
                    <span className='text-sm font-medium text-slate-600'>
                      {selectedFile ? selectedFile.name : 'Choose File'}
                    </span>
                  </div>
                </label>
                <p className='mt-2 text-xs text-slate-500'>
                  Accepted formats: PDF, DOC, DOCX, PPT, PPTX
                </p>
              </div>
            )}

            {/* Submitted File Display - Only show if submitted */}
            {isSubmitted && assignment.submittedAt && (
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Submitted File
                </label>
                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                  <div className='flex items-center gap-3'>
                    <FileText className='w-5 h-5 text-green-600' />
                    <div>
                      <p className='text-sm font-medium text-slate-800'>
                        {assignment.submittedFile || 'Assignment_Submission.pdf'}
                      </p>
                      <p className='text-xs text-slate-500 mt-1'>
                        Submitted on: {assignment.submittedAt}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && <p className='mt-2 text-xs text-red-600 bg-red-50 p-2 rounded'>{error}</p>}
          </div>
        </div>

        {/* Footer - Only show submit button if not submitted */}
        {!isSubmitted && (
          <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0'>
            <button 
              onClick={onClose}
              className='px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-white transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile}
              className='px-6 py-2.5 bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              <Upload className='w-4 h-4' />
              Submit
            </button>
          </div>
        )}
        
        {/* Footer - Only close button if submitted */}
        {isSubmitted && (
          <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0'>
            <button 
              onClick={onClose}
              className='px-6 py-2.5 bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold rounded-lg transition-colors'
            >
              Close
            </button>
          </div>
        )}

        {previewFile && (
          <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
        )}
      </div>
    </div>
  )
}


