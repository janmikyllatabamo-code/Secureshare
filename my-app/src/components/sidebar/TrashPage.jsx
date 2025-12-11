import React from 'react'
import { Trash2, FileText, Undo2, XCircle, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const TrashPage = () => {
  const [userKey, setUserKey] = React.useState('Student')
  const trashKey = `files:trash:${userKey}`
  const [trashed, setTrashed] = React.useState([])

  const persist = (list) => {
    localStorage.setItem(trashKey, JSON.stringify(list))
    setTrashed(list)
  }

  const restore = (item) => {
    const filesKey = `files:list:${userKey}`
    const filesStored = localStorage.getItem(filesKey)
    const files = filesStored ? JSON.parse(filesStored).map(f => ({ ...f, updatedAt: new Date(f.updatedAt) })) : []
    const newFile = { id: Date.now(), name: item.name, ext: item.ext.replace('.', ''), sizeMB: parseFloat(item.size), updatedAt: new Date(), path: item.path || '', url: item.url || '', bucket: item.bucket || 'files' }
    const updatedFiles = [newFile, ...files]
    localStorage.setItem(filesKey, JSON.stringify(updatedFiles.map(f => ({ ...f, updatedAt: f.updatedAt.toISOString() }))))
    const remaining = trashed.filter(t => t.id !== item.id)
    persist(remaining)
    const notifKey = userKey ? `notifications:${userKey}` : 'notifications:Student'
    const nStored = localStorage.getItem(notifKey)
    const nList = nStored ? JSON.parse(nStored) : []
    const notif = { title: 'Restored', message: `${item.name}${item.ext} restored from Trash`, time: 'just now', read: false }
    localStorage.setItem(notifKey, JSON.stringify([notif, ...nList]))
    window.dispatchEvent(new Event('app:files:updated'))
  }

  const deleteForever = async (item) => {
    if (item.path && item.bucket) {
      await supabase.storage.from(item.bucket).remove([item.path])
    }
    const remaining = trashed.filter(t => t.id !== item.id)
    persist(remaining)
    const notifKey = userKey ? `notifications:${userKey}` : 'notifications:Student'
    const nStored = localStorage.getItem(notifKey)
    const nList = nStored ? JSON.parse(nStored) : []
    const notif = { title: 'Deleted Permanently', message: `${item.name}${item.ext} deleted permanently`, time: 'just now', read: false }
    localStorage.setItem(notifKey, JSON.stringify([notif, ...nList]))
    window.dispatchEvent(new Event('app:files:updated'))
  }

  React.useEffect(() => {
    const authUserRaw = localStorage.getItem('authUser')
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : { role: 'Student', email: '' }
    const key = authUser.role === 'Teacher' ? 'Teacher' : (authUser.email || 'Student')
    setUserKey(key)
  }, [])

  React.useEffect(() => {
    const stored = localStorage.getItem(trashKey)
    const list = stored ? JSON.parse(stored) : []
    setTrashed(list)
  }, [trashKey])

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-[calc(100vh-64px)] m-0 p-0'>
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <div className='flex items-center justify-between flex-wrap gap-3 mb-4'>
          <h1 className='text-3xl lg:text-4xl font-bold text-slate-800'>Trash</h1>
        </div>
        <p className='text-slate-600'>Restore or permanently delete files.</p>
      </div>

      <section className='px-6 lg:px-12 pb-12'>
        <div className='w-full rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
          <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
            <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
              <Trash2 className='w-5 h-5 text-[#7A1C1C]' />
              Deleted Items
            </h2>
          </div>
          <div className='overflow-y-auto'>
            {trashed.length === 0 ? (
              <div className='px-6 py-12 text-center text-slate-400'>No deleted items</div>
            ) : (
              <ul className='divide-y divide-slate-100'>
                {trashed.map((t) => (
                  <li key={t.id} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 group'>
                    <div className='flex items-center justify-between gap-4'>
                      <div className='flex items-start gap-3 flex-1'>
                        <div className='p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors mt-1'>
                          <FileText className='w-4 h-4 text-slate-600' />
                        </div>
                        <div className='flex-1'>
                          <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                            {t.name}<span className='text-slate-500 font-normal'>{t.ext}</span>
                          </p>
                          <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                            <span>{t.size}</span>
                            <span>•</span>
                            <span className='flex items-center gap-1'>
                              <Clock className='w-3 h-3' />
                              <span>{t.when}</span>
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <button onClick={() => restore(t)} className='inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:border-slate-300'>
                          <Undo2 className='w-4 h-4' />
                          <span className='text-sm'>Restore</span>
                        </button>
                        <button onClick={() => deleteForever(t)} className='inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-600 text-white hover:opacity-95'>
                          <XCircle className='w-4 h-4' />
                          <span className='text-sm'>Delete</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}




