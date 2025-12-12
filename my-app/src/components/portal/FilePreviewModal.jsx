import React, { useState } from 'react'
import { X, FileText, Image as ImageIcon, Download, ExternalLink, Loader } from 'lucide-react'

export const FilePreviewModal = ({ file, onClose }) => {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  if (!file) return null
  const name = file.name || 'File'
  const url = file.url || file.previewUrl || ''
  const ext = (file.ext || name.split('.').pop() || '').toLowerCase()

  const canImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)
  const canPdf = ext === 'pdf'
  const canText = ['txt'].includes(ext)

  const handleDownload = async () => {
    if (!url) return
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      // Fallback: open in new tab
      window.open(url, '_blank')
    }
  }

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4' onClick={onClose}>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col' onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white'>
          <div className='flex items-center gap-3 flex-1 min-w-0'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] flex-shrink-0'>
              {canImage ? <ImageIcon className='w-5 h-5 text-white' /> : <FileText className='w-5 h-5 text-white' />}
            </div>
            <h2 className='text-lg font-bold text-slate-800 truncate'>{name}</h2>
          </div>
          <div className='flex items-center gap-2 flex-shrink-0'>
            {url && (
              <>
                <button 
                  onClick={handleDownload}
                  className='p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors'
                  title='Download'
                >
                  <Download className='w-5 h-5' />
                </button>
                <a 
                  href={url} 
                  target='_blank' 
                  rel='noopener noreferrer'
                  className='p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors'
                  title='Open in new tab'
                >
                  <ExternalLink className='w-5 h-5' />
                </a>
              </>
            )}
            <button onClick={onClose} className='p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors'>
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 bg-slate-100 overflow-auto'>
          {canImage && url && (
            <div className='w-full h-full flex items-center justify-center p-4 min-h-[400px]'>
              {imageLoading && !imageError && (
                <div className='absolute inset-0 flex items-center justify-center'>
                  <Loader className='w-8 h-8 text-[#7A1C1C] animate-spin' />
                </div>
              )}
              {imageError ? (
                <div className='text-center text-slate-500'>
                  <ImageIcon className='w-16 h-16 mx-auto mb-3 opacity-50' />
                  <p>Failed to load image</p>
                  <a href={url} target='_blank' rel='noopener noreferrer' className='text-[#7A1C1C] hover:underline text-sm mt-2 inline-block'>
                    Open in new tab
                  </a>
                </div>
              ) : (
                <img 
                  src={url} 
                  alt={name} 
                  className='max-w-full max-h-[80vh] rounded-lg shadow-lg object-contain' 
                  onLoad={() => setImageLoading(false)}
                  onError={() => { setImageLoading(false); setImageError(true); }}
                  style={{ display: imageLoading ? 'none' : 'block' }}
                />
              )}
            </div>
          )}
          {canPdf && url && (
            <iframe 
              title={name} 
              src={`${url}#toolbar=1&navpanes=0`} 
              className='w-full h-[80vh] bg-white' 
            />
          )}
          {canText && url && (
            <iframe 
              title={name} 
              src={url} 
              className='w-full h-[80vh] bg-white' 
            />
          )}
          {!canImage && !canPdf && !canText && (
            <div className='p-12 text-center flex flex-col items-center justify-center min-h-[400px]'>
              <div className='inline-flex items-center justify-center p-6 rounded-2xl bg-slate-200 mb-4'>
                <FileText className='w-12 h-12 text-slate-500' />
              </div>
              <p className='text-slate-700 font-medium mb-2'>Preview not available for .{ext} files</p>
              <p className='text-slate-500 text-sm mb-4'>You can download the file to view it</p>
              {url && (
                <button 
                  onClick={handleDownload}
                  className='inline-flex items-center gap-2 px-6 py-3 bg-[#7A1C1C] text-white rounded-lg hover:bg-[#5a1515] transition-colors'
                >
                  <Download className='w-5 h-5' />
                  Download File
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
