import React, { useState, useEffect, useCallback } from 'react'
import { Share2, Users, FileText, Clock, X, Mail, UserPlus, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// Share Modal Component
const ShareModal = ({ onClose, onShare, userFiles }) => {
  const [emails, setEmails] = useState('')
  const [permission, setPermission] = useState('View')
  const [selectedFileId, setSelectedFileId] = useState('')
  const [expiryDays, setExpiryDays] = useState(7)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const emailList = emails.split(',').map(e => e.trim()).filter(Boolean)
    if (emailList.length === 0) {
      setError('Enter at least one email')
      return
    }
    if (!selectedFileId) {
      setError('Please select a file to share')
      return
    }
    setError('')
    setLoading(true)
    await onShare({ emails: emailList, permission, fileId: selectedFileId, expiryDays })
    setLoading(false)
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
            <h2 className="text-lg font-bold text-slate-800">Share File</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100">
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* File Selection */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Select File <span className='text-red-500'>*</span>
            </label>
            <select
              value={selectedFileId}
              onChange={(e) => setSelectedFileId(e.target.value)}
              className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7A1C1C]'
            >
              <option value="">Choose a file...</option>
              {userFiles.map(file => (
                <option key={file.file_id} value={file.file_id}>
                  {file.file_name}
                </option>
              ))}
            </select>
            {userFiles.length === 0 && (
              <p className='mt-1 text-xs text-amber-600'>No files available. Upload a file first.</p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Share with (Email) <span className='text-red-500'>*</span>
            </label>
            <div className='flex items-center border rounded-lg px-3 py-2 border-slate-300 focus-within:border-[#7A1C1C]'>
              <Mail className='w-4 h-4 text-slate-400 mr-2' />
              <input
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="email@example.com, another@example.com"
                className='w-full outline-none text-sm'
              />
            </div>
            <p className='mt-1 text-xs text-slate-500'>Separate multiple emails with commas</p>
          </div>

          {/* Permission Level */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>Permission Level</label>
            <div className='flex items-center gap-2'>
              <UserPlus className='w-4 h-4 text-slate-400' />
              <select 
                value={permission} 
                onChange={(e) => setPermission(e.target.value)} 
                className='border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7A1C1C] w-full'
              >
                <option value='View'>View Only</option>
                <option value='Download'>View & Download</option>
                <option value='Edit'>Full Access</option>
              </select>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>Link Expires In</label>
            <select 
              value={expiryDays} 
              onChange={(e) => setExpiryDays(Number(e.target.value))} 
              className='border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7A1C1C] w-full'
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={0}>Never</option>
            </select>
          </div>

          {error && <p className='text-xs text-red-600 bg-red-50 p-2 rounded'>{error}</p>}
        </form>

        <div className='flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50'>
          <button onClick={onClose} type='button' className='px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white transition-colors'>
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || userFiles.length === 0}
            className='px-4 py-2 text-sm rounded-lg text-white bg-[#7A1C1C] hover:bg-[#5a1515] transition-colors disabled:opacity-50'
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const SharedPage = () => {
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharedItems, setSharedItems] = useState([])
  const [sharedWithMe, setSharedWithMe] = useState([])
  const [userFiles, setUserFiles] = useState([])
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

      // Fetch user's files (for sharing)
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_trashed', false)
        .eq('is_folder', false)
      
      setUserFiles(files || [])

      // Fetch shares created by user
      const { data: myShares } = await supabase
        .from('shared_access')
        .select(`
          *,
          files (*)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      setSharedItems(myShares || [])

      // Fetch files shared with me
      const { data: sharedToMe } = await supabase
        .from('shared_access')
        .select(`
          *,
          files (*)
        `)
        .or(`shared_with_id.eq.${user.id},shared_with_email.eq.${user.email}`)
        .order('created_at', { ascending: false })

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

  const handleShare = async ({ emails, permission, fileId, expiryDays }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const expiresAt = expiryDays > 0 
        ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
        : null

      // Get file name for activity log
      const file = userFiles.find(f => f.file_id === fileId)
      const fileName = file?.file_name || 'Unknown file'

      // Create share records for each email
      const shareRecords = emails.map(email => ({
        file_id: fileId,
        owner_id: user.id,
        shared_with_email: email,
        permission_level: permission,
        expires_at: expiresAt
      }))

      const { error } = await supabase.from('shared_access').insert(shareRecords)
      
      if (error) {
        console.error('Error sharing:', error)
        return
      }

      // Log activity
      await logActivity('share', fileName, fileId, { 
        shared_with: emails, 
        permission,
        expires_in: expiryDays > 0 ? `${expiryDays} days` : 'never'
      })

      fetchData()
      window.dispatchEvent(new Event('app:shared:updated'))
      window.dispatchEvent(new Event('app:files:updated'))
    } catch (err) {
      console.error('Share error:', err)
    }
  }

  const handleRevokeAccess = async (shareId, fileName) => {
    if (!window.confirm('Are you sure you want to revoke this access?')) return
    
    try {
      await supabase.from('shared_access').delete().eq('share_id', shareId)
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
    const { data } = supabase.storage.from(file.bucket).getPublicUrl(file.file_path)
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
                    return (
                      <li key={item.share_id} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150'>
                        <div className='flex items-start justify-between'>
                          <div className='flex items-start gap-3 flex-1'>
                            <div className='p-2 bg-blue-50 rounded-lg mt-1'>
                              <FileText className='w-4 h-4 text-blue-600' />
                            </div>
                            <div className='flex-1'>
                              <p className='font-semibold text-slate-800 mb-1'>
                                {item.files?.file_name || 'Unknown file'}
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
                          <button 
                            onClick={() => handleRevokeAccess(item.share_id, item.files?.file_name)}
                            className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                            title='Revoke access'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
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
                    const fileUrl = getFileUrl(item.files)
                    
                    return (
                      <li key={item.share_id} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150'>
                        <div className='flex items-start justify-between'>
                          <div className='flex items-start gap-3 flex-1'>
                            <div className='p-2 bg-green-50 rounded-lg mt-1'>
                              <FileText className='w-4 h-4 text-green-600' />
                            </div>
                            <div className='flex-1'>
                              <p className='font-semibold text-slate-800 mb-1'>
                                {item.files?.file_name || 'Unknown file'}
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
                              {item.permission_level !== 'View' && (
                                <a 
                                  href={fileUrl}
                                  download
                                  className='px-3 py-1.5 text-sm bg-[#7A1C1C] text-white rounded-lg hover:bg-[#5a1515] transition-colors'
                                >
                                  Download
                                </a>
                              )}
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className='p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors'
                                title='Open in new tab'
                              >
                                <ExternalLink className='w-4 h-4' />
                              </a>
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
        <ShareModal 
          onClose={() => setShowShareModal(false)} 
          onShare={handleShare}
          userFiles={userFiles}
        />
      )}
    </div>
  )
}
