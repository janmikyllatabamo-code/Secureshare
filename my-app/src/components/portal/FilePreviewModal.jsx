import React, { useState, useEffect } from 'react'
import { X, FileText, Image as ImageIcon, Download, ExternalLink, Loader, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getFileUrl } from '../../utils/storageUtils'

export const FilePreviewModal = ({ file, onClose }) => {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [urlError, setUrlError] = useState(null)
  const [loadingUrl, setLoadingUrl] = useState(true)
  
  // Generate signed URL on mount if not provided
  // IMPORTANT: All hooks must be called before any early returns
  useEffect(() => {
    if (!file) return
    
    const generateUrl = async () => {
      setLoadingUrl(true)
      setUrlError(null)
      
      // If URL is already provided, use it
      if (file.url || file.previewUrl) {
        setFileUrl(file.url || file.previewUrl)
        setLoadingUrl(false)
        return
      }
      
      // Otherwise, generate signed URL from file path and bucket
      if (file.path && file.bucket) {
        try {
          const url = await getFileUrl(file.bucket, file.path, 3600) // 1 hour expiration
          if (url) {
            setFileUrl(url)
          } else {
            throw new Error('Failed to generate file URL')
          }
        } catch (error) {
          console.error('Error generating file URL:', error)
          setUrlError(error.message || 'Failed to load file. The bucket may not exist or you may not have permission.')
        } finally {
          setLoadingUrl(false)
        }
      } else {
        setUrlError('File path or bucket information is missing')
        setLoadingUrl(false)
      }
    }
    
    generateUrl()
  }, [file])
  
  // Early return after all hooks
  if (!file) return null
  
  const name = file.name || 'File'
  const ext = (file.ext || name.split('.').pop() || '').toLowerCase()

  const canImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)
  const canPdf = ext === 'pdf'
  const canText = ['txt'].includes(ext)

  const handleDownload = async () => {
    if (!fileUrl) {
      // Try to generate URL on demand
      if (file.path && file.bucket) {
        try {
          const url = await getFileUrl(file.bucket, file.path, 3600)
          if (url) {
            setFileUrl(url)
            window.open(url, '_blank')
          } else {
            alert('Unable to download file. Please try again later.')
          }
        } catch (error) {
          alert('Error downloading file: ' + error.message)
        }
      }
      return
    }
    
    try {
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
      
      // Log download action
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && file?.fileId) {
          await supabase.from('activity_log').insert({
            user_id: user.id,
            action_type: 'download',
            file_name: name,
            file_id: file.fileId,
            details: { source: 'preview_modal' }
          })
        }
      } catch (activityError) {
        console.warn('Failed to log download activity (non-critical):', activityError)
      }
    } catch (err) {
      console.error('Download error:', err)
      // Fallback: open in new tab
      if (fileUrl) {
        window.open(fileUrl, '_blank')
      }
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
            {fileUrl && !loadingUrl && (
              <>
                <button 
                  onClick={handleDownload}
                  className='p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors'
                  title='Download'
                >
                  <Download className='w-5 h-5' />
                </button>
                <a 
                  href={fileUrl} 
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
          {/* Loading state */}
          {loadingUrl && (
            <div className='w-full h-full flex items-center justify-center min-h-[400px]'>
              <div className='text-center'>
                <Loader className='w-8 h-8 text-[#7A1C1C] animate-spin mx-auto mb-3' />
                <p className='text-slate-600'>Loading file...</p>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {urlError && !loadingUrl && (
            <div className='w-full h-full flex items-center justify-center min-h-[400px] p-8'>
              <div className='text-center max-w-md'>
                <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-slate-800 mb-2'>Unable to Load File</h3>
                <p className='text-slate-600 mb-4'>{urlError}</p>
                <div className='space-y-2'>
                  <p className='text-sm text-slate-500'>Possible solutions:</p>
                  <ul className='text-sm text-slate-500 text-left list-disc list-inside space-y-1'>
                    <li>Verify the storage bucket exists in Supabase Dashboard</li>
                    <li>Check that you have permission to access this file</li>
                    <li>Ensure the file path is correct</li>
                  </ul>
                  {file.path && file.bucket && (
                    <button
                      onClick={async () => {
                        try {
                          const url = await getFileUrl(file.bucket, file.path, 3600)
                          if (url) {
                            setFileUrl(url)
                            setUrlError(null)
                          }
                        } catch (error) {
                          setUrlError('Failed to retry: ' + error.message)
                        }
                      }}
                      className='mt-4 px-4 py-2 bg-[#7A1C1C] text-white rounded-lg hover:bg-[#9B2D2D] transition-colors'
                    >
                      Retry Loading
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Image preview */}
          {canImage && fileUrl && !loadingUrl && !urlError && (
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
                  <a href={fileUrl} target='_blank' rel='noopener noreferrer' className='text-[#7A1C1C] hover:underline text-sm mt-2 inline-block'>
                    Open in new tab
                  </a>
                </div>
              ) : (
                <img 
                  src={fileUrl} 
                  alt={name} 
                  className='max-w-full max-h-[80vh] rounded-lg shadow-lg object-contain' 
                  onLoad={() => setImageLoading(false)}
                  onError={() => { setImageLoading(false); setImageError(true); }}
                  style={{ display: imageLoading ? 'none' : 'block' }}
                />
              )}
            </div>
          )}
          
          {/* PDF preview */}
          {canPdf && fileUrl && !loadingUrl && !urlError && (
            <iframe 
              title={name} 
              src={`${fileUrl}#toolbar=1&navpanes=0`} 
              className='w-full h-[80vh] bg-white' 
              onError={() => setUrlError('Failed to load PDF. The file may be corrupted or inaccessible.')}
            />
          )}
          
          {/* Text preview */}
          {canText && fileUrl && !loadingUrl && !urlError && (
            <iframe 
              title={name} 
              src={fileUrl} 
              className='w-full h-[80vh] bg-white' 
              onError={() => setUrlError('Failed to load text file.')}
            />
          )}
          
          {/* Unsupported file type */}
          {!canImage && !canPdf && !canText && !loadingUrl && !urlError && (
            <div className='p-12 text-center flex flex-col items-center justify-center min-h-[400px]'>
              <div className='inline-flex items-center justify-center p-6 rounded-2xl bg-slate-200 mb-4'>
                <FileText className='w-12 h-12 text-slate-500' />
              </div>
              <p className='text-slate-700 font-medium mb-2'>Preview not available for .{ext} files</p>
              <p className='text-slate-500 text-sm mb-4'>You can download the file to view it</p>
              {fileUrl && (
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
