import React, { useState, useRef, useEffect } from 'react'
import { Search, ShieldCheck, Menu, Bell, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export const PortalNavbar = ({ onToggleSidebar }) => {
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [userInfo, setUserInfo] = useState({ fullName: 'User', email: '', role: 'Student' })
  const userMenuRef = useRef(null)
  const notificationRef = useRef(null)
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
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    const target = userInfo.role === 'Teacher' ? '/teacher-dashboard/files' : '/portal/files'
    navigate(`${target}?q=${encodeURIComponent(q)}`)
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

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center bg-white border border-transparent rounded-lg px-4 py-2.5 w-full max-w-md shadow-sm hover:shadow-md transition-shadow duration-200 focus-within:ring-2 focus-within:ring-[#9B2D2D]">
        <Search className="text-slate-500 w-4 h-4 mr-2 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files, assignments..."
          className="w-full outline-none text-sm text-slate-700 placeholder-slate-400"
        />
      </form>

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


