import React, { useState } from 'react'
import { Share2, Users, FileText, Clock } from 'lucide-react'
import { ShareAccessModal } from '../portal/ShareAccessModal'

export const SharedPage = () => {
  const [showShareAccessModal, setShowShareAccessModal] = useState(false)

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
              {[1,2,3].map((id) => (
                <li key={id} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3 flex-1'>
                      <div className='p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors mt-1'>
                        <FileText className='w-4 h-4 text-blue-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                          Group Presentation {id}<span className='text-slate-500 font-normal'>.pptx</span>
                        </p>
                        <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                          <span>Shared by You</span>
                          <span>•</span>
                          <span className='flex items-center gap-1'>
                            <Clock className='w-3 h-3' />
                            <span>3 days ago</span>
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

      {showShareAccessModal && (
        <ShareAccessModal onClose={() => setShowShareAccessModal(false)} onShare={() => {}} />
      )}
    </div>
  )
}




