import React from 'react'
import { Home, Users, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export const AdminSidebar = ({ collapsed }) => {
  const widthClass = collapsed ? 'md:w-16' : 'md:w-60'
  const labelClass = collapsed ? 'hidden' : 'block'

  return (
    <>
      {/* Mobile overlay drawer */}
      {!collapsed && (
        <aside className={`md:hidden fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-gradient-to-b from-[#7A1C1C] to-[#5a1515] text-white z-40 shadow-2xl border-r border-white/10`}>
          <nav className="py-4">
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/admin-dashboard"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors ${isActive ? 'bg-white/15 border-l-4 border-white' : ''}`
                  }
                >
                  <Home className="w-5 h-5" />
                  <span className={`text-sm font-medium`}>Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="teachers"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors ${isActive ? 'bg-white/15 border-l-4 border-white' : ''}`
                  }
                >
                  <Users className="w-5 h-5" />
                  <span className={`text-sm font-medium`}>Manage Teachers</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="settings"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors ${isActive ? 'bg-white/15 border-l-4 border-white' : ''}`
                  }
                >
                  <Settings className="w-5 h-5" />
                  <span className={`text-sm font-medium`}>Settings</span>
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:block h-[calc(100vh-64px)] bg-gradient-to-b from-[#7A1C1C] to-[#5a1515] text-white ${widthClass} transition-all duration-300 sticky top-16 shadow-2xl border-r border-white/10`}
      >
        <nav className="py-4">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/admin-dashboard"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors ${isActive ? 'bg-white/15 border-l-4 border-white' : ''}`
                }
              >
                <Home className="w-5 h-5" />
                <span className={`${labelClass} text-sm font-medium`}>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="teachers"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors ${isActive ? 'bg-white/15 border-l-4 border-white' : ''}`
                }
              >
                <Users className="w-5 h-5" />
                <span className={`${labelClass} text-sm font-medium`}>Manage Teachers</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors ${isActive ? 'bg-white/15 border-l-4 border-white' : ''}`
                }
              >
                <Settings className="w-5 h-5" />
                <span className={`${labelClass} text-sm font-medium`}>Settings</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  )
}






