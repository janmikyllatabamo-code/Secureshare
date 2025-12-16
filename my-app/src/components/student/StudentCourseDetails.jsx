import React, { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Users, Calendar, FileText, Clock } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AssignmentSubmissionModal } from './AssignmentSubmissionModal'
import { supabase } from '../../lib/supabase'

export const StudentCourseDetails = () => {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  
  const [course, setCourse] = useState({
    id: courseId || '1',
    subjectCode: 'Course',
    subjectName: 'Course Details',
    enrolledStudents: 0,
    schedule: '',
    description: ''
  })

  useEffect(() => {
    const load = async () => {
      let foundCourse = null
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('course_id,subject_code,subject_name,enrolled_students,schedule')
          .eq('course_id', courseId)
          .single()
        if (!error && data) {
          foundCourse = {
            id: data.course_id,
            subjectCode: data.subject_code,
            subjectName: data.subject_name,
            enrolledStudents: data.enrolled_students || 0,
            schedule: data.schedule || '',
            description: 'Course details and assignments.'
          }
        }
      } catch {}
      if (!foundCourse) {
        const storageKey = 'classes:list:Teacher'
        const stored = localStorage.getItem(storageKey)
        const list = stored ? JSON.parse(stored) : []
        const f = list.find(c => String(c.id) === String(courseId))
        if (f) {
          foundCourse = {
            id: f.id,
            subjectCode: f.subjectCode,
            subjectName: f.subjectName,
            enrolledStudents: f.enrolledStudents || 0,
            schedule: f.schedule || '',
            description: 'Course details and assignments.'
          }
        }
      }
      if (foundCourse) {
        setCourse(foundCourse)
      } else {
        setCourse(prev => ({ ...prev, id: courseId || prev.id }))
      }
    }
    load()
  }, [courseId])

  const [assignments, setAssignments] = useState([])

  useEffect(() => {
    const load = async () => {
      let courseAssignments = []
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('id,title,description,due_date,status')
          .eq('course_id', courseId)
        if (!error && Array.isArray(data)) {
          courseAssignments = data.map(a => ({
            id: a.id,
            title: a.title || 'Assignment',
            dueDate: a.due_date || '',
            status: 'not_started',
            grade: null,
            submittedAt: null
          }))
        }
      } catch {}

      if (courseAssignments.length === 0) {
        const key = `assignments:list:${courseId}`
        const stored = localStorage.getItem(key)
        const list = stored ? JSON.parse(stored) : []
        courseAssignments = list.map(a => ({
          id: a.id,
          title: a.title || 'Assignment',
          dueDate: a.dueDate || a.due_time || '',
          status: 'not_started',
          grade: null,
          submittedAt: null
        }))
      }

      const authUserRaw = localStorage.getItem('authUser')
      const authUser = authUserRaw ? JSON.parse(authUserRaw) : { email: '' }
      let mine = []
      try {
        const { data: sRows } = await supabase
          .from('submissions')
          .select('assignment_id,status,grade,submitted_at')
          .eq('course_id', courseId)
          .eq('student_email', authUser.email)
        if (Array.isArray(sRows)) {
          mine = sRows.map(r => ({ assignmentId: r.assignment_id, status: r.status, grade: r.grade, submittedAt: r.submitted_at }))
        }
      } catch {}
      if (mine.length === 0) {
        const sStored = localStorage.getItem('submissions:list')
        const sList = sStored ? JSON.parse(sStored) : []
        mine = sList.filter(s => s.studentId === authUser.email)
      }

      const merged = courseAssignments.map(a => {
        const sub = mine.find(s => (s.assignmentId && s.assignmentId === a.id) || s.title === a.title)
        if (!sub) return a
        const st = sub.status === 'graded' ? 'submitted' : (sub.status === 'pending' ? 'pending' : 'not_started')
        return {
          ...a,
          status: st,
          grade: sub.grade || null,
          submittedAt: sub.submittedAt || null
        }
      })

      setAssignments(merged)
    }
    load()
  }, [courseId])

  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment)
    setShowSubmissionModal(true)
  }

  const handleSubmitAssignment = (submissionData) => {
    const authUserRaw = localStorage.getItem('authUser')
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : { fullName: 'Student', email: '', role: 'Student', id: 'guest' }
    const file = submissionData.file
    if (!file) return

    const safeName = (file.name || 'submission').replace(/[^\w\-.]+/g, '_')
    const userId = authUser.id || 'guest'
    const path = `${userId}/submissions/${Date.now()}_${safeName}`
    const bucket = 'files'

    const upload = async () => {
      try {
        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' })
        if (error) throw error

        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)
        const fileUrl = publicData?.publicUrl || ''

        await supabase
          .from('submissions')
          .insert([{
            course_id: Number(courseId),
            assignment_id: submissionData.assignmentId,
            student_email: authUser.email,
            student_name: authUser.fullName,
            file_name: file.name,
            file_size_bytes: file.size,
            file_url: fileUrl,
            bucket,
            path,
            status: 'pending'
          }])

        const record = {
          id: Date.now(),
          fileName: file.name,
          fileSize: `${(file.size / (1024*1024)).toFixed(1)} MB`,
          submittedAt: new Date().toLocaleString(),
          course: `${course.subjectCode} - ${course.subjectName}`,
          status: 'pending',
          grade: null,
          feedback: null,
          studentName: authUser.fullName,
          studentId: authUser.email || 'STU-LOCAL',
          assignmentId: submissionData.assignmentId
        }
        const stored = localStorage.getItem('submissions:list')
        const list = stored ? JSON.parse(stored) : []
        localStorage.setItem('submissions:list', JSON.stringify([record, ...list]))

        const notifKey = 'notifications:Teacher'
        const nStored = localStorage.getItem(notifKey)
        const nList = nStored ? JSON.parse(nStored) : []
        const notif = { title: 'New assignment submission', message: `${authUser.fullName} submitted ${record.fileName}`, time: 'just now', read: false }
        localStorage.setItem(notifKey, JSON.stringify([notif, ...nList]))

        setAssignments(prev => prev.map(a => a.id === submissionData.assignmentId ? { ...a, status: 'pending', submittedAt: new Date().toLocaleDateString() } : a))
        setShowSubmissionModal(false)
        setSelectedAssignment(null)
      } catch {}
    }
    upload()
  }

  const handleLeaveClass = async () => {
    const authUserRaw = localStorage.getItem('authUser')
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : { email: '' }

    try {
      await supabase
        .from('enrollments')
        .delete()
        .eq('course_id', courseId)
        .eq('student_email', authUser.email)

      const { data: courseRow } = await supabase
        .from('courses')
        .select('enrolled_students')
        .eq('id', courseId)
        .single()
      const current = courseRow?.enrolled_students || 0
      const next = Math.max(0, current - 1)
      await supabase
        .from('courses')
        .update({ enrolled_students: next })
        .eq('id', courseId)
    } catch {}

    const enrollKey = `enrollments:list:${authUser.email || 'Student'}`
    const storedEnroll = localStorage.getItem(enrollKey)
    const enrollList = storedEnroll ? JSON.parse(storedEnroll) : []
    const nextEnroll = enrollList.filter(c => String(c.id) !== String(courseId))
    localStorage.setItem(enrollKey, JSON.stringify(nextEnroll))

    const classesKey = 'classes:list:Teacher'
    const storedClasses = localStorage.getItem(classesKey)
    const classList = storedClasses ? JSON.parse(storedClasses) : []
    const idx = classList.findIndex(c => String(c.id) === String(courseId))
    if (idx !== -1) {
      const c = classList[idx]
      const updated = [...classList]
      updated[idx] = { ...c, enrolledStudents: Math.max(0, (c.enrolledStudents || 0) - 1) }
      localStorage.setItem(classesKey, JSON.stringify(updated))
    }

    navigate('/portal/my-classes')
  }

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen m-0 p-0'>
      {/* Header Section with Back Button */}
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <button
          onClick={() => navigate('/portal/my-classes')}
          className='flex items-center gap-2 text-slate-600 hover:text-[#7A1C1C] transition-colors mb-4'
        >
          <ArrowLeft className='w-5 h-5' />
          <span className='font-medium'>Back to My Classes</span>
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
            onClick={handleLeaveClass}
            className='bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors'
          >
            Leave Class
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
              My Assignments
            </h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                onClick={() => handleAssignmentClick(assignment)}
                className='px-6 py-5 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-start gap-4 flex-1'>
                    <div className={`p-2 rounded-lg ${
                      assignment.status === 'submitted' ? 'bg-green-50' : 
                      assignment.status === 'pending' ? 'bg-yellow-50' : 'bg-slate-50'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        assignment.status === 'submitted' ? 'text-green-600' : 
                        assignment.status === 'pending' ? 'text-yellow-600' : 'text-slate-400'
                      }`} />
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h3 className='font-bold text-lg text-slate-800 group-hover:text-[#7A1C1C] transition-colors'>{assignment.title}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          assignment.status === 'submitted' 
                            ? 'bg-green-100 text-green-800' 
                            : assignment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {assignment.status === 'submitted' ? 'Submitted' : 
                           assignment.status === 'pending' ? 'Pending' : 'Not Started'}
                        </span>
                      </div>
                      <div className='flex items-center gap-4 text-sm text-slate-500'>
                        <span className='flex items-center gap-1'>
                          <Clock className='w-4 h-4' />
                          <span>Due: {assignment.dueDate}</span>
                        </span>
                        {assignment.submittedAt && (
                          <>
                            <span>•</span>
                            <span>Submitted: {assignment.submittedAt}</span>
                          </>
                        )}
                        {assignment.grade && (
                          <>
                            <span>•</span>
                            <span className='font-semibold text-[#7A1C1C]'>Grade: {assignment.grade}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Submission Modal */}
      {showSubmissionModal && selectedAssignment && (
        <AssignmentSubmissionModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowSubmissionModal(false)
            setSelectedAssignment(null)
          }}
          onSubmit={handleSubmitAssignment}
        />
      )}
    </div>
  )
}

