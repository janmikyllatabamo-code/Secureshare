import React, { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Users, Calendar, Plus, FileText, Clock, CheckCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AddAssignmentModal } from './AddAssignmentModal'
import { FilePreviewModal } from '../portal/FilePreviewModal'
import { supabase } from '../../lib/supabase'

export const CourseDetailView = () => {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false)
  
  const [course, setCourse] = useState({
    id: courseId || '1',
    subjectCode: 'Course',
    subjectName: 'Course Details',
    enrolledStudents: 0,
    schedule: '',
    description: ''
  })

  useEffect(() => {
    const authUserRaw = localStorage.getItem('authUser')
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : { role: 'Teacher', email: '' }
    const key = authUser.role === 'Teacher' ? 'Teacher' : (authUser.email || 'Student')
    const storageKey = `classes:list:${key}`
    const stored = localStorage.getItem(storageKey)
    const list = stored ? JSON.parse(stored) : []
    const found = list.find(c => String(c.id) === String(courseId))
    if (found) {
      setCourse({
        id: found.id,
        subjectCode: found.subjectCode,
        subjectName: found.subjectName,
        enrolledStudents: found.enrolledStudents || 0,
        schedule: found.schedule || '',
        description: 'Course details and assignments.'
      })
    } else {
      setCourse(prev => ({ ...prev, id: courseId || prev.id }))
    }
  }, [courseId])

  const [assignments, setAssignments] = useState([])
  const [previewFile, setPreviewFile] = useState(null)

  useEffect(() => {
    const load = async () => {
      // Try Supabase table first
      let list = []
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('id,title,description,due_date,due_time,max_points,material_url,material_name,status,submissions,total_students')
          .eq('course_id', courseId)
          .order('due_date', { ascending: true })
        if (!error && Array.isArray(data)) {
          list = data.map(a => ({
            id: a.id,
            title: a.title,
            description: a.description || '',
            dueDate: a.due_date || '',
            dueTime: a.due_time || '',
            maxPoints: a.max_points || 0,
            status: a.status || 'active',
            submissions: a.submissions || 0,
            totalStudents: a.total_students || course.enrolledStudents,
            attachedFile: a.material_url ? { name: a.material_name || 'Material', url: a.material_url } : null
          }))
        }
      } catch {}

      if (list.length === 0) {
        const key = `assignments:list:${courseId}`
        const stored = localStorage.getItem(key)
        list = stored ? JSON.parse(stored) : []
      }

      setAssignments(list.map(a => ({ ...a, totalStudents: course.enrolledStudents })))
    }
    load()
  }, [courseId, course.enrolledStudents])

  const handleAddAssignment = () => {
    setShowAddAssignmentModal(true)
  }

  const handleCreateAssignment = (assignmentData) => {
    const doSave = async () => {
      let materialUrl = ''
      let materialName = ''
      if (assignmentData.attachedFile && assignmentData.attachedFile.rawFile) {
        try {
          const file = assignmentData.attachedFile.rawFile
          const safeName = file.name.replace(/[^\w\-.]+/g, '_')
          const path = `assignments/${courseId}/${Date.now()}_${safeName}`
          const bucket = 'files'
          const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' })
          if (!error) {
            const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)
            materialUrl = publicData?.publicUrl || ''
            materialName = file.name
          }
        } catch {}
      }

      const newAssignment = {
        id: Date.now(),
        title: assignmentData.title,
        dueDate: assignmentData.dueDate,
        submissions: 0,
        totalStudents: course.enrolledStudents,
        status: 'active',
        description: assignmentData.description || '',
        maxPoints: assignmentData.maxPoints,
        dueTime: assignmentData.dueTime,
        attachedFile: materialUrl ? { name: materialName, url: materialUrl } : assignmentData.attachedFile || null
      }

      // Persist to Supabase table when available
      try {
        await supabase.from('assignments').insert([{
          id: newAssignment.id,
          course_id: courseId,
          title: newAssignment.title,
          description: newAssignment.description,
          due_date: newAssignment.dueDate,
          due_time: newAssignment.dueTime,
          max_points: newAssignment.maxPoints,
          material_url: newAssignment.attachedFile?.url || null,
          material_name: newAssignment.attachedFile?.name || null,
          status: newAssignment.status,
          submissions: newAssignment.submissions,
          total_students: newAssignment.totalStudents
        }])
      } catch {}

      const next = [newAssignment, ...assignments]
      setAssignments(next)
      const key = `assignments:list:${courseId}`
      localStorage.setItem(key, JSON.stringify(next))
    }
    doSave()
  }

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen m-0 p-0'>
      {/* Header Section with Back Button */}
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <button
          onClick={() => navigate('/teacher-dashboard/manage-classes')}
          className='flex items-center gap-2 text-slate-600 hover:text-[#7A1C1C] transition-colors mb-4'
        >
          <ArrowLeft className='w-5 h-5' />
          <span className='font-medium'>Back to Manage Classes</span>
        </button>
        
        <div className='flex items-center justify-between mb-2'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <div className='bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg p-3'>
                <BookOpen className='w-8 h-8 text-white' />
              </div>
              <div>
                <h1 className='text-4xl lg:text-5xl font-bold text-slate-800'>
                  {course.subjectCode}
                </h1>
                <p className='text-slate-600 text-lg font-medium mt-1'>
                  {course.subjectName}
                </p>
              </div>
            </div>
            <p className='text-slate-500 text-sm mt-2 max-w-2xl'>
              {course.description}
            </p>
          </div>
          <button
            onClick={handleAddAssignment}
            className='bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2'
          >
            <Plus className='w-5 h-5' />
            <span>Add Assignment</span>
          </button>
        </div>
      </div>

      {/* Course Info Cards */}
      <div className='px-6 lg:px-12 mb-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
          <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600 font-medium mb-1'>Enrolled Students</p>
                <p className='text-3xl font-bold text-[#7A1C1C]'>{course.enrolledStudents}</p>
              </div>
              <div className='p-4 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg'>
                <Users className='w-8 h-8 text-white' />
              </div>
            </div>
          </div>
          <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600 font-medium mb-1'>Schedule</p>
                <p className='text-sm font-bold text-[#7A1C1C]'>{course.schedule}</p>
              </div>
              <div className='p-4 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg'>
                <Calendar className='w-8 h-8 text-white' />
              </div>
            </div>
          </div>
          <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600 font-medium mb-1'>Total Assignments</p>
                <p className='text-3xl font-bold text-[#7A1C1C]'>{assignments.length}</p>
              </div>
              <div className='p-4 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg'>
                <FileText className='w-8 h-8 text-white' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className='px-6 lg:px-12 pb-12'>
        <div className='bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden'>
          <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
            <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
              <FileText className='w-5 h-5 text-[#7A1C1C]' />
              Assignments
            </h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className='px-6 py-5 hover:bg-slate-50 transition-colors duration-150'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-start gap-4 flex-1'>
                      <div className={`p-2 rounded-lg ${
                        assignment.status === 'active' ? 'bg-blue-50' : 'bg-slate-50'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          assignment.status === 'active' ? 'text-blue-600' : 'text-slate-400'
                        }`} />
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-2'>
                          <h3 className='font-bold text-lg text-slate-800'>{assignment.title}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            assignment.status === 'active' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {assignment.status === 'active' ? 'Active' : 'Upcoming'}
                          </span>
                        </div>
                        <div className='flex items-center gap-4 text-sm text-slate-500'>
                          <span className='flex items-center gap-1'>
                            <Calendar className='w-4 h-4' />
                            <span>Due: {assignment.dueDate}</span>
                          </span>
                          <span>•</span>
                          <span className='flex items-center gap-1'>
                            <CheckCircle className='w-4 h-4' />
                            <span>{assignment.submissions} / {assignment.totalStudents} submitted</span>
                          </span>
                          {assignment.attachedFile && assignment.attachedFile.url && (
                            <>
                              <span>•</span>
                              <button onClick={() => setPreviewFile({ name: assignment.attachedFile.name, url: assignment.attachedFile.url, ext: (assignment.attachedFile.name || '').split('.').pop() })} className='text-[#7A1C1C] font-semibold hover:underline'>Preview material</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/teacher-dashboard/submissions', { state: { courseId: course.id } })}
                      className='ml-4 px-4 py-2 bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold rounded-lg transition-colors text-sm'
                    >
                      View Submissions
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className='px-6 py-12 text-center text-slate-400'>
                <FileText className='w-12 h-12 mx-auto mb-3 opacity-50' />
                <p className='text-sm'>No assignments yet. Click "Add Assignment" to create one.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Assignment Modal */}
      {showAddAssignmentModal && (
        <AddAssignmentModal
          onClose={() => setShowAddAssignmentModal(false)}
          onSave={(assignmentData) => {
            handleCreateAssignment(assignmentData)
            setShowAddAssignmentModal(false)
          }}
        />
      )}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  )
}

