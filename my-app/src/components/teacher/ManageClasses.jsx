import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, Plus, Edit, Trash2, Link as LinkIcon, Copy as CopyIcon, Check as CheckIcon } from 'lucide-react'
import { AddCourseModal } from './AddCourseModal'
import { supabase } from '../../lib/supabase'

export const ManageClasses = () => {
  const navigate = useNavigate()
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [userKey, setUserKey] = useState('Teacher')
  const [classes, setClasses] = useState([])
  const [copiedId, setCopiedId] = useState(null)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [studentEmail, setStudentEmail] = useState('')

  useEffect(() => {
    const authUserRaw = localStorage.getItem('authUser')
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : { role: 'Teacher', email: '' }
    const key = authUser.role === 'Teacher' ? 'Teacher' : (authUser.email || 'Student')
    setUserKey(key)
  }, [])

  useEffect(() => {
    const storageKey = `classes:list:${userKey}`
    const stored = localStorage.getItem(storageKey)
    const list = stored ? JSON.parse(stored) : []
    setClasses(list)
  }, [userKey])

  const persist = (next) => {
    const storageKey = `classes:list:${userKey}`
    localStorage.setItem(storageKey, JSON.stringify(next))
    setClasses(next)
  }

  const notify = (title, message) => {
    const notifKey = `notifications:${userKey}`
    const nStored = localStorage.getItem(notifKey)
    const nList = nStored ? JSON.parse(nStored) : []
    const notif = { title, message, time: 'just now', read: false }
    localStorage.setItem(notifKey, JSON.stringify([notif, ...nList]))
  }

  const scheduleToText = (schedule) => {
    if (!schedule) return ''
    const days = (schedule.days || []).join(', ')
    return `${days} ${schedule.startTime} - ${schedule.endTime}`
  }

  const addCourse = (courseData) => {
    const id = Date.now()
    const item = {
      id,
      subjectCode: courseData.courseCode,
      subjectName: courseData.courseName,
      enrolledStudents: 0,
      schedule: scheduleToText(courseData.schedule),
      enrollmentLink: courseData.enrollmentLink || ''
    }
    const next = [item, ...classes]
    persist(next)
    notify('Course created', `${item.subjectCode} • ${item.subjectName}`)
  }

  const deleteCourse = (courseId) => {
    const c = classes.find(x => x.id === courseId)
    const next = classes.filter(c => c.id !== courseId)
    persist(next)
    notify('Course deleted', `${c?.subjectCode || ''} removed`)
  }

  const ensureLink = (courseId) => {
    const idx = classes.findIndex(c => c.id === courseId)
    if (idx === -1) return
    const c = classes[idx]
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const link = c.enrollmentLink && c.enrollmentLink.length > 0 
      ? c.enrollmentLink 
      : `${origin}/enroll/${(c.subjectCode || 'course').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    const next = [...classes]
    next[idx] = { ...c, enrollmentLink: link }
    persist(next)
    return link
  }

  const copyLink = async (courseId) => {
    const link = ensureLink(courseId)
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(courseId)
      setTimeout(() => setCopiedId(null), 2000)
      notify('Enrollment link copied', link)
    } catch {}
  }

  const openAddStudent = (courseId) => {
    setSelectedCourseId(courseId)
    setStudentEmail('')
    setShowAddStudentModal(true)
  }

  const saveAddStudent = async () => {
    if (!selectedCourseId || !studentEmail) return
    const email = studentEmail.trim().toLowerCase()
    try {
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', selectedCourseId)
        .eq('student_email', email)
      if (!existing || existing.length === 0) {
        await supabase
          .from('enrollments')
          .insert([{ course_id: selectedCourseId, student_email: email }])
        const { data: cRow } = await supabase
          .from('courses')
          .select('enrolled_students')
          .eq('id', selectedCourseId)
          .single()
        const next = Math.max(0, (cRow?.enrolled_students || 0) + 1)
        await supabase
          .from('courses')
          .update({ enrolled_students: next })
          .eq('id', selectedCourseId)
      }
    } catch {}

    const idx = classes.findIndex(c => c.id === selectedCourseId)
    if (idx !== -1) {
      const c = classes[idx]
      const updated = [...classes]
      updated[idx] = { ...c, enrolledStudents: (c.enrolledStudents || 0) + 1 }
      persist(updated)
      notify('Student added', `${email} added to ${c.subjectCode}`)
      const sKey = `enrollments:list:${email}`
      const sStored = localStorage.getItem(sKey)
      const sList = sStored ? JSON.parse(sStored) : []
      const exists = sList.some(x => String(x.id) === String(selectedCourseId))
      const item = { id: c.id, subjectCode: c.subjectCode, subjectName: c.subjectName, enrolledStudents: updated[idx].enrolledStudents, schedule: c.schedule }
      localStorage.setItem(sKey, JSON.stringify(exists ? sList : [item, ...sList]))
    }
    setShowAddStudentModal(false)
    setSelectedCourseId(null)
    setStudentEmail('')
  }

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen m-0 p-0'>
      {/* Header Section */}
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <div className='flex items-center justify-between mb-2'>
          <div>
            <h1 className='text-4xl lg:text-5xl font-bold text-slate-800 mb-2'>
              Manage Classes
            </h1>
            <p className='text-slate-600 text-base lg:text-lg font-medium'>
              View and manage all your courses
            </p>
          </div>
          <button 
            onClick={() => setShowAddCourseModal(true)}
            className='bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2'
          >
            <Plus className='w-5 h-5' />
            <span>Add New Course</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className='px-6 lg:px-12 mb-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600 font-medium mb-1'>Total Courses</p>
                <p className='text-3xl font-bold text-[#7A1C1C]'>{classes.length}</p>
              </div>
              <div className='p-4 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg'>
                <BookOpen className='w-8 h-8 text-white' />
              </div>
            </div>
          </div>
          <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600 font-medium mb-1'>Total Students</p>
                <p className='text-3xl font-bold text-[#7A1C1C]'>
                  {classes.reduce((sum, c) => sum + c.enrolledStudents, 0)}
                </p>
              </div>
              <div className='p-4 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg'>
                <Users className='w-8 h-8 text-white' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className='px-6 lg:px-12 pb-12'>
        <div className='bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden'>
          <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
            <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
              <BookOpen className='w-5 h-5 text-[#7A1C1C]' />
              Your Courses
            </h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className='px-6 py-5 hover:bg-slate-50 transition-colors duration-150 cursor-pointer'
                onClick={() => navigate(`/teacher-dashboard/manage-classes/course/${classItem.id}`)}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-start gap-4 flex-1'>
                    <div className='bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg p-3'>
                      <BookOpen className='w-6 h-6 text-white' />
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h3 className='font-bold text-lg text-slate-800'>{classItem.subjectCode}</h3>
                      </div>
                      <p className='text-slate-700 font-medium mb-2'>{classItem.subjectName}</p>
                      <div className='flex items-center gap-4 text-sm text-slate-500'>
                        <span className='flex items-center gap-1'>
                          <Users className='w-4 h-4' />
                          <span>{classItem.enrolledStudents} students</span>
                        </span>
                        <span>•</span>
                        <span>{classItem.schedule}</span>
                        {classItem.enrollmentLink && (
                          <>
                            <span>•</span>
                            <span className='flex items-center gap-1 text-slate-400'>
                              <LinkIcon className='w-3 h-3' />
                              <span>Link ready</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                <div className='flex items-center gap-2 ml-4' onClick={(e) => e.stopPropagation()}>
                    <button 
                      className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'
                      onClick={(e) => {
                        e.stopPropagation()
                        openAddStudent(classItem.id)
                      }}
                      title='Add student'
                    >
                      <Users className='w-5 h-5' />
                    </button>
                    <button 
                      className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'
                      onClick={(e) => {
                        e.stopPropagation()
                        const link = ensureLink(classItem.id)
                        copyLink(classItem.id)
                      }}
                      title='Copy enrollment link'
                    >
                      {copiedId === classItem.id ? <CheckIcon className='w-5 h-5 text-green-600' /> : <CopyIcon className='w-5 h-5' />}
                    </button>
                    <button 
                      className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/teacher-dashboard/manage-classes/course/${classItem.id}`)
                      }}
                      title='Edit course'
                    >
                      <Edit className='w-5 h-5' />
                    </button>
                    <button 
                      className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCourse(classItem.id)
                      }}
                      title='Delete course'
                    >
                      <Trash2 className='w-5 h-5' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <AddCourseModal
          onClose={() => setShowAddCourseModal(false)}
          onSave={(courseData) => {
            addCourse(courseData)
            setShowAddCourseModal(false)
          }}
        />
      )}

      {showAddStudentModal && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-6'>
            <h3 className='text-lg font-bold text-slate-800 mb-4'>Add Student to Course</h3>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>Student Email</label>
            <input
              type='email'
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A1C1C]'
              placeholder='student@example.com'
            />
            <div className='mt-6 flex items-center justify-end gap-3'>
              <button
                onClick={() => { setShowAddStudentModal(false); setSelectedCourseId(null); setStudentEmail('') }}
                className='px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50'
              >
                Cancel
              </button>
              <button
                onClick={saveAddStudent}
                className='px-4 py-2 rounded-lg bg-[#7A1C1C] text-white font-semibold hover:bg-[#5a1515]'
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

