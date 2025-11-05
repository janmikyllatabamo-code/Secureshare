import React, { useState } from 'react'
import { Upload, FolderPlus, FileText, Clock } from 'lucide-react'
import { FileUpload } from '../portal/FileUpload'
import { CreateFolderModal } from '../portal/CreateFolderModal'

export const FilesPage = () => {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-[calc(100vh-64px)] m-0 p-0'>
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <div className='flex items-center justify-between flex-wrap gap-3 mb-4'>
          <h1 className='text-3xl lg:text-4xl font-bold text-slate-800'>Files</h1>
          <div className='flex items-center gap-2'>
            <button onClick={() => setShowCreateFolderModal(true)} className='inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#7A1C1C] hover:text-[#7A1C1C] transition-colors'>
              <FolderPlus className='w-4 h-4' />
              <span>Create folder</span>
            </button>
            <button onClick={() => setShowUploadModal(true)} className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A1C1C] text-white hover:opacity-95 transition-opacity'>
              <Upload className='w-4 h-4' />
              <span>Upload</span>
            </button>
          </div>
        </div>
        <p className='text-slate-600'>Manage and organize your files.</p>
      </div>

      <section className='px-6 lg:px-12 pb-12'>
        <div className='w-full rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
          <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
            <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
              <FileText className='w-5 h-5 text-[#7A1C1C]' />
              All Files
            </h2>
          </div>
          <div className='overflow-y-auto'>
            <ul className='divide-y divide-slate-100'>
              {[1,2,3,4,5].map((id) => (
                <li key={id} className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3 flex-1'>
                      <div className='p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors mt-1'>
                        <FileText className='w-4 h-4 text-red-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                          Sample Document {id}<span className='text-slate-500 font-normal'>.pdf</span>
                        </p>
                        <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                          <span>2.0 MB</span>
                          <span>•</span>
                          <span className='flex items-center gap-1'>
                            <Clock className='w-3 h-3' />
                            <span>1 day ago</span>
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

      {showUploadModal && (
        <FileUpload onClose={() => setShowUploadModal(false)} />
      )}
      {showCreateFolderModal && (
        <CreateFolderModal onClose={() => setShowCreateFolderModal(false)} onCreate={() => {}} />
      )}
    </div>
  )
}

 


