import React, { useState } from 'react'
import { Share2, Users, FileText, Clock } from 'lucide-react'
import { ShareAccessModal } from '../portal/ShareAccessModal'

export const SharedPage = () => {
  const [showShareAccessModal, setShowShareAccessModal] = useState(false)
  const [userKey, setUserKey] = useState('Student')
  const [sharedItems, setSharedItems] = useState([])

  // Calculate days remaining until link expiry
  const calculateDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 0
    const today = new Date()
    const expiry = new Date(expiryDate)
    // Check if date is valid
    if (isNaN(expiry.getTime())) return 0
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const linkDays = () => {
    const v = localStorage.getItem('settings:linkExpiryDays')
    return v ? Number(v) : 7
  }

  React.useEffect(() => {
    const authUserRaw = localStorage.getItem('authUser')
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : { role: 'Student', email: '' }
    const key = authUser.role === 'Teacher' ? 'Teacher' : (authUser.email || 'Student')
    setUserKey(key)
  }, [])

  React.useEffect(() => {
    const sharedKey = `shared:list:${userKey}`
    const stored = localStorage.getItem(sharedKey)
    const list = stored ? JSON.parse(stored) : []
    setSharedItems(list.map(it => ({ ...it, expiryDate: it.expiryDate ? new Date(it.expiryDate) : null })))
  }, [userKey])

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-[calc(100vh-64px)] m-0 p-0'>
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <div className='flex items-center justify-between flex-wrap gap-3 mb-4'>
          <h1 className='text-3xl lg:text-4xl font-bold text-slate-800'>Shared</h1>
          <button onClick={() => setShowShareAccessModal(true)} className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A1C1C] text-white hover:opacity-95 transition-opacity'>
            <Share2 className='w-4 h-4' />
            <span>Share access</span>
          </button>
        </div>
        <p className='text-slate-600'>View and manage files shared with others or you.</p>
      </div>

      <section className='px-6 lg:px-12 pb-12'>
        <div className='w-full rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
          <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
            <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
              <Users className='w-5 h-5 text-[#7A1C1C]' />
              Shared Items
            </h2>
          </div>
          <div className='overflow-y-auto'>
            <ul className='divide-y divide-slate-100'>
              {sharedItems.map((item) => {
                const daysRemaining = calculateDaysRemaining(item.expiryDate)
                return (
                  <li key={item.id} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start gap-3 flex-1'>
                        <div className='p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors mt-1'>
                          <FileText className='w-4 h-4 text-blue-600' />
                        </div>
                        <div className='flex-1'>
                          <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                            {item.name}<span className='text-slate-500 font-normal'>{item.extension}</span>
                          </p>
                          <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                            <span>Shared by {item.sharedBy}</span>
                            <span>•</span>
                            <span className='flex items-center gap-1'>
                              <Clock className='w-3 h-3' />
                              <span>{item.sharedDate}</span>
                            </span>
                            {daysRemaining > 0 && (
                              <>
                                <span>•</span>
                                <span className={`font-semibold ${
                                  daysRemaining <= 3 ? 'text-red-600' : 
                                  daysRemaining <= 7 ? 'text-yellow-600' : 
                                  'text-green-600'
                                }`}>
                                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                                </span>
                              </>
                            )}
                            {daysRemaining === 0 && (
                              <>
                                <span>•</span>
                                <span className='font-semibold text-red-600'>
                                  Expired
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>

      {showShareAccessModal && (
        <ShareAccessModal onClose={() => setShowShareAccessModal(false)} onShare={({ emails, file, role }) => {
          const days = linkDays()
          const name = file ? file.name.split('.')[0] : 'Shared File'
          const extension = file ? `.${file.name.split('.').pop()}` : ''
          const item = {
            id: Date.now(),
            name,
            extension,
            sharedBy: 'You',
            sharedDate: 'today',
            recipients: emails,
            role,
            expiryDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
          }
          const next = [item, ...sharedItems]
          setSharedItems(next)
          const sharedKey = `shared:list:${userKey}`
          localStorage.setItem(sharedKey, JSON.stringify(next.map(it => ({ ...it, expiryDate: it.expiryDate?.toISOString() }))))

          const ownerNotifKey = `notifications:${userKey}`
          const ownerStored = localStorage.getItem(ownerNotifKey)
          const ownerList = ownerStored ? JSON.parse(ownerStored) : []
          const ownerNotif = { title: 'Access shared', message: `${name}${extension} shared with ${emails.length} recipient(s)`, time: 'just now', read: false }
          localStorage.setItem(ownerNotifKey, JSON.stringify([ownerNotif, ...ownerList]))
          window.dispatchEvent(new Event('app:shared:updated'))

          emails.forEach((email) => {
            const destKey = `notifications:${email}`
            const dStored = localStorage.getItem(destKey)
            const dList = dStored ? JSON.parse(dStored) : []
            const notif = { title: 'New file shared', message: `${userKey} shared ${name}${extension} with you`, time: 'just now', read: false }
            localStorage.setItem(destKey, JSON.stringify([notif, ...dList]))
          })
        }} />
      )}
    </div>
  )
}




