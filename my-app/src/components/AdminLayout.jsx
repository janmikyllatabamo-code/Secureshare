import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { PortalNavbar } from './portal/PortalNavbar'
import { AdminSidebar } from './AdminSidebar'

export const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className="min-h-screen bg-radial-at-center from-[#F9F0D9] to-[#F2F2F2]">
      <PortalNavbar onToggleSidebar={() => setCollapsed(prev => !prev)} />
      <div className="flex">
        <AdminSidebar collapsed={collapsed} />
        <main className={`flex-1 transition-all duration-300 px-0`}>
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}






