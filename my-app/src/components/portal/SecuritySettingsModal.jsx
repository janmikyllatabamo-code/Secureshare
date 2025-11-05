import React, { useState } from 'react'
import { X, ShieldCheck, Lock, KeyRound, EyeOff } from 'lucide-react'

export const SecuritySettingsModal = ({ onClose, onSave }) => {
  const [twoFactor, setTwoFactor] = useState(false)
  const [linkExpiry, setLinkExpiry] = useState('7')
  const [watermark, setWatermark] = useState(false)

  const handleSave = () => {
    const settings = { twoFactor, linkExpiry: Number(linkExpiry), watermark }
    if (onSave) onSave(settings)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D]'>
              <ShieldCheck className='w-4 h-4 text-white' />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Security settings</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100">
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='px-6 py-5 space-y-5'>
          <div className='flex items-start gap-3'>
            <Lock className='w-5 h-5 text-slate-500 mt-0.5' />
            <div className='flex-1'>
              <div className='flex items-center justify-between'>
                <p className='font-semibold text-slate-800'>Two-factor authentication</p>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={twoFactor} onChange={(e)=>setTwoFactor(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:bg-[#7A1C1C] after:content-[''] after:absolute after:mt-[2px] after:ml-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all relative peer-checked:after:translate-x-5"></div>
                </label>
              </div>
              <p className='text-sm text-slate-500'>Require a code on sign-in.</p>
            </div>
          </div>

          <div className='flex items-start gap-3'>
            <KeyRound className='w-5 h-5 text-slate-500 mt-0.5' />
            <div className='flex-1'>
              <p className='font-semibold text-slate-800 mb-2'>Link expiry (days)</p>
              <input type='number' min='1' max='365' value={linkExpiry} onChange={(e)=>setLinkExpiry(e.target.value)} className='w-28 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7A1C1C]' />
              <p className='text-sm text-slate-500 mt-1'>Shared links expire automatically.</p>
            </div>
          </div>

          <div className='flex items-start gap-3'>
            <EyeOff className='w-5 h-5 text-slate-500 mt-0.5' />
            <div className='flex-1'>
              <div className='flex items-center justify-between'>
                <p className='font-semibold text-slate-800'>Watermark previews</p>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={watermark} onChange={(e)=>setWatermark(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:bg-[#7A1C1C] after:content-[''] after:absolute after:mt-[2px] after:ml-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all relative peer-checked:after:translate-x-5"></div>
                </label>
              </div>
              <p className='text-sm text-slate-500'>Discourage screenshots of sensitive content.</p>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50'>
          <button onClick={onClose} type='button' className='px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white'>Cancel</button>
          <button onClick={handleSave} type='button' className='px-4 py-2 text-sm rounded-lg text-white bg-[#7A1C1C] hover:bg-[#5a1515]'>Save</button>
        </div>
      </div>
    </div>
  )
}



