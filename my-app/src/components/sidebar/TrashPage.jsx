import React, { useState, useEffect, useCallback } from 'react'
import { Trash2, FileText, Undo2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const TrashPage = () => {
  const [trashed, setTrashed] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  // Log activity helper
  const logActivity = async (actionType, fileName, fileId = null, details = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action_type: actionType,
        file_name: fileName,
        file_id: fileId,
        details
      })
    } catch (err) {
      console.error('Error logging activity:', err)
    }
  }

  const fetchTrashedFiles = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_trashed', true)
        .order('trashed_at', { ascending: false })

      if (error) {
        console.error('Error fetching trashed files:', error)
        return
      }

      setTrashed(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrashedFiles()
  }, [fetchTrashedFiles])

  useEffect(() => {
    const handleUpdate = () => fetchTrashedFiles()
    window.addEventListener('app:files:updated', handleUpdate)
    return () => window.removeEventListener('app:files:updated', handleUpdate)
  }, [fetchTrashedFiles])

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (date) => {
    if (!date) return 'Unknown'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const restore = async (file) => {
    try {
      setActionLoading(file.file_id)
      
      const { error } = await supabase
        .from('files')
        .update({ 
          is_trashed: false, 
          trashed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('file_id', file.file_id)

      if (error) {
        console.error('Error restoring file:', error)
        return
      }

      await logActivity('restore', file.file_name, file.file_id)

      fetchTrashedFiles()
      window.dispatchEvent(new Event('app:files:updated'))
    } catch (err) {
      console.error('Restore error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteForever = async (file) => {
    if (!window.confirm(`Permanently delete "${file.file_name}"? This cannot be undone.`)) {
      return
    }

    try {
      setActionLoading(file.file_id)
      
      // Delete from storage first (only for non-folders)
      if (!file.is_folder && file.file_path && file.bucket) {
        const { error: storageError } = await supabase.storage
          .from(file.bucket)
          .remove([file.file_path])
        
        if (storageError) {
          console.error('Storage delete error:', storageError)
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('file_id', file.file_id)

      if (dbError) {
        console.error('Database delete error:', dbError)
        return
      }

      // Log permanent delete action
      await logActivity('permanent_delete', file.file_name, file.file_id, { 
        was_folder: file.is_folder || false
      })

      fetchTrashedFiles()
      window.dispatchEvent(new Event('app:files:updated'))
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const emptyTrash = async () => {
    if (!window.confirm('Permanently delete all items in trash? This cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete all files from storage (non-folders only)
      for (const file of trashed) {
        if (!file.is_folder && file.file_path && file.bucket) {
          await supabase.storage.from(file.bucket).remove([file.file_path])
        }
      }

      // Delete all from database
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('user_id', user.id)
        .eq('is_trashed', true)

      if (error) {
        console.error('Empty trash error:', error)
        return
      }

      // Log empty trash action
      await logActivity('empty_trash', `${trashed.length} files`, null, { 
        count: trashed.length 
      })

      fetchTrashedFiles()
      window.dispatchEvent(new Event('app:files:updated'))
    } catch (err) {
      console.error('Empty trash error:', err)
    } finally {
      setLoading(false)
    }
  }

  const restoreAll = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('files')
        .update({ 
          is_trashed: false, 
          trashed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_trashed', true)

      if (error) {
        console.error('Restore all error:', error)
        return
      }

      await logActivity('restore', `${trashed.length} files`, null, { count: trashed.length })

      fetchTrashedFiles()
      window.dispatchEvent(new Event('app:files:updated'))
    } catch (err) {
      console.error('Restore all error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-[calc(100vh-64px)] m-0 p-0'>
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <div className='flex items-center justify-between flex-wrap gap-3 mb-4'>
          <h1 className='text-3xl lg:text-4xl font-bold text-slate-800'>Trash</h1>
          {trashed.length > 0 && (
            <div className='flex items-center gap-2'>
              <button 
                onClick={restoreAll}
                disabled={loading}
                className='inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#7A1C1C] hover:text-[#7A1C1C] transition-colors disabled:opacity-50'
              >
                <Undo2 className='w-4 h-4' />
                <span>Restore all</span>
              </button>
              <button 
                onClick={emptyTrash}
                disabled={loading}
                className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50'
              >
                <Trash2 className='w-4 h-4' />
                <span>Empty trash</span>
              </button>
            </div>
          )}
        </div>
        <p className='text-slate-600'>Restore or permanently delete files. Items in trash are automatically deleted after 30 days.</p>
      </div>

      <section className='px-6 lg:px-12 pb-12'>
        <div className='w-full rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
          <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
            <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
              <Trash2 className='w-5 h-5 text-[#7A1C1C]' />
              Deleted Items
              {trashed.length > 0 && <span className='text-sm font-normal text-slate-500'>({trashed.length} items)</span>}
            </h2>
          </div>
          <div className='overflow-y-auto max-h-[60vh]'>
            {loading ? (
              <div className='px-6 py-12 text-center text-slate-400'>
                <div className='animate-spin w-8 h-8 border-2 border-[#7A1C1C] border-t-transparent rounded-full mx-auto mb-3'></div>
                Loading...
              </div>
            ) : trashed.length === 0 ? (
              <div className='px-6 py-12 text-center text-slate-400'>
                <Trash2 className='w-12 h-12 mx-auto mb-3 opacity-50' />
                <p>Trash is empty</p>
                <p className='text-sm mt-1'>Deleted files will appear here</p>
              </div>
            ) : (
              <ul className='divide-y divide-slate-100'>
                {trashed.map((file) => (
                  <li key={file.file_id} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 group'>
                    <div className='flex items-center justify-between gap-4'>
                      <div className='flex items-start gap-3 flex-1'>
                        <div className='p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors mt-1'>
                          <FileText className='w-4 h-4 text-slate-600' />
                        </div>
                        <div className='flex-1'>
                          <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                            {file.file_name}
                          </p>
                          <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                            <span>{formatFileSize(file.file_size)}</span>
                            <span>•</span>
                            <span className='flex items-center gap-1'>
                              <Clock className='w-3 h-3' />
                              <span>Deleted {formatDate(file.trashed_at)}</span>
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <button 
                          onClick={() => restore(file)} 
                          disabled={actionLoading === file.file_id}
                          className='inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50'
                        >
                          <Undo2 className='w-4 h-4' />
                          <span className='text-sm'>Restore</span>
                        </button>
                        <button 
                          onClick={() => deleteForever(file)} 
                          disabled={actionLoading === file.file_id}
                          className='inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                        >
                          <XCircle className='w-4 h-4' />
                          <span className='text-sm'>Delete</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {trashed.length > 0 && (
          <div className='mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3'>
            <AlertTriangle className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm font-semibold text-amber-800'>Items in trash</p>
              <p className='text-sm text-amber-700'>Files in trash will be automatically deleted after 30 days. Restore them if you want to keep them.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
