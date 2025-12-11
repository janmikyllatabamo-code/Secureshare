import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Upload, FolderPlus, FileText, Clock, Copy as CopyIcon, Scissors, ClipboardPaste, Move, Pencil, Trash2 } from 'lucide-react'
import { FilePreviewModal } from '../portal/FilePreviewModal'
import { FileUpload } from '../portal/FileUpload'
import { CreateFolderModal } from '../portal/CreateFolderModal'

export const FilesPage = () => {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name-asc')
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetFile: null })
  const [clipboard, setClipboard] = useState({ file: null, mode: null })
  const [previewFile, setPreviewFile] = useState(null)
  const menuRef = useRef(null)
  const initializedRef = useRef(false)
  const [files, setFiles] = useState([])
  const [userKey, setUserKey] = useState('Student')
  const filesKey = `files:list:${userKey}`
  const trashKey = `files:trash:${userKey}`
  const [currentPath, setCurrentPath] = useState('')
  const location = useLocation()

  useEffect(() => {
    const authUserRaw = localStorage.getItem('authUser')
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : { role: 'Student', email: '' }
    const key = authUser.role === 'Teacher' ? 'Teacher' : (authUser.email || 'Student')
    setUserKey(key)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(filesKey)
    const parsed = stored ? JSON.parse(stored) : []
    const normalized = parsed.map(f => ({ ...f, updatedAt: new Date(f.updatedAt), parentPath: f.parentPath || '' }))
    setFiles(normalized)
    initializedRef.current = true
  }, [filesKey])

  useEffect(() => {
    if (!initializedRef.current) return
    const toStore = files.map(f => ({ ...f, updatedAt: f.updatedAt instanceof Date ? f.updatedAt.toISOString() : f.updatedAt }))
    localStorage.setItem(filesKey, JSON.stringify(toStore))
  }, [files, filesKey])

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

  const incrementDownloads = () => {
    const key = userKey || 'Student'
    const dKey = `downloads:count:${key}`
    const n = Number(localStorage.getItem(dKey) || '0') + 1
    localStorage.setItem(dKey, String(n))
  }

  const notify = (title, message) => {
    const notifKey = userKey ? `notifications:${userKey}` : 'notifications:Student'
    const nStored = localStorage.getItem(notifKey)
    const nList = nStored ? JSON.parse(nStored) : []
    const notif = { title, message, time: 'just now', read: false }
    localStorage.setItem(notifKey, JSON.stringify([notif, ...nList]))
  }

  const previewFileNow = (file) => {
    if (file.ext === 'folder') return
    setPreviewFile({ name: `${file.name}.${file.ext}`, url: file.url, ext: file.ext })
  }

  // Placeholder action handlers (frontend-only)
  const handleCopy = () => {
    setClipboard({ file: contextMenu.targetFile, mode: 'copy' })
    setContextMenu((s) => ({ ...s, visible: false }))
    window.dispatchEvent(new Event('app:files:updated'))
    if (contextMenu.targetFile) notify('Copied', `${contextMenu.targetFile.name}.${contextMenu.targetFile.ext} copied`)
  }
  const handleCut = () => {
    setClipboard({ file: contextMenu.targetFile, mode: 'cut' })
    setContextMenu((s) => ({ ...s, visible: false }))
    window.dispatchEvent(new Event('app:files:updated'))
    if (contextMenu.targetFile) notify('Cut', `${contextMenu.targetFile.name}.${contextMenu.targetFile.ext} cut`)
  }
  const handlePaste = () => {
    if (!clipboard.file) return
    const src = clipboard.file
    const now = new Date()
    if (clipboard.mode === 'copy') {
      const newItem = { id: Date.now(), name: `${src.name} (copy)`, ext: src.ext, sizeMB: src.sizeMB, updatedAt: now }
      setFiles(prev => [newItem, ...prev])
    }
    if (clipboard.mode === 'cut') {
      const newItem = { id: Date.now(), name: src.name, ext: src.ext, sizeMB: src.sizeMB, updatedAt: now }
      setFiles(prev => [newItem, ...prev.filter(f => f.id !== src.id)])
      setClipboard({ file: null, mode: null })
    }
    setContextMenu((s) => ({ ...s, visible: false }))
    window.dispatchEvent(new Event('app:files:updated'))
    notify('Pasted', `${src.name}.${src.ext} pasted`)
  }
  const handleMove = () => {
    setClipboard({ file: contextMenu.targetFile, mode: 'cut' })
    setContextMenu((s) => ({ ...s, visible: false }))
    window.dispatchEvent(new Event('app:files:updated'))
    if (contextMenu.targetFile) notify('Move', `${contextMenu.targetFile.name}.${contextMenu.targetFile.ext} marked to move`)
  }
  const handleRename = () => {
    const f = contextMenu.targetFile
    const newName = window.prompt('Rename file', f.name)
    if (newName && newName.trim()) {
      setFiles(prev => prev.map(it => it.id === f.id ? { ...it, name: newName.trim(), updatedAt: new Date() } : it))
    }
    setContextMenu((s) => ({ ...s, visible: false }))
    window.dispatchEvent(new Event('app:files:updated'))
    if (newName && newName.trim()) notify('Renamed', `${f.name}.${f.ext} → ${newName.trim()}.${f.ext}`)
  }
  const handleDelete = () => {
    const f = contextMenu.targetFile
    const trashed = localStorage.getItem(trashKey)
    const list = trashed ? JSON.parse(trashed) : []
    const entry = { id: f.id, name: f.name, ext: `.${f.ext}`, size: `${f.sizeMB.toFixed(1)} MB`, when: 'just now', deletedAt: new Date().toISOString(), path: f.path || '', bucket: f.bucket || 'files' }
    const newFiles = files.filter(it => it.id !== f.id)
    setFiles(newFiles)
    localStorage.setItem(trashKey, JSON.stringify([entry, ...list]))
    const notifKey = userKey ? `notifications:${userKey}` : 'notifications:Student'
    const nStored = localStorage.getItem(notifKey)
    const nList = nStored ? JSON.parse(nStored) : []
    const notif = { title: 'Moved to Trash', message: `${f.name}.${f.ext} moved to Trash`, time: 'just now', read: false }
    localStorage.setItem(notifKey, JSON.stringify([notif, ...nList]))
    window.dispatchEvent(new Event('app:files:updated'))
    setContextMenu((s) => ({ ...s, visible: false }))
  }

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
        <div className='flex items-center gap-2 text-sm text-slate-600 mb-2'>
          <span>Path:</span>
          {currentPath ? (
            <>
              <button onClick={() => setCurrentPath('')} className='text-[#7A1C1C] font-semibold'>Root</button>
              <span>/</span>
              <span>{currentPath}</span>
            </>
          ) : (
            <span className='font-semibold'>Root</span>
          )}
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
              All Files
            </h2>
          </div>
          <div className='overflow-y-auto'>
            <ul className='divide-y divide-slate-100'>
              {filteredSortedFiles.map((file) => (
                <li key={file.id} onContextMenu={(e) => onContextMenuFile(e, file)} onClick={() => { if (file.ext === 'folder') { setCurrentPath(file.fullPath || `${currentPath ? currentPath + '/' : ''}${file.name}-${file.id}`) } else { previewFileNow(file) } }} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'>
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
                          <span>{file.sizeMB.toFixed(1)} MB</span>
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
      </section>

      {showUploadModal && (
        <FileUpload onClose={() => setShowUploadModal(false)} folderPath={currentPath} />
      )}
      {showCreateFolderModal && (
        <CreateFolderModal onClose={() => setShowCreateFolderModal(false)} onCreate={(folderName) => {
          const now = new Date()
          const id = Date.now()
          const fullPath = `${currentPath ? currentPath + '/' : ''}${folderName}-${id}`
          const newFolder = { id, name: folderName, ext: 'folder', sizeMB: 0, updatedAt: now, fullPath, parentPath: currentPath }
          setFiles(prev => [newFolder, ...prev])
          const notifKey = userKey ? `notifications:${userKey}` : 'notifications:Student'
          const nStored = localStorage.getItem(notifKey)
          const nList = nStored ? JSON.parse(nStored) : []
          const notif = { title: 'Folder created', message: `${folderName} created`, time: 'just now', read: false }
          localStorage.setItem(notifKey, JSON.stringify([notif, ...nList]))
          window.dispatchEvent(new Event('app:files:updated'))
        }} />
      )}

      {contextMenu.visible && (
        <div className='fixed inset-0 z-50' style={{ pointerEvents: 'none' }}>
          <div
            ref={menuRef}
            className='absolute min-w-[200px] rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden'
            style={{ top: contextMenu.y, left: contextMenu.x, pointerEvents: 'auto' }}
          >
            <ul className='py-1 text-sm text-slate-700'>
              <li>
                <button onClick={handleCopy} className='w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50'>
                  <CopyIcon className='w-4 h-4' />
                  <span>Copy</span>
                </button>
              </li>
              <li>
                <button onClick={handleCut} className='w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50'>
                  <Scissors className='w-4 h-4' />
                  <span>Cut</span>
                </button>
              </li>
              <li>
                <button onClick={handlePaste} disabled={!clipboard.file} className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 ${!clipboard.file ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <ClipboardPaste className='w-4 h-4' />
                  <span>Paste</span>
                </button>
              </li>
              <li><div className='my-1 border-t border-slate-100' /></li>
              <li>
                <button onClick={handleMove} className='w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50'>
                  <Move className='w-4 h-4' />
                  <span>Move</span>
                </button>
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
                  <span>Delete</span>
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
