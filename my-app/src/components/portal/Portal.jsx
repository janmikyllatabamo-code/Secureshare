// UPDATED: Added useState import for modal state management
import React, { useState } from 'react'
// ADDED: Import FileUpload component
import { FileUpload } from './FileUpload'
import { CreateFolderModal } from './CreateFolderModal'
import { ShareAccessModal } from './ShareAccessModal'
import { SecuritySettingsModal } from './SecuritySettingsModal'
import { Upload, FolderPlus, Share2, Settings, FileText, Clock, Download, Users, TrendingUp } from 'lucide-react'

export const Portal = () => {
  // ADDED: State to control upload modal visibility
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showShareAccessModal, setShowShareAccessModal] = useState(false);
  const [showSecuritySettingsModal, setShowSecuritySettingsModal] = useState(false);

  return (
    <header>
      <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen m-0 p-0'>
        {/* Welcome Section */}
        <div className='px-6 lg:px-12 pt-8 pb-6'>
          <div className='mb-2'>
            <h1 className='text-4xl lg:text-5xl font-bold text-slate-800 mb-2'>
              Welcome Back, <span className='text-[#7A1C1C]'>Alex!</span>
            </h1>
            <p className='text-slate-600 text-base lg:text-lg font-medium'>
              Your secure workspace for academic collaboration
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='px-6 lg:px-12 mb-8'>
          <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
            <li className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-default group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Total Files</p>
                <FileText className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>24</span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-green-600' />
                <span className='text-green-600 font-medium'>+3 this week</span>
              </p>
            </li>
            <li className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-default group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Uploaded</p>
                <Upload className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>24</span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-green-600' />
                <span className='text-green-600 font-medium'>+3 this week</span>
              </p>
            </li>
            <li className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-default group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Downloaded</p>
                <Download className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>24</span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-green-600' />
                <span className='text-green-600 font-medium'>+3 this week</span>
              </p>
            </li>
            <li className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-default group'>
              <div className='flex items-center justify-between mb-3'>
                <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Shared With</p>
                <Users className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
              </div>
              <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>24</span>
              <p className='text-xs text-slate-500 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3 text-green-600' />
                <span className='text-green-600 font-medium'>+3 this week</span>
              </p>
            </li>
          </ul>
        </div>

        {/* Quick Actions Section */}
        <div className='px-6 lg:px-12 mb-8'>
          <h2 className='text-2xl lg:text-3xl font-bold text-slate-800 mb-6'>Quick Actions</h2>

          <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
            {/* UPDATED: Made this clickable to open upload modal */}
            <li 
              onClick={() => setShowUploadModal(true)}
              className='bg-gradient-to-br from-white to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#7A1C1C] group'
            >
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg shadow-md group-hover:shadow-lg transition-shadow'>
                  <Upload className='w-5 h-5 text-white' />
                </div>
                <p className='font-semibold text-slate-800'>Upload a file</p>
              </div>
              <p className='text-xs text-slate-500 ml-11'>.DOCX, .PDF, .PPTX, .JPG, .PNG</p>
            </li>
            <li onClick={() => setShowCreateFolderModal(true)} className='bg-gradient-to-br from-white to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#7A1C1C] group'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg shadow-md group-hover:shadow-lg transition-shadow'>
                  <FolderPlus className='w-5 h-5 text-white' />
                </div>
                <p className='font-semibold text-slate-800'>Create a folder</p>
              </div>
              <p className='text-xs text-slate-500 ml-11'>Organize your files</p>
            </li>
            <li onClick={() => setShowShareAccessModal(true)} className='bg-gradient-to-br from-white to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#7A1C1C] group'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg shadow-md group-hover:shadow-lg transition-shadow'>
                  <Share2 className='w-5 h-5 text-white' />
                </div>
                <p className='font-semibold text-slate-800'>Share Access</p>
              </div>
              <p className='text-xs text-slate-500 ml-11'>Collaborate with others</p>
            </li>
            <li onClick={() => setShowSecuritySettingsModal(true)} className='bg-gradient-to-br from-white to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#7A1C1C] group'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg shadow-md group-hover:shadow-lg transition-shadow'>
                  <Settings className='w-5 h-5 text-white' />
                </div>
                <p className='font-semibold text-slate-800'>Security Settings</p>
              </div>
              <p className='text-xs text-slate-500 ml-11'>Manage permissions</p>
            </li>
          </ul>
        </div>

        {/* Main Content Section */}
        <section className='flex flex-col lg:flex-row gap-6 px-6 lg:px-12 pb-12'>
          {/* Recent Files Card */}
          <div className='w-full lg:flex-1 h-auto lg:h-[500px] rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
            <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
              <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
                <FileText className='w-5 h-5 text-[#7A1C1C]' />
                Recent Files
              </h2>
            </div>
            <div className='overflow-y-auto h-full max-h-[440px]'>
              <ul className='divide-y divide-slate-100'>
                <li className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3 flex-1'>
                      <div className='p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors mt-1'>
                        <FileText className='w-4 h-4 text-red-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                          Computer Science Assignment<span className='text-slate-500 font-normal'>.pdf</span>
                        </p>
                        <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                          <span className='flex items-center gap-1'>
                            <span>2.4 MB</span>
                          </span>
                          <span>•</span>
                          <span>Prof. Smith</span>
                          <span>•</span>
                          <span className='flex items-center gap-1'>
                            <Clock className='w-3 h-3' />
                            <span>2 hours ago</span>
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              
                <li className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3 flex-1'>
                      <div className='p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors mt-1'>
                        <FileText className='w-4 h-4 text-red-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                          Data Structure Lecture Notes<span className='text-slate-500 font-normal'>.pdf</span>
                        </p>
                        <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                          <span>1.8 MB</span>
                          <span>•</span>
                          <span>Prof. Johnson</span>
                          <span>•</span>
                          <span className='flex items-center gap-1'>
                            <Clock className='w-3 h-3' />
                            <span>5 hours ago</span>
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              
                <li className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3 flex-1'>
                      <div className='p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors mt-1'>
                        <FileText className='w-4 h-4 text-blue-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                          Lab Report - Week 5<span className='text-slate-500 font-normal'>.docx</span>
                        </p>
                        <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                          <span>824 KB</span>
                          <span>•</span>
                          <span>You</span>
                          <span>•</span>
                          <span className='flex items-center gap-1'>
                            <Clock className='w-3 h-3' />
                            <span>2 days ago</span>
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              
                <li className='px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3 flex-1'>
                      <div className='p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors mt-1'>
                        <FileText className='w-4 h-4 text-green-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-slate-800 mb-1 group-hover:text-[#7A1C1C] transition-colors'>
                          Research Data Analysis<span className='text-slate-500 font-normal'>.xlsx</span>
                        </p>
                        <p className='text-xs text-slate-500 flex items-center gap-3 flex-wrap'>
                          <span>3.2 MB</span>
                          <span>•</span>
                          <span>Sara Duterte</span>
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
              </ul>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className='w-full lg:w-96 h-auto lg:h-[500px] rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
            <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
              <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
                <Clock className='w-5 h-5 text-[#7A1C1C]' />
                Recent Activity
              </h2>
            </div>
            <div className='px-6 py-8'>
              <div className='flex flex-col items-center justify-center h-full text-center text-slate-400'>
                <Clock className='w-12 h-12 mb-3 opacity-50' />
                <p className='text-sm'>No recent activity</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ADDED: File upload modal - shown when showUploadModal is true */}
      {showUploadModal && (
        <FileUpload onClose={() => setShowUploadModal(false)} />
      )}
      {showCreateFolderModal && (
        <CreateFolderModal onClose={() => setShowCreateFolderModal(false)} onCreate={() => {}} />
      )}
      {showShareAccessModal && (
        <ShareAccessModal onClose={() => setShowShareAccessModal(false)} onShare={() => {}} />
      )}
      {showSecuritySettingsModal && (
        <SecuritySettingsModal onClose={() => setShowSecuritySettingsModal(false)} onSave={() => {}} />
      )}
  </header>
  )
}









