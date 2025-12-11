import React, { useState } from 'react'
import { Settings, Shield } from 'lucide-react'
import { SecuritySettingsModal } from '../portal/SecuritySettingsModal'

export const SettingsPage = () => {
  const [showSecuritySettingsModal, setShowSecuritySettingsModal] = useState(false)
  const [linkExpiryDays, setLinkExpiryDays] = useState(() => {
    const v = localStorage.getItem('settings:linkExpiryDays')
    return v ? Number(v) : 7
  })

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-[calc(100vh-64px)] m-0 p-0'>
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <div className='flex items-center justify-between flex-wrap gap-3 mb-4'>
          <h1 className='text-3xl lg:text-4xl font-bold text-slate-800'>Settings</h1>
          <button onClick={() => setShowSecuritySettingsModal(true)} className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A1C1C] text-white hover:opacity-95 transition-opacity'>
            <Shield className='w-4 h-4' />
            <span>Security settings</span>
          </button>
        </div>
        <p className='text-slate-600'>Manage account and security preferences.</p>
      </div>

      <section className='px-6 lg:px-12 pb-12'>
        <div className='w-full rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
          <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
            <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
              <Settings className='w-5 h-5 text-[#7A1C1C]' />
              Link Expiration
            </h2>
          </div>
          <div className='px-6 py-6 text-slate-700'>
            <div className='p-4 border border-slate-200 rounded-lg'>
              <p className='font-semibold mb-1'>Shared link expiry</p>
              <p className='text-sm text-slate-500 mb-3'>Current: {linkExpiryDays} days</p>
              <button onClick={() => setShowSecuritySettingsModal(true)} className='text-sm inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 hover:border-[#7A1C1C] hover:text-[#7A1C1C]'>
                <Shield className='w-4 h-4' />
                Configure
              </button>
            </div>
          </div>
        </div>
      </section>

      {showSecuritySettingsModal && (
        <SecuritySettingsModal onClose={() => setShowSecuritySettingsModal(false)} onSave={(s) => {
          localStorage.setItem('settings:linkExpiryDays', String(s.linkExpiry))
          setLinkExpiryDays(Number(s.linkExpiry))
        }} />
      )}
    </div>
  )
}




