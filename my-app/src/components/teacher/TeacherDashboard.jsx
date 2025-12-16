import React, { useEffect, useState } from 'react'
import { FileText, Users, CheckCircle, User, Award, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'
import { GradingModal } from './GradingModal'

export const TeacherDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showGradingModal, setShowGradingModal] = useState(false)

  // Get courseId from location state or default to navigating to manage-classes
  const courseId = location.state?.courseId

  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [courseFilterKey, setCourseFilterKey] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('submissions:list')
    const list = stored ? JSON.parse(stored) : []
    const mapped = list.map((sub) => ({
      id: sub.studentId || 'STU-LOCAL',
      name: sub.studentName || 'Student',
      submission: {
        id: sub.id,
        fileName: sub.fileName,
        fileSize: sub.fileSize,
        submittedAt: sub.submittedAt,
        course: sub.course,
        status: sub.status,
        grade: sub.grade,
        feedback: sub.feedback
      }
    }))
    setStudents(mapped)
  }, [])

  useEffect(() => {
    const load = async () => {
      let list = []
      try {
        const authUserRaw = localStorage.getItem('authUser')
        const authUser = authUserRaw ? JSON.parse(authUserRaw) : { role: 'Teacher', email: '' }
        const key = authUser.role === 'Teacher' ? 'Teacher' : (authUser.email || 'Student')

        const { data, error } = await supabase
          .from('courses')
          .select('course_id,subject_code,subject_name,enrolled_students,schedule')
        if (!error && Array.isArray(data)) {
          list = data.map(c => ({
            id: c.course_id,
            subjectCode: c.subject_code,
            subjectName: c.subject_name,
            enrolledStudents: c.enrolled_students || 0,
            schedule: c.schedule || ''
          }))
        }
        if (list.length === 0) {
          const storageKey = `classes:list:${key}`
          const stored = localStorage.getItem(storageKey)
          list = stored ? JSON.parse(stored) : []
        }
      } catch {
        const storageKey = 'classes:list:Teacher'
        const stored = localStorage.getItem(storageKey)
        list = stored ? JSON.parse(stored) : []
      }
      setClasses(list)
    }
    load()
  }, [])

  useEffect(() => {
    if (!courseId || classes.length === 0) {
      setCourseFilterKey(null)
      return
    }
    const found = classes.find(c => String(c.id) === String(courseId))
    if (found) {
      setCourseFilterKey(`${found.subjectCode} - ${found.subjectName}`)
    } else {
      setCourseFilterKey(null)
    }
  }, [classes, courseId])

  const handleStudentClick = (student) => {
    // Only allow clicking if student has a submission
    if (!student.submission) {
      return
    }
    setSelectedStudent(student)
    setShowGradingModal(true)
  }

  const handleSaveGrade = (gradeData) => {
    const stored = localStorage.getItem('submissions:list')
    const list = stored ? JSON.parse(stored) : []
    const updated = list.map((s) => s.id === gradeData.submissionId ? { ...s, grade: gradeData.grade, feedback: gradeData.feedback || '', status: 'graded', gradedAt: new Date().toISOString() } : s)
    localStorage.setItem('submissions:list', JSON.stringify(updated))
    const notifKey = gradeData.studentId ? `notifications:${gradeData.studentId}` : 'notifications:Student'
    const nStored = localStorage.getItem(notifKey)
    const nList = nStored ? JSON.parse(nStored) : []
    const notif = { title: 'Grade received', message: `Your assignment has been graded: ${gradeData.grade}`, time: 'just now', read: false }
    localStorage.setItem(notifKey, JSON.stringify([notif, ...nList]))
    setStudents(prev => prev.map(st => st.submission && st.submission.id === gradeData.submissionId ? { ...st, submission: { ...st.submission, grade: gradeData.grade, feedback: gradeData.feedback || '', status: 'graded' } } : st))
    setShowGradingModal(false)
    setSelectedStudent(null)
  }

  const filteredStudents = courseFilterKey 
    ? students.filter(s => s.submission && s.submission.course === courseFilterKey)
    : students
  const pendingCount = filteredStudents.filter(s => s.submission && s.submission.status === 'pending').length
  const gradedCount = filteredStudents.filter(s => s.submission && s.submission.status === 'graded').length
  const totalStudentsAcrossClasses = classes.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0)
  const activeCourses = courseId ? 1 : classes.length
  const currentCourse = courseId ? classes.find(c => String(c.id) === String(courseId)) : null

  const handleBack = () => {
    if (courseId) {
      navigate(`/teacher-dashboard/manage-classes/course/${courseId}`)
    } else {
      navigate('/teacher-dashboard/manage-classes')
    }
  }

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen m-0 p-0'>
      {/* Header with Back Button */}
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <button
          onClick={handleBack}
          className='flex items-center gap-2 text-slate-600 hover:text-[#7A1C1C] transition-colors mb-4'
        >
          <ArrowLeft className='w-5 h-5' />
          <span className='font-medium'>Back to Assignment</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className='px-6 lg:px-12 mb-8'>
        <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
          <li className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-default group'>
            <div className='flex items-center justify-between mb-3'>
              <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Pending Grades</p>
              <FileText className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
            </div>
            <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{pendingCount}</span>
            <p className='text-xs text-slate-500'>Requires attention</p>
          </li>
          <li className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-default group'>
            <div className='flex items-center justify-between mb-3'>
              <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Graded</p>
              <CheckCircle className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
            </div>
            <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{gradedCount}</span>
            <p className='text-xs text-slate-500'>Completed</p>
          </li>
          <li className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-default group'>
            <div className='flex items-center justify-between mb-3'>
              <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Total Students</p>
              <Users className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
            </div>
            <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{currentCourse ? currentCourse.enrolledStudents || 0 : totalStudentsAcrossClasses}</span>
            <p className='text-xs text-slate-500'>Across all classes</p>
          </li>
          <li className='bg-white hover:bg-gradient-to-br hover:from-white hover:to-slate-50 w-full px-6 py-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-default group'>
            <div className='flex items-center justify-between mb-3'>
              <p className='font-semibold text-slate-600 text-sm uppercase tracking-wide'>Active Courses</p>
              <Award className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
            </div>
            <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{activeCourses}</span>
            <p className='text-xs text-slate-500'>Active</p>
          </li>
        </ul>
      </div>

      {/* Main Content Section - Student Names List */}
      <section className='px-6 lg:px-12 pb-12'>
        <div className='w-full rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden'>
          <div className='bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200'>
            <h2 className='font-bold text-xl text-slate-800 flex items-center gap-2'>
              <Users className='w-5 h-5 text-[#7A1C1C]' />
              Students
            </h2>
          </div>
          <div className='overflow-y-auto max-h-[600px]'>
            <ul className='divide-y divide-slate-100'>
              {filteredStudents.map((student) => {
                const hasSubmission = !!student.submission
                return (
                  <li 
                    key={student.id} 
                    className={`px-6 py-4 transition-colors duration-150 group ${
                      hasSubmission 
                        ? 'hover:bg-slate-50 cursor-pointer' 
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => handleStudentClick(student)}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4 flex-1'>
                        <div className={`p-2 rounded-lg transition-colors ${
                          hasSubmission 
                            ? 'bg-slate-100 group-hover:bg-[#7A1C1C]/10' 
                            : 'bg-slate-100'
                        }`}>
                          <User className={`w-5 h-5 ${hasSubmission ? 'text-[#7A1C1C]' : 'text-slate-400'}`} />
                        </div>
                        <div className='flex-1'>
                          <p className={`font-semibold mb-1 text-lg transition-colors ${
                            hasSubmission 
                              ? 'text-slate-800 group-hover:text-[#7A1C1C]' 
                              : 'text-slate-500'
                          }`}>
                            {student.name}
                          </p>
                          <p className='text-xs text-slate-500'>
                            Student ID: {student.id}
                          </p>
                        </div>
                      </div>
                      <div className='ml-4 flex items-center gap-3'>
                        {student.submission ? (
                          <>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              student.submission.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {student.submission.status === 'pending' ? 'Pending' : 'Graded'}
                            </span>
                            {student.submission.grade && (
                              <span className='font-semibold text-[#7A1C1C]'>
                                {student.submission.grade}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className='px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-500'>
                            No Submission
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Grading Modal */}
      {showGradingModal && selectedStudent && (
        <GradingModal
          student={selectedStudent}
          submission={selectedStudent.submission}
          onClose={() => {
            setShowGradingModal(false)
            setSelectedStudent(null)
          }}
          onSave={handleSaveGrade}
        />
      )}
    </div>
  )
}

