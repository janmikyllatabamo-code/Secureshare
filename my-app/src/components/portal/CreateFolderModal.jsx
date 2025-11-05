import React, { useState } from 'react'
import { X, FolderPlus } from 'lucide-react'

export const CreateFolderModal = ({ onClose, onCreate }) => {
  const [folderName, setFolderName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!folderName.trim()) {
      setError('Folder name is required')
      return
    }
    setError('')
    if (onCreate) onCreate(folderName.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D]'>
              <FolderPlus className='w-4 h-4 text-white' />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Create folder</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100">
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <label className='block text-sm font-semibold text-slate-700 mb-2'>Folder name</label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="e.g., CS 201 - Lectures"
            className={`w-full border rounded-lg px-3 py-2 outline-none text-sm transition-colors ${error ? 'border-red-400' : 'border-slate-300 focus:border-[#7A1C1C]'} `}
          />
          {error && <p className='mt-2 text-xs text-red-600'>{error}</p>}
        </form>

        <div className='flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50'>
          <button onClick={onClose} type='button' className='px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white'>Cancel</button>
          <button onClick={handleSubmit} type='submit' className='px-4 py-2 text-sm rounded-lg text-white bg-[#7A1C1C] hover:bg-[#5a1515]'>Create</button>
        </div>
      </div>
    </div>
  )
}



