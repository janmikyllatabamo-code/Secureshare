import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUpload } from './FileUpload'
import { CreateFolderModal } from './CreateFolderModal'
import { SecuritySettingsModal } from './SecuritySettingsModal'
import { Upload, FolderPlus, Share2, Settings, FileText, Clock, Trash2, Users, TrendingUp, Folder, Image, FileSpreadsheet, Download, Edit, RefreshCw, Eye, Copy, Move, XCircle, X, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const Portal = () => {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [showSecuritySettingsModal, setShowSecuritySettingsModal] = useState(false)
  const [userName, setUserName] = useState('Student')
  const [stats, setStats] = useState({ totalFiles: 0, folders: 0, shared: 0, trashed: 0 })
  const [recentFiles, setRecentFiles] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all files count
      const { count: totalFiles } = await supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_trashed', false)
        .eq('is_folder', false)

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

      // Fetch trashed files count
      const { count: trashed } = await supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_trashed', true)

      setStats({
        totalFiles: totalFiles || 0,
        folders: folders || 0,
        shared: shared || 0,
        trashed: trashed || 0
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

      // Fetch recent activity from activity_log
      const { data: activities } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (activities) {
        setRecentActivity(activities.map(a => ({
          id: a.activity_id,
          type: a.action_type,
          fileName: a.file_name,
          time: new Date(a.created_at),
          details: a.details
        })))
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Get user name from localStorage
    const authUser = localStorage.getItem('authUser')
    if (authUser) {
      try {
        const user = JSON.parse(authUser)
        setUserName(user.fullName || user.email?.split('@')[0] || 'Student')
      } catch (e) {
        console.error('Error parsing user info:', e)
      }
    }
    
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
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getFileIcon = (ext) => {
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp']
    const sheetExts = ['xls', 'xlsx', 'csv']
    
    if (imageExts.includes(ext)) return <Image className='w-4 h-4 text-green-600' />
    if (sheetExts.includes(ext)) return <FileSpreadsheet className='w-4 h-4 text-emerald-600' />
    return <FileText className='w-4 h-4 text-red-600' />
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'upload':
        return <Upload className='w-3 h-3 text-green-600' />
      case 'download':
        return <Download className='w-3 h-3 text-blue-600' />
      case 'delete':
        return <Trash2 className='w-3 h-3 text-red-600' />
      case 'share':
        return <Share2 className='w-3 h-3 text-purple-600' />
      case 'create_folder':
        return <FolderPlus className='w-3 h-3 text-yellow-600' />
      case 'restore':
        return <RefreshCw className='w-3 h-3 text-teal-600' />
      case 'rename':
        return <Edit className='w-3 h-3 text-orange-600' />
      case 'view':
        return <Eye className='w-3 h-3 text-indigo-600' />
      case 'copy':
        return <Copy className='w-3 h-3 text-cyan-600' />
      case 'move':
        return <Move className='w-3 h-3 text-pink-600' />
      case 'permanent_delete':
        return <XCircle className='w-3 h-3 text-red-700' />
      case 'revoke_share':
        return <X className='w-3 h-3 text-red-600' />
      case 'empty_trash':
        return <Trash2 className='w-3 h-3 text-red-700' />
      case 'enrolled':
        return <BookOpen className='w-3 h-3 text-blue-600' />
      default:
        return <Clock className='w-3 h-3 text-slate-600' />
    }
  }

  const getActivityText = (type) => {
    switch (type) {
      case 'upload': return 'Uploaded'
      case 'download': return 'Downloaded'
      case 'delete': return 'Deleted'
      case 'share': return 'Shared'
      case 'create_folder': return 'Created folder'
      case 'restore': return 'Restored'
      case 'rename': return 'Renamed'
      case 'view': return 'Viewed'
      case 'copy': return 'Copied'
      case 'move': return 'Moved'
      case 'permanent_delete': return 'Permanently deleted'
      case 'revoke_share': return 'Revoked share access'
      case 'empty_trash': return 'Emptied trash'
      case 'enrolled': return 'Enrolled in'
      default: return 'Modified'
    }
  }

  const getActivityBgColor = (type) => {
    switch (type) {
      case 'upload': return 'bg-green-100'
      case 'download': return 'bg-blue-100'
      case 'delete': return 'bg-red-100'
      case 'share': return 'bg-purple-100'
      case 'create_folder': return 'bg-yellow-100'
      case 'restore': return 'bg-teal-100'
      case 'rename': return 'bg-orange-100'
      case 'view': return 'bg-indigo-100'
      case 'copy': return 'bg-cyan-100'
      case 'move': return 'bg-pink-100'
      case 'permanent_delete': return 'bg-red-200'
      case 'revoke_share': return 'bg-red-100'
      case 'empty_trash': return 'bg-red-200'
      case 'enrolled': return 'bg-blue-100'
      default: return 'bg-slate-100'
    }
  }

  const handleCreateFolder = async (folderName) => {
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
      navigate('/portal/files')
    } catch (err) {
      console.error('Create folder error:', err)
      alert(`Failed to create folder: ${err.message}`)
    }
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
            <li onClick={() => navigate('/portal/files')} className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Total Files</p>
                <FileText className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>
                {loading ? '...' : stats.totalFiles}
              </span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-green-600' />
                <span className='text-green-600 font-medium'>Your uploaded files</span>
              </p>
            </li>
            <li onClick={() => navigate('/portal/files')} className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Folders</p>
                <Folder className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>
                {loading ? '...' : stats.folders}
              </span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-green-600' />
                <span className='text-green-600 font-medium'>Organized folders</span>
              </p>
            </li>
            <li onClick={() => navigate('/portal/shared')} className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Shared</p>
                <Users className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>
                {loading ? '...' : stats.shared}
              </span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-green-600' />
                <span className='text-green-600 font-medium'>Files shared</span>
              </p>
            </li>
            <li onClick={() => navigate('/portal/trash')} className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Trash</p>
                <Trash2 className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>
                {loading ? '...' : stats.trashed}
              </span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-yellow-600' />
                <span className='text-yellow-600 font-medium'>In trash</span>
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
              <p className='text-xs text-slate-500 ml-11'>Images, PDF, Word, Excel, PPT</p>
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
              onClick={() => navigate('/portal/shared')}
              className='bg-gradient-to-br from-white to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#7A1C1C] group'
            >
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg shadow-md group-hover:shadow-lg transition-shadow'>
                  <Share2 className='w-5 h-5 text-white' />
                </div>
                <p className='font-semibold text-slate-800'>Share Files</p>
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
              {loading ? (
                <div className='px-6 py-12 text-center text-slate-400'>
                  <div className='animate-spin w-8 h-8 border-2 border-[#7A1C1C] border-t-transparent rounded-full mx-auto mb-3'></div>
                  Loading...
                </div>
              ) : recentFiles.length === 0 ? (
                <div className='px-6 py-12 text-center text-slate-400'>
                  <FileText className='w-12 h-12 mx-auto mb-3 opacity-50' />
                  <p>No files yet</p>
                  <button onClick={() => setShowUploadModal(true)} className='mt-3 text-[#7A1C1C] hover:underline text-sm'>
                    Upload your first file
                  </button>
                </div>
              ) : (
                <ul className='divide-y divide-slate-100'>
                  {recentFiles.map((file) => (
                    <li key={file.id} onClick={() => navigate(`/portal/files?q=${encodeURIComponent(`${file.name}.${file.ext}`)}`)} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-start gap-3 flex-1'>
                          <div className='p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors mt-1'>
                            {getFileIcon(file.ext)}
                          </div>
                          <div className='flex-1'>
                            <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                              {file.name}<span className='text-slate-500 font-normal'>.{file.ext}</span>
                            </p>
                            <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                              <span>{file.sizeMB.toFixed(2)} MB</span>
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
              )}
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
            <div className='overflow-y-auto h-full max-h-[440px]'>
              {loading ? (
                <div className='px-6 py-12 text-center text-slate-400'>
                  <div className='animate-spin w-6 h-6 border-2 border-[#7A1C1C] border-t-transparent rounded-full mx-auto mb-3'></div>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className='px-6 py-8'>
                  <div className='flex flex-col items-center justify-center h-full text-center text-slate-400'>
                    <Clock className='w-12 h-12 mb-3 opacity-50' />
                    <p className='text-sm'>No recent activity</p>
                    <p className='text-xs mt-1'>Upload a file to get started</p>
                  </div>
                </div>
              ) : (
                <ul className='divide-y divide-slate-100'>
                  {recentActivity.map((activity) => (
                    <li key={activity.id} className='px-6 py-4 hover:bg-slate-50 transition-colors'>
                      <div className='flex items-start gap-3'>
                        <div className={`p-2 rounded-full ${getActivityBgColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm text-slate-700'>
                            <span className='font-medium'>{getActivityText(activity.type)}</span>
                            {' '}
                            <span className='text-slate-600 truncate block'>{activity.fileName}</span>
                          </p>
                          <p className='text-xs text-slate-400 mt-1'>{formatRelative(activity.time)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      {showUploadModal && (
        <FileUpload onClose={() => setShowUploadModal(false)} />
      )}
      {showCreateFolderModal && (
        <CreateFolderModal onClose={() => setShowCreateFolderModal(false)} onCreate={handleCreateFolder} />
      )}
      {showSecuritySettingsModal && (
        <SecuritySettingsModal onClose={() => setShowSecuritySettingsModal(false)} onSave={(settings) => {
          localStorage.setItem('settings:linkExpiryDays', String(settings.linkExpiry || 7))
        }} />
      )}
  </header>
  )
}
