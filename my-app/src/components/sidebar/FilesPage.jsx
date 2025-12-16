import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Upload, FolderPlus, FileText, Clock, Move, Pencil, Trash2, Download, Folder, Image, FileSpreadsheet, Presentation, ChevronRight } from 'lucide-react'
import { FilePreviewModal } from '../portal/FilePreviewModal'
import { FileUpload } from '../portal/FileUpload'
import { CreateFolderModal } from '../portal/CreateFolderModal'
import { supabase } from '../../lib/supabase'

export const FilesPage = () => {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-new')
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetFile: null, showMoveSubmenu: false })
  const [clipboard, setClipboard] = useState({ file: null, mode: null })
  const [previewFile, setPreviewFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const menuRef = useRef(null)
  const moveSubmenuRef = useRef(null)
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([]) // Store folders separately for Move submenu
  const [currentPath, setCurrentPath] = useState('')
  const [currentFolderName, setCurrentFolderName] = useState('')
  const location = useLocation()

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

  // Fetch files from Supabase
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_trashed', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching files:', error)
        return
      }

      // Transform data to match component structure
      // Use Promise.all to generate signed URLs for all files
      const transformedFiles = await Promise.all((data || []).map(async (file) => {
        const nameParts = file.file_name.split('.')
        const ext = file.is_folder ? 'folder' : (nameParts.length > 1 ? nameParts.pop() : '')
        const name = file.is_folder ? file.file_name : nameParts.join('.')
        
        // For folders, no URL needed
        if (file.is_folder) {
          return {
            id: file.file_id,
            name: name,
            ext: ext.toLowerCase(),
            sizeMB: file.file_size / (1024 * 1024),
            updatedAt: new Date(file.updated_at),
            path: file.file_path,
            url: '',
            bucket: file.bucket,
            parentPath: file.folder_path || '',
            fullPath: file.file_path,
            isFolder: file.is_folder,
            fileId: file.file_id
          }
        }
        
        // For files, generate signed URL (works for private buckets)
        let fileUrl = ''
        try {
          // Try signed URL first (required for private buckets)
          const { data: signedData, error: signedError } = await supabase.storage
            .from(file.bucket || 'files')
            .createSignedUrl(file.file_path, 3600) // 1 hour expiration
          
          if (!signedError && signedData?.signedUrl) {
            fileUrl = signedData.signedUrl
          } else {
            // Fallback to public URL if bucket is public
            const { data: urlData } = supabase.storage
              .from(file.bucket || 'files')
              .getPublicUrl(file.file_path)
            fileUrl = urlData?.publicUrl || ''
          }
        } catch (urlError) {
          console.error('Error generating file URL:', urlError, { bucket: file.bucket, path: file.file_path })
          // Continue with empty URL - will be generated on demand
        }
        
        return {
          id: file.file_id,
          name: name,
          ext: ext.toLowerCase(),
          sizeMB: file.file_size / (1024 * 1024),
          updatedAt: new Date(file.updated_at),
          path: file.file_path,
          url: fileUrl,
          bucket: file.bucket || 'files',
          parentPath: file.folder_path || '',
          fullPath: file.file_path,
          isFolder: file.is_folder,
          fileId: file.file_id
        }
      }))

      setFiles(transformedFiles)
      
      // Separate folders for Move submenu
      const folderList = transformedFiles.filter(f => f.ext === 'folder')
      setFolders(folderList)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Listen for file updates
  useEffect(() => {
    const handleFilesUpdated = () => {
      fetchFiles()
    }
    window.addEventListener('app:files:updated', handleFilesUpdated)
    return () => window.removeEventListener('app:files:updated', handleFilesUpdated)
  }, [fetchFiles])

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

  const getFileIcon = (ext) => {
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
    const docExts = ['doc', 'docx', 'pdf', 'txt']
    const sheetExts = ['xls', 'xlsx', 'csv']
    const presentationExts = ['ppt', 'pptx']
    
    if (ext === 'folder') return <Folder className='w-4 h-4 text-yellow-600' />
    if (imageExts.includes(ext)) return <Image className='w-4 h-4 text-green-600' />
    if (sheetExts.includes(ext)) return <FileSpreadsheet className='w-4 h-4 text-emerald-600' />
    if (presentationExts.includes(ext)) return <Presentation className='w-4 h-4 text-orange-600' />
    return <FileText className='w-4 h-4 text-red-600' />
  }

  const filteredSortedFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let result = files.filter((f) => {
      const inFolder = (f.parentPath || '') === currentPath
      const matchesQuery = q
        ? `${f.name}.${f.ext}`.toLowerCase().includes(q)
        : true
      const matchesType = typeFilter === 'all' ? true : f.ext === typeFilter
      return inFolder && matchesQuery && matchesType
    })

    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'size-asc':
        result.sort((a, b) => a.sizeMB - b.sizeMB)
        break
      case 'size-desc':
        result.sort((a, b) => b.sizeMB - a.sizeMB)
        break
      case 'date-new':
        result.sort((a, b) => b.updatedAt - a.updatedAt)
        break
      case 'date-old':
        result.sort((a, b) => a.updatedAt - b.updatedAt)
        break
      default:
        break
    }
    // Put folders first
    result.sort((a, b) => {
      if (a.ext === 'folder' && b.ext !== 'folder') return -1
      if (a.ext !== 'folder' && b.ext === 'folder') return 1
      return 0
    })
    return result
  }, [files, searchQuery, typeFilter, sortBy, currentPath])

  useEffect(() => {
    const qs = new URLSearchParams(location.search)
    const q = qs.get('q') || ''
    setSearchQuery(q)
  }, [location.search])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setContextMenu((s) => ({ ...s, visible: false }))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu((s) => ({ ...s, visible: false }))
      }
    }
    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('scroll', handleClickOutside, true)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleClickOutside, true)
    }
  }, [contextMenu.visible])

  const onContextMenuFile = (e, file) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetFile: file })
  }

  const previewFileNow = async (file) => {
    if (file.ext === 'folder') return
    
    // If URL is missing or expired, generate a new signed URL
    let previewUrl = file.url
    if (!previewUrl && file.path && file.bucket) {
      try {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(file.bucket)
          .createSignedUrl(file.path, 3600) // 1 hour expiration
        
        if (!signedError && signedData?.signedUrl) {
          previewUrl = signedData.signedUrl
        } else {
          console.error('Error generating signed URL:', signedError)
          // Try public URL as fallback
          const { data: urlData } = supabase.storage
            .from(file.bucket)
            .getPublicUrl(file.path)
          previewUrl = urlData?.publicUrl || ''
        }
      } catch (error) {
        console.error('Error generating preview URL:', error)
      }
    }
    
    setPreviewFile({ 
      name: `${file.name}.${file.ext}`, 
      url: previewUrl, 
      ext: file.ext,
      path: file.path,
      bucket: file.bucket,
      fileId: file.fileId
    })
    // Log view action
    await logActivity('view', `${file.name}.${file.ext}`, file.fileId)
  }

  const handleDownload = async () => {
    const file = contextMenu.targetFile
    if (!file || !file.url) return
    
    try {
      const response = await fetch(file.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${file.name}.${file.ext}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      await logActivity('download', `${file.name}.${file.ext}`, file.fileId)
    } catch (err) {
      console.error('Download error:', err)
    }
    setContextMenu((s) => ({ ...s, visible: false }))
  }

  const handleCopy = () => {
    setClipboard({ file: contextMenu.targetFile, mode: 'copy' })
    setContextMenu((s) => ({ ...s, visible: false }))
  }

  const handleCut = () => {
    setClipboard({ file: contextMenu.targetFile, mode: 'cut' })
    setContextMenu((s) => ({ ...s, visible: false }))
  }

  const handlePaste = async () => {
    if (!clipboard.file) return
    const src = clipboard.file
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (clipboard.mode === 'copy') {
        // Create a copy in the database
        const newName = `${src.name} (copy)`
        const newPath = `${user.id}/${currentPath ? currentPath + '/' : ''}${Date.now()}_${newName}.${src.ext}`
        
        // Copy file in storage
        const { error: copyError } = await supabase.storage
          .from(src.bucket)
          .copy(src.path, newPath)
        
        if (!copyError) {
          const { data: newFile } = await supabase.from('files').insert({
            user_id: user.id,
            file_name: `${newName}.${src.ext}`,
            file_path: newPath,
            file_size: Math.round(src.sizeMB * 1024 * 1024),
            file_type: src.ext,
            folder_path: currentPath,
            bucket: src.bucket,
            is_folder: false
          }).select().single()
          
          // Log copy action
          if (newFile) {
            await logActivity('copy', `${newName}.${src.ext}`, newFile.file_id, { 
              original_file: `${src.name}.${src.ext}`,
              original_file_id: src.fileId,
              destination: currentPath || 'root'
            })
          }
        }
      } else if (clipboard.mode === 'cut') {
        // Move file - update folder_path
        // Get current folder_path from database
        const { data: currentFile } = await supabase
          .from('files')
          .select('folder_path')
          .eq('file_id', src.fileId)
          .single()
        
        const oldPath = currentFile?.folder_path || 'root'
        await supabase
          .from('files')
          .update({ folder_path: currentPath, updated_at: new Date().toISOString() })
          .eq('file_id', src.fileId)
        
        // Log move action
        const fileName = src.ext === 'folder' ? src.name : `${src.name}.${src.ext}`
        await logActivity('move', fileName, src.fileId, { 
          from: oldPath,
          to: currentPath || 'root'
        })
        
        setClipboard({ file: null, mode: null })
      }
      
      fetchFiles()
    } catch (err) {
      console.error('Paste error:', err)
    }
    setContextMenu((s) => ({ ...s, visible: false }))
  }

  const handleMoveToFolder = async (targetFolder) => {
    const file = contextMenu.targetFile
    if (!file) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current folder_path from database
      const { data: currentFile } = await supabase
        .from('files')
        .select('folder_path')
        .eq('file_id', file.fileId)
        .single()
      
      const oldPath = currentFile?.folder_path || 'root'
      // Use the folder's file_path as the destination folder_path
      // The folder's file_path is the full path to the folder itself
      const newPath = targetFolder.path || targetFolder.fullPath || ''
      
      await supabase
        .from('files')
        .update({ folder_path: newPath, updated_at: new Date().toISOString() })
        .eq('file_id', file.fileId)
      
      // Log move action
      const fileName = file.ext === 'folder' ? file.name : `${file.name}.${file.ext}`
      await logActivity('move', fileName, file.fileId, { 
        from: oldPath,
        to: newPath || 'root'
      })
      
      fetchFiles()
      window.dispatchEvent(new Event('app:files:updated'))
      setContextMenu({ visible: false, x: 0, y: 0, targetFile: null, showMoveSubmenu: false })
    } catch (err) {
      console.error('Move error:', err)
    }
  }

  const handleRename = async () => {
    const f = contextMenu.targetFile
    const newName = window.prompt('Rename file', f.name)
    if (newName && newName.trim() && newName.trim() !== f.name) {
      try {
        const fullName = f.ext === 'folder' ? newName.trim() : `${newName.trim()}.${f.ext}`
        await supabase
          .from('files')
          .update({ 
            file_name: fullName,
            updated_at: new Date().toISOString() 
          })
          .eq('file_id', f.fileId)
        
        await logActivity('rename', fullName, f.fileId, { old_name: f.name })
        fetchFiles()
        window.dispatchEvent(new Event('app:files:updated'))
      } catch (err) {
        console.error('Rename error:', err)
      }
    }
    setContextMenu((s) => ({ ...s, visible: false }))
  }

  const handleDelete = async () => {
    const f = contextMenu.targetFile
    try {
      // Soft delete - move to trash
      await supabase
        .from('files')
        .update({ 
          is_trashed: true, 
          trashed_at: new Date().toISOString() 
        })
        .eq('file_id', f.fileId)
      
      const fileName = f.ext === 'folder' ? f.name : `${f.name}.${f.ext}`
      await logActivity('delete', fileName, f.fileId)
      
      fetchFiles()
      window.dispatchEvent(new Event('app:files:updated'))
    } catch (err) {
      console.error('Delete error:', err)
    }
    setContextMenu((s) => ({ ...s, visible: false }))
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
        p_parent_folder_path: currentPath || '', // Use current path if in a folder
        p_bucket: 'files'
      })

      if (folderError) {
        console.error('Error creating folder:', folderError)
        alert(`Failed to create folder: ${folderError.message}`)
        return
      }

      // Log activity
      try {
        await logActivity('create_folder', folderName, folderRecord?.file_id, { 
          parent: currentPath || 'root',
          folder_path: folderRecord?.file_path || ''
        })
      } catch (activityError) {
        console.warn('Failed to log activity (non-critical):', activityError)
      }
      
      // Refresh files list and dispatch event
      fetchFiles()
      window.dispatchEvent(new Event('app:files:updated'))
    } catch (err) {
      console.error('Create folder error:', err)
      alert(`Failed to create folder: ${err.message}`)
    }
  }

  const navigateToFolder = (folder) => {
    setCurrentPath(folder.fullPath)
    setCurrentFolderName(folder.name)
  }

  const navigateUp = () => {
    if (!currentPath) return
    const parts = currentPath.split('/')
    parts.pop()
    setCurrentPath(parts.join('/'))
    setCurrentFolderName(parts.length > 0 ? parts[parts.length - 1].split('-')[0] : '')
  }

  // Build breadcrumb from current path
  const breadcrumbs = useMemo(() => {
    if (!currentPath) return []
    const parts = currentPath.split('/')
    return parts.map((part, idx) => ({
      name: part.split('-')[0], // Remove timestamp suffix
      path: parts.slice(0, idx + 1).join('/')
    }))
  }, [currentPath])

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-[calc(100vh-64px)] m-0 p-0'>
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <div className='flex items-center justify-between flex-wrap gap-3 mb-4'>
          <h1 className='text-3xl lg:text-4xl font-bold text-slate-800'>Files</h1>
          <div className='flex items-center gap-2'>
            <button onClick={() => setShowCreateFolderModal(true)} className='inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#7A1C1C] hover:text-[#7A1C1C] transition-colors'>
              <FolderPlus className='w-4 h-4' />
              <span>Create folder</span>
            </button>
            <button onClick={() => setShowUploadModal(true)} className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A1C1C] text-white hover:opacity-95 transition-opacity'>
              <Upload className='w-4 h-4' />
              <span>Upload</span>
            </button>
          </div>
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className='flex items-center gap-1 text-sm text-slate-600 mb-4 flex-wrap'>
          <button 
            onClick={() => { setCurrentPath(''); setCurrentFolderName(''); }} 
            className={`px-2 py-1 rounded hover:bg-slate-100 ${!currentPath ? 'font-semibold text-[#7A1C1C]' : 'text-slate-600 hover:text-[#7A1C1C]'}`}
          >
            My Files
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className='w-4 h-4 text-slate-400' />
              <button 
                onClick={() => setCurrentPath(crumb.path)} 
                className={`px-2 py-1 rounded hover:bg-slate-100 ${idx === breadcrumbs.length - 1 ? 'font-semibold text-[#7A1C1C]' : 'text-slate-600 hover:text-[#7A1C1C]'}`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        
        <p className='text-slate-600'>Manage and organize your files.</p>

        <div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-3'>
          <div className='relative'>
            <input
              type='text'
              placeholder='Search files...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7A1C1C]/30 focus:border-[#7A1C1C] bg-white text-slate-700 placeholder-slate-400'
            />
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className='w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7A1C1C]/30 focus:border-[#7A1C1C]'
            >
              <option value='all'>All types</option>
              <option value='pdf'>PDF (.pdf)</option>
              <option value='docx'>Word (.docx)</option>
              <option value='xlsx'>Excel (.xlsx)</option>
              <option value='txt'>Text (.txt)</option>
              <option value='png'>Image (.png)</option>
              <option value='jpg'>Image (.jpg)</option>
              <option value='folder'>Folders</option>
            </select>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className='w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7A1C1C]/30 focus:border-[#7A1C1C]'
            >
              <option value='name-asc'>Name (A → Z)</option>
              <option value='name-desc'>Name (Z → A)</option>
              <option value='size-asc'>Size (small → large)</option>
              <option value='size-desc'>Size (large → small)</option>
              <option value='date-new'>Date (newest)</option>
              <option value='date-old'>Date (oldest)</option>
            </select>
          </div>
        </div>
      </div>

      <section className='px-6 lg:px-12 pb-12'>
        <div className='w-full rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
          <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
            <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
              <FileText className='w-5 h-5 text-[#7A1C1C]' />
              {currentPath ? currentFolderName || 'Folder' : 'All Files'}
              {files.length > 0 && <span className='text-sm font-normal text-slate-500'>({filteredSortedFiles.length} items)</span>}
            </h2>
          </div>
          <div className='overflow-y-auto max-h-[60vh]'>
            {loading ? (
              <div className='px-6 py-12 text-center text-slate-400'>
                <div className='animate-spin w-8 h-8 border-2 border-[#7A1C1C] border-t-transparent rounded-full mx-auto mb-3'></div>
                Loading files...
              </div>
            ) : filteredSortedFiles.length === 0 ? (
              <div className='px-6 py-12 text-center text-slate-400'>
                <FileText className='w-12 h-12 mx-auto mb-3 opacity-50' />
                <p>{currentPath ? 'This folder is empty' : 'No files found'}</p>
                <button onClick={() => setShowUploadModal(true)} className='mt-3 text-[#7A1C1C] hover:underline text-sm'>
                  Upload a file
                </button>
              </div>
            ) : (
              <ul className='divide-y divide-slate-100'>
                {filteredSortedFiles.map((file) => (
                  <li 
                    key={file.id} 
                    onContextMenu={(e) => onContextMenuFile(e, file)} 
                    onClick={() => { 
                      if (file.ext === 'folder') { 
                        navigateToFolder(file)
                      } else { 
                        previewFileNow(file) 
                      } 
                    }} 
                    className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start gap-3 flex-1'>
                        <div className={`p-2 rounded-lg transition-colors mt-1 ${file.ext === 'folder' ? 'bg-yellow-50 group-hover:bg-yellow-100' : 'bg-red-50 group-hover:bg-red-100'}`}>
                          {getFileIcon(file.ext)}
                        </div>
                        <div className='flex-1'>
                          <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                            {file.name}
                            {file.ext !== 'folder' && <span className='text-slate-500 font-normal'>.{file.ext}</span>}
                          </p>
                          <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                            {file.ext !== 'folder' && (
                              <>
                                <span>{file.sizeMB.toFixed(2)} MB</span>
                                <span>•</span>
                              </>
                            )}
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
      </section>

      {showUploadModal && (
        <FileUpload onClose={() => setShowUploadModal(false)} folderPath={currentPath} />
      )}
      {showCreateFolderModal && (
        <CreateFolderModal 
          onClose={() => setShowCreateFolderModal(false)} 
          onCreate={handleCreateFolder} 
        />
      )}

      {contextMenu.visible && (
        <div className='fixed inset-0 z-50' style={{ pointerEvents: 'none' }}>
          <div
            ref={menuRef}
            className='absolute min-w-[200px] rounded-lg border border-slate-200 bg-white shadow-xl overflow-visible'
            style={{ top: contextMenu.y, left: contextMenu.x, pointerEvents: 'auto' }}
          >
            <ul className='py-1 text-sm text-slate-700'>
              {contextMenu.targetFile?.ext !== 'folder' && (
                <li>
                  <button onClick={handleDownload} className='w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50'>
                    <Download className='w-4 h-4' />
                    <span>Download</span>
                  </button>
                </li>
              )}
              <li 
                className='relative'
                onMouseEnter={() => {
                  if (folders.length > 0) {
                    setContextMenu((s) => ({ ...s, showMoveSubmenu: true }))
                  }
                }}
                onMouseLeave={() => {
                  setContextMenu((s) => ({ ...s, showMoveSubmenu: false }))
                }}
              >
                <button 
                  onClick={() => {
                    if (folders.length === 0) {
                      // If no folders, just close menu
                      setContextMenu({ visible: false, x: 0, y: 0, targetFile: null, showMoveSubmenu: false })
                    }
                  }}
                  className='w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-50'
                >
                  <div className='flex items-center gap-2'>
                    <Move className='w-4 h-4' />
                    <span>Move</span>
                  </div>
                  {folders.length > 0 && (
                    <ChevronRight className='w-4 h-4' />
                  )}
                </button>
                {contextMenu.showMoveSubmenu && folders.length > 0 && (
                  <div
                    ref={moveSubmenuRef}
                    className='absolute left-full top-0 ml-1 min-w-[200px] rounded-lg border border-slate-200 bg-white shadow-xl py-1 z-50'
                    style={{ pointerEvents: 'auto' }}
                  >
                    <ul className='text-sm text-slate-700 max-h-[300px] overflow-y-auto'>
                      {folders.map((folder) => (
                        <li key={folder.id}>
                          <button
                            onClick={() => handleMoveToFolder(folder)}
                            className='w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left'
                          >
                            <Folder className='w-4 h-4 text-yellow-600' />
                            <span className='truncate'>{folder.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
              <li>
                <button onClick={handleRename} className='w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50'>
                  <Pencil className='w-4 h-4' />
                  <span>Rename</span>
                </button>
              </li>
              <li>
                <button onClick={handleDelete} className='w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-red-600'>
                  <Trash2 className='w-4 h-4' />
                  <span>Move to Trash</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  )
}
