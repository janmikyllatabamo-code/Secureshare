import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { PortalNavbar } from './portal/PortalNavbar'
import { Sidebar } from './Sidebar'

export const PortalLayout = () => {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalNavbar onToggleSidebar={()=>setCollapsed(prev=>!prev)} />
      <div className="flex">
        <Sidebar collapsed={collapsed} />
        <main className={`flex-1 transition-all duration-300 px-0`}> 
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}


