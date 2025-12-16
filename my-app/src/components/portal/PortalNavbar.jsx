import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, ShieldCheck, Menu, Bell, User, FileText, BookOpen, Clock, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export const PortalNavbar = ({ onToggleSidebar }) => {
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [userInfo, setUserInfo] = useState({ fullName: 'User', email: '', role: 'Student' })
  const userMenuRef = useRef(null)
  const notificationRef = useRef(null)
  const searchRef = useRef(null)
  const suggestionsRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const authUser = localStorage.getItem('authUser')
    if (authUser) {
      try {
        const user = JSON.parse(authUser)
        setUserInfo({
          fullName: user.fullName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: user.role || 'Student'
        })
      } catch {}
    }
  }, [])

  useEffect(() => {
    const key = userInfo.email ? `notifications:${userInfo.email}` : `notifications:${userInfo.role}`
    const stored = localStorage.getItem(key)
    const list = stored ? JSON.parse(stored) : []
    setNotifications(list)
    setUnreadCount(list.filter(n => !n.read).length)
  }, [userInfo.email, userInfo.role])

  useEffect(() => {
    function onClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenUserMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (searchRef.current && suggestionsRef.current && 
          !searchRef.current.contains(e.target) && 
          !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Search for files and assignments
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    const suggestions = []
    const searchTerm = query.trim().toLowerCase()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsSearching(false)
        return
      }

      // Search files
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('file_id, file_name, file_path, bucket, is_folder, updated_at')
        .eq('user_id', user.id)
        .eq('is_trashed', false)
        .ilike('file_name', `%${searchTerm}%`)
        .limit(5)
        .order('updated_at', { ascending: false })

      if (!filesError && filesData) {
        filesData.forEach(file => {
          if (!file.is_folder) {
            const nameParts = file.file_name.split('.')
            const ext = nameParts.length > 1 ? nameParts.pop() : ''
            const name = nameParts.join('.')
            suggestions.push({
              id: file.file_id,
              type: 'file',
              title: file.file_name,
              name: name,
              ext: ext.toLowerCase(),
              path: file.file_path,
              bucket: file.bucket,
              updatedAt: file.updated_at
            })
          }
        })
      }

      // Search assignments (for students and teachers)
      if (userInfo.role === 'Student' || userInfo.role === 'Teacher') {
        try {
          // Get user's enrolled courses (for students) or taught courses (for teachers)
          let courseIds = []
          
          if (userInfo.role === 'Student') {
            const { data: enrollments } = await supabase
              .from('enrollments')
              .select('course_id')
              .eq('student_id', user.id)
              .eq('status', 'Active')
            
            if (enrollments) {
              courseIds = enrollments.map(e => e.course_id)
            }
          } else if (userInfo.role === 'Teacher') {
            const { data: courses } = await supabase
              .from('courses')
              .select('course_id')
              .eq('teacher_id', user.id)
            
            if (courses) {
              courseIds = courses.map(c => c.course_id)
            }
          }

          if (courseIds.length > 0) {
            try {
              const { data: assignmentsData, error: assignmentsError } = await supabase
                .from('assignments')
                .select('id, title, description, course_id, due_date')
                .in('course_id', courseIds)
                .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                .limit(5)
                .order('due_date', { ascending: true })

              if (!assignmentsError && assignmentsData && Array.isArray(assignmentsData)) {
                assignmentsData.forEach(assignment => {
                  suggestions.push({
                    id: assignment.id,
                    type: 'assignment',
                    title: assignment.title || 'Untitled Assignment',
                    description: assignment.description || '',
                    courseId: assignment.course_id,
                    dueDate: assignment.due_date
                  })
                })
              }
            } catch (assignErr) {
              // Silently fail if assignments table doesn't exist or has issues
              console.warn('Could not search assignments:', assignErr)
            }
          }
        } catch (err) {
          console.warn('Error searching assignments:', err)
        }
      }

      // Sort suggestions by relevance (exact matches first, then partial)
      suggestions.sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(searchTerm)
        const bExact = b.title.toLowerCase().startsWith(searchTerm)
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return 0
      })

      setSearchSuggestions(suggestions.slice(0, 8)) // Limit to 8 suggestions
      setShowSuggestions(suggestions.length > 0)
    } catch (error) {
      console.error('Search error:', error)
      setSearchSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [userInfo.role])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery)
      } else {
        setSearchSuggestions([])
        setShowSuggestions(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery, performSearch])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setShowSuggestions(false)
    const target = userInfo.role === 'Teacher' ? '/teacher-dashboard/files' : '/portal/files'
    navigate(`${target}?q=${encodeURIComponent(q)}`)
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery('')
    setShowSuggestions(false)
    
    if (suggestion.type === 'file') {
      const target = userInfo.role === 'Teacher' ? '/teacher-dashboard/files' : '/portal/files'
      navigate(`${target}?q=${encodeURIComponent(suggestion.title)}`)
    } else if (suggestion.type === 'assignment') {
      // Navigate to assignment page (adjust route as needed)
      if (userInfo.role === 'Teacher') {
        navigate(`/teacher-dashboard/courses/${suggestion.courseId}`)
      } else {
        navigate(`/portal/courses/${suggestion.courseId}`)
      }
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchSuggestions([])
    setShowSuggestions(false)
  }

  const handleLogout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    localStorage.removeItem('authUser')
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 h-16 flex justify-between items-center px-6 lg:px-12 bg-[#7A1C1C] text-white shadow-md">
      {/* Logo Section */}
      <div className='flex items-center space-x-3 -ml-6 lg:-ml-10'>
        <button onClick={onToggleSidebar} aria-label="Toggle sidebar" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className='bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] p-2.5 rounded-lg shadow-lg'>
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <div className='text-left'>
          <h1 className="text-white text-lg font-bold tracking-tight">SecureShare</h1>
          <p className='text-red-200 text-xs font-semibold tracking-wide'>Academic Portal</p>
        </div>
      </div>

      {/* Search Bar with Suggestions */}
      <div className="hidden md:flex relative w-full max-w-md" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="flex items-center bg-white border border-transparent rounded-lg px-4 py-2.5 w-full shadow-sm hover:shadow-md transition-shadow duration-200 focus-within:ring-2 focus-within:ring-[#9B2D2D]">
          <Search className="text-slate-500 w-4 h-4 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (e.target.value.trim().length >= 2) {
                setShowSuggestions(true)
              }
            }}
            onFocus={() => {
              if (searchSuggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            placeholder="Search files, assignments..."
            className="w-full outline-none text-sm text-slate-700 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="ml-2 p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <X className="text-slate-400 w-4 h-4" />
            </button>
          )}
        </form>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && (searchSuggestions.length > 0 || isSearching) && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
          >
            {isSearching ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#7A1C1C]"></div>
                <p className="text-sm text-slate-500 mt-2">Searching...</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {searchSuggestions.length} {searchSuggestions.length === 1 ? 'result' : 'results'}
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  {searchSuggestions.map((suggestion, idx) => (
                    <button
                      key={`${suggestion.type}-${suggestion.id}-${idx}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 group"
                    >
                      <div className={`flex-shrink-0 mt-0.5 p-2 rounded-lg ${
                        suggestion.type === 'file' 
                          ? 'bg-red-50 group-hover:bg-red-100' 
                          : 'bg-blue-50 group-hover:bg-blue-100'
                      }`}>
                        {suggestion.type === 'file' ? (
                          <FileText className={`w-4 h-4 ${
                            suggestion.type === 'file' ? 'text-red-600' : 'text-blue-600'
                          }`} />
                        ) : (
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#7A1C1C] transition-colors">
                          {suggestion.title}
                        </p>
                        {suggestion.type === 'file' && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">{suggestion.ext.toUpperCase()}</span>
                            {suggestion.updatedAt && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(suggestion.updatedAt).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        {suggestion.type === 'assignment' && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">Assignment</span>
                            {suggestion.dueDate && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Due: {new Date(suggestion.dueDate).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        {suggestion.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {suggestion.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {searchQuery && (
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-xs text-[#7A1C1C] font-semibold hover:underline"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      <ul className="flex items-center gap-4 lg:gap-6">
        <li className="hidden sm:block">
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#7A1C1C] text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Encrypted</span>
          </button>
        </li>
        <li className="hidden lg:block relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-white hover:bg-white/10 rounded-lg transition-colors duration-200 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((n, idx) => (
                    <div key={idx} className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      {n.message && <p className="text-xs text-slate-500 mt-1">{n.message}</p>}
                      {n.time && <p className="text-xs text-slate-400 mt-1">{n.time}</p>}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                  <button 
                    onClick={() => {
                      const key = userInfo.email ? `notifications:${userInfo.email}` : `notifications:${userInfo.role}`
                      const list = notifications.map(n => ({ ...n, read: true }))
                      localStorage.setItem(key, JSON.stringify(list))
                      setNotifications(list)
                      setUnreadCount(0)
                      setShowNotifications(false)
                    }}
                    className="text-xs text-[#7A1C1C] font-semibold hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </li>
        <li className="hidden lg:block relative" ref={userMenuRef}>
          <button onClick={() => setOpenUserMenu((v) => !v)} className="p-2.5 text-white hover:bg-white/10 rounded-lg transition-colors duration-200 relative">
            <User className="w-5 h-5" />
          </button>
          {openUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm text-slate-500">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800">{userInfo.fullName}</p>
                <p className="text-xs text-slate-400 mt-1">{userInfo.email}</p>
                <p className="text-xs text-[#7A1C1C] font-medium mt-1">{userInfo.role}</p>
              </div>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50">Log out</button>
            </div>
          )}
        </li>
        
      </ul>
    </nav>
  )
}


