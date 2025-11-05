import React from 'react'
import { Home, Folder, Share2, Trash2, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export const Sidebar = ({ collapsed }) => {
  const widthClass = collapsed ? 'w-16' : 'w-60'
  const labelClass = collapsed ? 'hidden' : 'block'

  return (
    <aside className={`h-[calc(100vh-64px)] bg-[#7A1C1C] text-white ${widthClass} transition-all duration-300 sticky top-16`}> 
      <nav className="py-4">
        <ul className="space-y-1">
          <li>
            <NavLink to="/portal" end className={({isActive})=>`flex items-center gap-3 px-4 py-3 hover:bg-white/10 ${isActive? 'bg-white/10' : ''}`}>
              <Home className="w-5 h-5" />
              <span className={`${labelClass} text-sm font-medium`}>Home</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="files" className={({isActive})=>`flex items-center gap-3 px-4 py-3 hover:bg-white/10 ${isActive? 'bg-white/10' : ''}`}>
              <Folder className="w-5 h-5" />
              <span className={`${labelClass} text-sm font-medium`}>Files</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="shared" className={({isActive})=>`flex items-center gap-3 px-4 py-3 hover:bg-white/10 ${isActive? 'bg-white/10' : ''}`}>
              <Share2 className="w-5 h-5" />
              <span className={`${labelClass} text-sm font-medium`}>Shared</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="trash" className={({isActive})=>`flex items-center gap-3 px-4 py-3 hover:bg-white/10 ${isActive? 'bg-white/10' : ''}`}>
              <Trash2 className="w-5 h-5" />
              <span className={`${labelClass} text-sm font-medium`}>Trash</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="settings" className={({isActive})=>`flex items-center gap-3 px-4 py-3 hover:bg-white/10 ${isActive? 'bg-white/10' : ''}`}>
              <Settings className="w-5 h-5" />
              <span className={`${labelClass} text-sm font-medium`}>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  )
}


