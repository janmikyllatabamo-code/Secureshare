import React, { useState } from 'react'
import { X, Share2, Mail, UserPlus } from 'lucide-react'

export const ShareAccessModal = ({ onClose, onShare }) => {
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState('Viewer')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const list = emails.split(',').map(e => e.trim()).filter(Boolean)
    if (list.length === 0) {
      setError('Enter at least one email')
      return
    }
    setError('')
    if (onShare) onShare({ emails: list, role })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D]'>
              <Share2 className='w-4 h-4 text-white' />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Share access</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100">
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>Invite by email</label>
            <div className='flex items-center border rounded-lg px-3 py-2 border-slate-300 focus-within:border-[#7A1C1C]'>
              <Mail className='w-4 h-4 text-slate-400 mr-2' />
              <input
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="student@univ.edu, prof@univ.edu"
                className='w-full outline-none text-sm'
              />
            </div>
            <p className='mt-1 text-xs text-slate-500'>Separate multiple emails with commas</p>
            {error && <p className='mt-2 text-xs text-red-600'>{error}</p>}
          </div>

          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>Role</label>
            <div className='flex items-center gap-2'>
              <UserPlus className='w-4 h-4 text-slate-400' />
              <select value={role} onChange={(e) => setRole(e.target.value)} className='border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7A1C1C]'>
                <option>Viewer</option>
                <option>Editor</option>
                <option>Owner</option>
              </select>
            </div>
          </div>
        </form>

        <div className='flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50'>
          <button onClick={onClose} type='button' className='px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white'>Cancel</button>
          <button onClick={handleSubmit} type='submit' className='px-4 py-2 text-sm rounded-lg text-white bg-[#7A1C1C] hover:bg-[#5a1515]'>Share</button>
        </div>
      </div>
    </div>
  )
}



