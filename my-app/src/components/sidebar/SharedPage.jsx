import React, { useState, useEffect, useCallback } from 'react'
import { Share2, Users, FileText, Clock, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ShareAccessModal } from '../portal/ShareAccessModal'

export const SharedPage = () => {
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharedItems, setSharedItems] = useState([])
  const [sharedWithMe, setSharedWithMe] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('shared-by-me')

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

  const calculateDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null
    const today = new Date()
    const expiry = new Date(expiryDate)
    if (isNaN(expiry.getTime())) return null
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Note: ShareAccessModal handles file upload, so we don't need to fetch userFiles here

      // Fetch shares created by user
      const { data: myShares, error: mySharesError } = await supabase
        .from('shared_access')
        .select(`
          *,
          files (
            file_id,
            file_name,
            file_path,
            file_size,
            file_type,
            bucket,
            user_id
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (mySharesError) {
        console.error('Error fetching my shared files:', mySharesError)
      }

      // Always fetch file data separately to ensure we have complete information
      // This is more reliable than relying on the join which might fail due to RLS
      if (myShares && myShares.length > 0) {
        const fileIds = myShares.map(s => s.file_id).filter(Boolean)
        if (fileIds.length > 0) {
          // Fetch files with all necessary data
          const { data: filesData, error: filesError } = await supabase
            .from('files')
            .select('file_id, file_name, file_path, file_size, file_type, bucket, user_id')
            .in('file_id', fileIds)
          
          if (filesError) {
            console.error('Error fetching file data:', filesError)
            if (filesError.message?.includes('policy') || filesError.message?.includes('RLS') || 
                filesError.code === '42501' || filesError.code === 'PGRST301') {
              console.error('🚫 RLS policy is blocking file access!')
              console.error('📝 Please run FIX_SHARED_FILES_RLS.sql in Supabase SQL Editor to fix this.')
            }
          }
          
          // Map complete file data to shares
          if (filesData && filesData.length > 0) {
            // Create a map for quick lookup - handle both UUID and string file_ids
            const fileMap = new Map()
            filesData.forEach(f => {
              // Store with both string and original value for matching
              fileMap.set(String(f.file_id), f)
              fileMap.set(f.file_id, f)
            })
            
            myShares.forEach(share => {
              // Try multiple ways to match the file_id
              let fileData = fileMap.get(share.file_id) || 
                           fileMap.get(String(share.file_id)) ||
                           filesData.find(f => String(f.file_id) === String(share.file_id))
              
              if (fileData) {
                share.files = fileData
              } else {
                console.warn(`File not found in batch for share_id ${share.share_id}, file_id ${share.file_id}`)
              }
            })
          } else {
            console.warn('No files data returned for fileIds:', fileIds)
          }
        }
      }

      setSharedItems(myShares || [])

      // Fetch files shared with me
      // Check both shared_with_email (case-insensitive) and shared_with_id
      // Exclude files I shared (already in myShares)
      const userEmail = user.email?.toLowerCase() || ''
      const { data: sharedToMe, error: sharedToMeError } = await supabase
        .from('shared_access')
        .select(`
          *,
          files (
            file_id,
            file_name,
            file_path,
            file_size,
            file_type,
            bucket,
            user_id
          )
        `)
        .or(`shared_with_email.ilike.%${userEmail}%,shared_with_id.eq.${user.id}`)
        .neq('owner_id', user.id) // Exclude files I shared (already in myShares)
        .order('created_at', { ascending: false })

      if (sharedToMeError) {
        console.error('Error fetching shared files:', sharedToMeError)
      }

      // Always fetch file data separately to ensure we have complete information
      // This is more reliable than relying on the join which might fail due to RLS
      if (sharedToMe && sharedToMe.length > 0) {
        const fileIds = sharedToMe.map(s => s.file_id).filter(Boolean)
        if (fileIds.length > 0) {
          // Fetch files with all necessary data
          const { data: filesData, error: filesError } = await supabase
            .from('files')
            .select('file_id, file_name, file_path, file_size, file_type, bucket, user_id')
            .in('file_id', fileIds)
          
          if (filesError) {
            console.error('Error fetching file data:', filesError)
            if (filesError.message?.includes('policy') || filesError.message?.includes('RLS') || 
                filesError.code === '42501' || filesError.code === 'PGRST301') {
              console.error('🚫 RLS policy is blocking file access!')
              console.error('📝 Please run FIX_SHARED_FILES_RLS.sql in Supabase SQL Editor to fix this.')
            }
          }
          
          // Map complete file data to shares
          if (filesData && filesData.length > 0) {
            // Create a map for quick lookup - handle both UUID and string file_ids
            const fileMap = new Map()
            filesData.forEach(f => {
              // Store with both string and original value for matching
              const fileIdStr = String(f.file_id)
              fileMap.set(fileIdStr, f)
              fileMap.set(f.file_id, f)
              // Also store with trimmed/cleaned versions
              if (fileIdStr.includes('-')) {
                // UUID format
                fileMap.set(fileIdStr.toLowerCase(), f)
                fileMap.set(fileIdStr.toUpperCase(), f)
              }
            })
            
            sharedToMe.forEach(share => {
              // First check if join already provided file data
              if (share.files && (share.files.file_name || share.files.name)) {
                // Join worked, use that data
                return
              }
              
              // Try multiple ways to match the file_id (handle UUID vs string)
              const shareFileIdStr = String(share.file_id)
              let fileData = fileMap.get(share.file_id) || 
                           fileMap.get(shareFileIdStr) ||
                           fileMap.get(shareFileIdStr.toLowerCase()) ||
                           fileMap.get(shareFileIdStr.toUpperCase()) ||
                           filesData.find(f => {
                             const fIdStr = String(f.file_id)
                             return fIdStr === shareFileIdStr ||
                                    fIdStr.toLowerCase() === shareFileIdStr.toLowerCase() ||
                                    f.file_id === share.file_id
                           })
              
              if (fileData) {
                share.files = fileData
              } else {
                // If file not found, log detailed warning for debugging
                console.warn(`File not found for share_id ${share.share_id}, file_id ${share.file_id} (type: ${typeof share.file_id})`)
                console.warn(`Available file_ids in map:`, Array.from(fileMap.keys()).slice(0, 5))
                console.warn(`Files found:`, filesData.length, 'Expected:', fileIds.length)
              }
            })
          } else {
            console.warn('No files data returned for fileIds:', fileIds)
            console.warn('This might be due to RLS policies. Check Supabase RLS settings for the files table.')
          }
        } else {
          console.warn('No valid file_ids found in sharedToMe:', sharedToMe)
        }
      }

      setSharedWithMe(sharedToMe || [])
    } catch (err) {
      console.error('Error fetching shared data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handleUpdate = () => fetchData()
    window.addEventListener('app:shared:updated', handleUpdate)
    window.addEventListener('app:files:updated', handleUpdate)
    return () => {
      window.removeEventListener('app:shared:updated', handleUpdate)
      window.removeEventListener('app:files:updated', handleUpdate)
    }
  }, [fetchData])

  // Handle share from ShareAccessModal (uploads file and creates share records)
  // ShareAccessModal handles all the file upload and sharing logic internally
  const handleShare = async ({ emails, file, fileId }) => {
    // ShareAccessModal already handles:
    // 1. File upload to Supabase Storage
    // 2. File record creation in database
    // 3. Share record creation in shared_access table
    // 4. Activity logging
    // So we just need to refresh the data
    fetchData()
    window.dispatchEvent(new Event('app:shared:updated'))
    window.dispatchEvent(new Event('app:files:updated'))
  }

  const handleRevokeAccess = async (shareId, fileName) => {
    if (!window.confirm('Are you sure you want to revoke this access?')) return
    
    try {
      // Get share details before deleting
      const { data: shareData } = await supabase
        .from('shared_access')
        .select('shared_with_email, file_id')
        .eq('share_id', shareId)
        .single()
      
      await supabase.from('shared_access').delete().eq('share_id', shareId)
      
      // Log revoke access action
      if (shareData) {
        await logActivity('revoke_share', fileName, shareData.file_id, { 
          shared_with: shareData.shared_with_email 
        })
      }
      
      fetchData()
      window.dispatchEvent(new Event('app:files:updated'))
    } catch (err) {
      console.error('Revoke error:', err)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getFileUrl = (file) => {
    if (!file) return null
    // Handle both object and array cases
    const fileData = Array.isArray(file) ? file[0] : file
    if (!fileData || !fileData.bucket || !fileData.file_path) return null
    const { data } = supabase.storage.from(fileData.bucket).getPublicUrl(fileData.file_path)
    return data?.publicUrl
  }

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-[calc(100vh-64px)] m-0 p-0'>
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <div className='flex items-center justify-between flex-wrap gap-3 mb-4'>
          <h1 className='text-3xl lg:text-4xl font-bold text-slate-800'>Shared</h1>
          <button onClick={() => setShowShareModal(true)} className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A1C1C] text-white hover:opacity-95 transition-opacity'>
            <Share2 className='w-4 h-4' />
            <span>Share a file</span>
          </button>
        </div>
        <p className='text-slate-600'>Manage files you've shared and files shared with you.</p>

        {/* Tabs */}
        <div className='mt-6 border-b border-slate-200'>
          <div className='flex gap-4'>
            <button 
              onClick={() => setActiveTab('shared-by-me')}
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'shared-by-me' 
                  ? 'border-[#7A1C1C] text-[#7A1C1C]' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Shared by me ({sharedItems.length})
            </button>
            <button 
              onClick={() => setActiveTab('shared-with-me')}
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'shared-with-me' 
                  ? 'border-[#7A1C1C] text-[#7A1C1C]' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Shared with me ({sharedWithMe.length})
            </button>
          </div>
        </div>
      </div>

      <section className='px-6 lg:px-12 pb-12'>
        <div className='w-full rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
          <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
            <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
              <Users className='w-5 h-5 text-[#7A1C1C]' />
              {activeTab === 'shared-by-me' ? 'Files You\'ve Shared' : 'Files Shared With You'}
            </h2>
          </div>
          <div className='overflow-y-auto max-h-[60vh]'>
            {loading ? (
              <div className='px-6 py-12 text-center text-slate-400'>
                <div className='animate-spin w-8 h-8 border-2 border-[#7A1C1C] border-t-transparent rounded-full mx-auto mb-3'></div>
                Loading...
              </div>
            ) : activeTab === 'shared-by-me' ? (
              sharedItems.length === 0 ? (
                <div className='px-6 py-12 text-center text-slate-400'>
                  <Share2 className='w-12 h-12 mx-auto mb-3 opacity-50' />
                  <p>You haven't shared any files yet</p>
                  <button onClick={() => setShowShareModal(true)} className='mt-3 text-[#7A1C1C] hover:underline text-sm'>
                    Share your first file
                  </button>
                </div>
              ) : (
                <ul className='divide-y divide-slate-100'>
                  {sharedItems.map((item) => {
                    const daysRemaining = calculateDaysRemaining(item.expires_at)
                    const isExpired = daysRemaining === 0
                    // Get file name - handle both object and array cases, and check multiple possible field names
                    const fileData = Array.isArray(item.files) ? item.files[0] : item.files
                    // Ensure we get the actual file name, not File ID or Unknown
                    // Get file name - ensure we always have the actual file name
                    const fileName = fileData?.file_name || fileData?.name || (item.files ? 'File name unavailable' : 'Loading...')
                    const fileUrl = getFileUrl(fileData)
                    return (
                      <li key={item.share_id} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150'>
                        <div className='flex items-start justify-between'>
                          <div className='flex items-start gap-3 flex-1'>
                            <div className='p-2 bg-blue-50 rounded-lg mt-1'>
                              <FileText className='w-4 h-4 text-blue-600' />
                            </div>
                            <div className='flex-1'>
                              <p className='font-semibold text-slate-800 mb-1'>
                                {fileName}
                              </p>
                              <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                                <span>Shared with: {item.shared_with_email}</span>
                                <span>•</span>
                                <span>{item.permission_level}</span>
                                <span>•</span>
                                <span className='flex items-center gap-1'>
                                  <Clock className='w-3 h-3' />
                                  <span>{formatDate(item.created_at)}</span>
                                </span>
                                {daysRemaining !== null && (
                                  <>
                                    <span>•</span>
                                    <span className={`font-semibold ${
                                      isExpired ? 'text-red-600' :
                                      daysRemaining <= 3 ? 'text-red-600' : 
                                      daysRemaining <= 7 ? 'text-yellow-600' : 
                                      'text-green-600'
                                    }`}>
                                      {isExpired ? 'Expired' : `${daysRemaining} days left`}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            {fileUrl && (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className='p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors'
                                title='View file'
                              >
                                <ExternalLink className='w-4 h-4' />
                              </a>
                            )}
                            <button 
                              onClick={() => handleRevokeAccess(item.share_id, fileName)}
                              className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                              title='Revoke access'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )
            ) : (
              sharedWithMe.length === 0 ? (
                <div className='px-6 py-12 text-center text-slate-400'>
                  <Users className='w-12 h-12 mx-auto mb-3 opacity-50' />
                  <p>No files have been shared with you yet</p>
                </div>
              ) : (
                <ul className='divide-y divide-slate-100'>
                  {sharedWithMe.map((item) => {
                    const daysRemaining = calculateDaysRemaining(item.expires_at)
                    const isExpired = daysRemaining === 0
                    // Get file data - handle both object and array cases
                    const fileData = Array.isArray(item.files) ? item.files[0] : item.files
                    // Ensure we get the actual file name, not File ID or Unknown
                    // Get file name - ensure we always have the actual file name
                    const fileName = fileData?.file_name || fileData?.name || (item.files ? 'File name unavailable' : 'Loading...')
                    const fileUrl = getFileUrl(fileData)
                    
                    return (
                      <li key={item.share_id} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150'>
                        <div className='flex items-start justify-between'>
                          <div className='flex items-start gap-3 flex-1'>
                            <div className='p-2 bg-green-50 rounded-lg mt-1'>
                              <FileText className='w-4 h-4 text-green-600' />
                            </div>
                            <div className='flex-1'>
                              <p className='font-semibold text-slate-800 mb-1'>
                                {fileName}
                              </p>
                              <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                                <span>{item.permission_level} access</span>
                                <span>•</span>
                                <span className='flex items-center gap-1'>
                                  <Clock className='w-3 h-3' />
                                  <span>{formatDate(item.created_at)}</span>
                                </span>
                                {daysRemaining !== null && !isExpired && (
                                  <>
                                    <span>•</span>
                                    <span className={`font-semibold ${
                                      daysRemaining <= 3 ? 'text-red-600' : 
                                      daysRemaining <= 7 ? 'text-yellow-600' : 
                                      'text-green-600'
                                    }`}>
                                      {daysRemaining} days left
                                    </span>
                                  </>
                                )}
                                {isExpired && (
                                  <>
                                    <span>•</span>
                                    <span className='font-semibold text-red-600'>Expired</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          {!isExpired && fileUrl && (
                            <div className='flex items-center gap-2'>
                              {/* Always show View button for all permission levels */}
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={async () => {
                                  // Log view action for shared files
                                  try {
                                    await logActivity('view', fileName, fileData?.file_id, { 
                                      source: 'shared_file',
                                      shared_by: item.owner_id
                                    })
                                  } catch (activityError) {
                                    console.warn('Failed to log view activity (non-critical):', activityError)
                                  }
                                }}
                                className='px-3 py-1.5 text-sm bg-[#7A1C1C] text-white rounded-lg hover:bg-[#5a1515] transition-colors'
                                title='View file'
                              >
                                View
                              </a>
                              {/* Show Download button for non-View permissions */}
                              {item.permission_level !== 'View' && (
                                <a 
                                  href={fileUrl}
                                  download={fileName}
                                  onClick={async () => {
                                    // Log download action for shared files
                                    try {
                                      await logActivity('download', fileName, fileData?.file_id, { 
                                        source: 'shared_file',
                                        shared_by: item.owner_id
                                      })
                                    } catch (activityError) {
                                      console.warn('Failed to log download activity (non-critical):', activityError)
                                    }
                                  }}
                                  className='px-3 py-1.5 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors'
                                >
                                  Download
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )
            )}
          </div>
        </div>
      </section>

      {showShareModal && (
        <ShareAccessModal 
          onClose={() => setShowShareModal(false)} 
          onShare={handleShare}
        />
      )}
    </div>
  )
}
