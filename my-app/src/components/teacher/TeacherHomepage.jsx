// Teacher Homepage - Identical to Student Portal Homepage
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUpload } from '../portal/FileUpload'
import { CreateFolderModal } from '../portal/CreateFolderModal'
import { ShareAccessModal } from '../portal/ShareAccessModal'
import { SecuritySettingsModal } from '../portal/SecuritySettingsModal'
import { Upload, FolderPlus, Share2, Settings, FileText, Clock, Download, Users, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const TeacherHomepage = () => {
  // State to control upload modal visibility
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showShareAccessModal, setShowShareAccessModal] = useState(false);
  const [showSecuritySettingsModal, setShowSecuritySettingsModal] = useState(false);
  const [userName, setUserName] = useState('Teacher');
  const [stats, setStats] = useState({ totalFiles: 0, uploaded: 0, downloaded: 0, sharedWith: 0 })
  const [recentFiles, setRecentFiles] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // Get user name from localStorage
    const authUser = localStorage.getItem('authUser');
    if (authUser) {
      try {
        const user = JSON.parse(authUser);
        setUserName(user.fullName || user.email?.split('@')[0] || 'Teacher');
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
  }, []);

  // Fetch dashboard data from Supabase
  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch total files count
      const { count: totalFiles } = await supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_trashed', false)

      // Fetch folders count
      const { count: folders } = await supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_trashed', false)
        .eq('is_folder', true)

      // Fetch shared files count
      const { count: shared } = await supabase
        .from('shared_access')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)

      // Fetch download count from activity_log
      const { count: downloaded } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action_type', 'download')

      setStats({
        totalFiles: totalFiles || 0,
        uploaded: totalFiles || 0,
        downloaded: downloaded || 0,
        sharedWith: shared || 0
      })

      // Fetch recent files
      const { data: recent, error: recentError } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_trashed', false)
        .eq('is_folder', false)
        .order('created_at', { ascending: false })
        .limit(8)

      if (recentError) {
        console.error('Error fetching recent files:', recentError)
      }

      if (recent) {
        const transformedFiles = recent.map(file => {
          const nameParts = file.file_name.split('.')
          const ext = nameParts.length > 1 ? nameParts.pop() : ''
          const name = nameParts.join('.')
          const { data: urlData } = supabase.storage.from(file.bucket).getPublicUrl(file.file_path)
          
          return {
            id: file.file_id,
            name: name,
            ext: ext.toLowerCase(),
            sizeMB: file.file_size / (1024 * 1024),
            updatedAt: new Date(file.updated_at),
            url: urlData?.publicUrl || ''
          }
        })
        setRecentFiles(transformedFiles)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Listen for file updates
  useEffect(() => {
    const handleFilesUpdated = () => {
      fetchDashboardData()
    }
    window.addEventListener('app:files:updated', handleFilesUpdated)
    window.addEventListener('app:shared:updated', handleFilesUpdated)
    return () => {
      window.removeEventListener('app:files:updated', handleFilesUpdated)
      window.removeEventListener('app:shared:updated', handleFilesUpdated)
    }
  }, [fetchDashboardData])

  const formatRelative = (date) => {
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return 'today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    const diffWeeks = Math.floor(diffDays / 7)
    if (diffWeeks === 1) return '1 week ago'
    if (diffWeeks < 5) return `${diffWeeks} weeks ago`
    return date.toLocaleDateString()
  }

  return (
    <header>
      <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen m-0 p-0'>
        {/* Welcome Section */}
        <div className='px-6 lg:px-12 pt-8 pb-6'>
          <div className='mb-2'>
            <h1 className='text-4xl lg:text-5xl font-bold text-slate-800 mb-2'>
              Welcome Back, <span className='text-[#7A1C1C]'>{userName}!</span>
            </h1>
            <p className='text-slate-600 text-base lg:text-lg font-medium'>
              Your secure workspace for academic collaboration
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='px-6 lg:px-12 mb-8'>
          <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
            <li onClick={() => navigate('/teacher-dashboard/files')} className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Total Files</p>
                <FileText className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{stats.totalFiles}</span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-green-600' />
                <span className='text-green-600 font-medium'>+3 this week</span>
              </p>
            </li>
            <li onClick={() => navigate('/teacher-dashboard/files')} className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Uploaded</p>
                <Upload className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{stats.uploaded}</span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-green-600' />
                <span className='text-green-600 font-medium'>+3 this week</span>
              </p>
            </li>
            <li onClick={() => navigate('/teacher-dashboard/files')} className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Downloaded</p>
                <Download className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{stats.downloaded}</span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-green-600' />
                <span className='text-green-600 font-medium'>+3 this week</span>
              </p>
            </li>
            <li onClick={() => navigate('/teacher-dashboard/shared')} className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Shared With</p>
                <Users className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{stats.sharedWith}</span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-green-600' />
                <span className='text-green-600 font-medium'>+3 this week</span>
              </p>
            </li>
          </ul>
        </div>

        {/* Quick Actions Section */}
        <div className='px-6 lg:px-12 mb-8'>
          <h2 className='text-2xl lg:text-3xl font-bold text-slate-800 mb-6'>Quick Actions</h2>

          <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
            <li 
              onClick={() => setShowUploadModal(true)}
              className='bg-gradient-to-br from-white to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#7A1C1C] group'
            >
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg shadow-md group-hover:shadow-lg transition-shadow'>
                  <Upload className='w-5 h-5 text-white' />
                </div>
                <p className='font-semibold text-slate-800'>Upload a file</p>
              </div>
              <p className='text-xs text-slate-500 ml-11'>.DOCX, .PDF, .PPTX, .JPG, .PNG</p>
            </li>
            <li onClick={() => setShowCreateFolderModal(true)} className='bg-gradient-to-br from-white to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#7A1C1C] group'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg shadow-md group-hover:shadow-lg transition-shadow'>
                  <FolderPlus className='w-5 h-5 text-white' />
                </div>
                <p className='font-semibold text-slate-800'>Create a folder</p>
              </div>
              <p className='text-xs text-slate-500 ml-11'>Organize your files</p>
            </li>
            <li 
              onClick={() => setShowShareAccessModal(true)}
              className='bg-gradient-to-br from-white to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#7A1C1C] group'
            >
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg shadow-md group-hover:shadow-lg transition-shadow'>
                  <Share2 className='w-5 h-5 text-white' />
                </div>
                <p className='font-semibold text-slate-800'>Share Access</p>
              </div>
              <p className='text-xs text-slate-500 ml-11'>Collaborate with others</p>
            </li>
            <li onClick={() => setShowSecuritySettingsModal(true)} className='bg-gradient-to-br from-white to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#7A1C1C] group'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg shadow-md group-hover:shadow-lg transition-shadow'>
                  <Settings className='w-5 h-5 text-white' />
                </div>
                <p className='font-semibold text-slate-800'>Security Settings</p>
              </div>
              <p className='text-xs text-slate-500 ml-11'>Manage permissions</p>
            </li>
          </ul>
        </div>

        {/* Main Content Section */}
        <section className='flex flex-col lg:flex-row gap-6 px-6 lg:px-12 pb-12'>
          {/* Recent Files Card */}
          <div className='w-full lg:flex-1 h-auto lg:h-[500px] rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
            <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
              <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
                <FileText className='w-5 h-5 text-[#7A1C1C]' />
                Recent Files
              </h2>
            </div>
            <div className='overflow-y-auto h-full max-h-[440px]'>
              <ul className='divide-y divide-slate-100'>
                {recentFiles.length === 0 && (
                  <li className='px-6 py-8 text-center text-slate-400'>No files yet</li>
                )}
                {recentFiles.map((file) => (
                  <li key={file.id} onClick={() => navigate(`/teacher-dashboard/files?q=${encodeURIComponent(`${file.name}.${file.ext}`)}`)} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start gap-3 flex-1'>
                        <div className='p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors mt-1'>
                          <FileText className='w-4 h-4 text-red-600' />
                        </div>
                        <div className='flex-1'>
                          <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                            {file.name}<span className='text-slate-500 font-normal'>.{file.ext}</span>
                          </p>
                          <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                            <span>{Number(file.sizeMB || 0).toFixed(1)} MB</span>
                            <span>•</span>
                            <span className='flex items-center gap-1'>
                              <Clock className='w-3 h-3' />
                              <span>{formatRelative(file.updatedAt)}</span>
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className='w-full lg:w-96 h-auto lg:h-[500px] rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
            <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
              <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
                <Clock className='w-5 h-5 text-[#7A1C1C]' />
                Recent Activity
              </h2>
            </div>
            <div className='px-6 py-8'>
              <div className='flex flex-col items-center justify-center h-full text-center text-slate-400'>
                <Clock className='w-12 h-12 mb-3 opacity-50' />
                <p className='text-sm'>No recent activity</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* File upload modal - shown when showUploadModal is true */}
      {showUploadModal && (
        <FileUpload onClose={() => setShowUploadModal(false)} />
      )}
      {showCreateFolderModal && (
        <CreateFolderModal onClose={() => setShowCreateFolderModal(false)} onCreate={async (folderName) => {
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
              console.error('User not authenticated')
              return
            }

            // Use the create_folder function to create folder in database
            const { data: folderRecord, error: folderError } = await supabase.rpc('create_folder', {
              p_user_id: user.id,
              p_folder_name: folderName,
              p_parent_folder_path: '', // Root level folder
              p_bucket: 'files'
            })

            if (folderError) {
              console.error('Error creating folder:', folderError)
              alert(`Failed to create folder: ${folderError.message}`)
              return
            }

            // Log activity
            try {
              await supabase.from('activity_log').insert({
                user_id: user.id,
                action_type: 'create_folder',
                file_name: folderName,
                file_id: folderRecord?.file_id || null,
                details: { 
                  folder_path: folderRecord?.file_path || '',
                  parent: 'root'
                }
              })
            } catch (activityError) {
              console.warn('Failed to log activity (non-critical):', activityError)
            }

            // Refresh dashboard and dispatch event
            fetchDashboardData()
            window.dispatchEvent(new Event('app:files:updated'))
          } catch (err) {
            console.error('Create folder error:', err)
            alert(`Failed to create folder: ${err.message}`)
          }
        }} />
      )}
      {showShareAccessModal && (
        <ShareAccessModal onClose={() => setShowShareAccessModal(false)} onShare={({ emails, file }) => {
          const authUserRaw = localStorage.getItem('authUser')
          const authUser = authUserRaw ? JSON.parse(authUserRaw) : { role: 'Teacher', email: '' }
          const key = authUser.role === 'Teacher' ? 'Teacher' : (authUser.email || 'Student')
          const sharedKey = `shared:list:${key}`
          const stored = localStorage.getItem(sharedKey)
          const list = stored ? JSON.parse(stored) : []
          const days = Number(localStorage.getItem('settings:linkExpiryDays') || '7')
          const now = new Date()
          const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
          const name = file.name.split('.')[0]
          const extension = `.${file.name.split('.').pop()}`
          const item = {
            id: Date.now(),
            name,
            extension,
            sharedBy: authUser.email || 'You',
            sharedDate: 'today',
            recipients: emails,
            expiryDate: expiry.toISOString()
          }
          localStorage.setItem(sharedKey, JSON.stringify([item, ...list]))
          const ownerNotifKey = key ? `notifications:${key}` : 'notifications:Student'
          const ownerStored = localStorage.getItem(ownerNotifKey)
          const ownerList = ownerStored ? JSON.parse(ownerStored) : []
          const ownerNotif = { title: 'Access shared', message: `${name}${extension} shared with ${emails.length} recipient(s)`, time: 'just now', read: false }
          localStorage.setItem(ownerNotifKey, JSON.stringify([ownerNotif, ...ownerList]))
          window.dispatchEvent(new Event('app:shared:updated'))
          emails.forEach((email) => {
            const destKey = `notifications:${email}`
            const dStored = localStorage.getItem(destKey)
            const dList = dStored ? JSON.parse(dStored) : []
            const notif = { title: 'New file shared', message: `${authUser.email || 'User'} shared ${name}${extension} with you`, time: 'just now', read: false }
            localStorage.setItem(destKey, JSON.stringify([notif, ...dList]))
          })
        }} />
      )}
      {showSecuritySettingsModal && (
        <SecuritySettingsModal onClose={() => setShowSecuritySettingsModal(false)} onSave={() => {}} />
      )}
    </header>
  )
}
