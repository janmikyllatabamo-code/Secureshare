import React from 'react'
import { X, FileText, Image as ImageIcon } from 'lucide-react'

export const FilePreviewModal = ({ file, onClose }) => {
  if (!file) return null
  const name = file.name || `${file.name}.${file.ext}` || 'File'
  const url = file.url || file.previewUrl || ''
  const ext = (file.ext || name.split('.').pop() || '').toLowerCase()

  const canImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)
  const canPdf = ext === 'pdf'
  const canText = ['txt'].includes(ext)

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D]'>
              <FileText className='w-5 h-5 text-white' />
            </div>
            <h2 className='text-lg font-bold text-slate-800 truncate'>{name}</h2>
          </div>
          <button onClick={onClose} className='p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors'>
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='flex-1 bg-slate-50'>
          {canImage && url && (
            <div className='w-full h-full flex items-center justify-center p-4'>
              <img src={url} alt={name} className='max-w-full max-h-[80vh] rounded-md border border-slate-200' />
            </div>
          )}
          {canPdf && url && (
            <iframe title={name} src={url} className='w-full h-[80vh] bg-white' />
          )}
          {canText && url && (
            <iframe title={name} src={url} className='w-full h-[80vh] bg-white' />
          )}
          {!canImage && !canPdf && !canText && (
            <div className='p-8 text-center'>
              <div className='inline-flex items-center justify-center p-4 rounded-xl bg-slate-100 mb-3'>
                <ImageIcon className='w-6 h-6 text-slate-500' />
              </div>
              <p className='text-slate-700'>Preview not available for this file type.</p>
              {url && (
                <p className='text-slate-500 text-sm mt-2'>You can still download from the original location.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

