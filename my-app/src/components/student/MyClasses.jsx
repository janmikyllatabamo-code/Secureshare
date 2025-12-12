import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, User, Calendar, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const MyClasses = () => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  useEffect(() => {
    const load = async () => {
      const authUserRaw = localStorage.getItem('authUser')
      const authUser = authUserRaw ? JSON.parse(authUserRaw) : { email: '' }
      let list = []
      try {
        const { data: enrolls, error } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_email', authUser.email)
        if (!error && Array.isArray(enrolls) && enrolls.length > 0) {
          const ids = enrolls.map(e => e.course_id)
          const { data: courses, error: cErr } = await supabase
            .from('courses')
            .select('id,subject_code,subject_name,enrolled_students,schedule')
            .in('id', ids)
          if (!cErr && Array.isArray(courses)) {
            list = courses.map(c => ({
              id: c.id,
              subjectCode: c.subject_code,
              subjectName: c.subject_name,
              enrolledStudents: c.enrolled_students || 0,
              schedule: c.schedule || ''
            }))
          }
        }
      } catch {}
      if (list.length === 0) {
        const storageKey = `enrollments:list:${authUser.email || 'Student'}`
        const stored = localStorage.getItem(storageKey)
        list = stored ? JSON.parse(stored) : []
      }
      setClasses(list)
    }
    load()
  }, [])

  return (
    <div className='container mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen m-0 p-0'>
      {/* Header Section */}
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <div className='mb-2'>
          <h1 className='text-4xl lg:text-5xl font-bold text-slate-800 mb-2'>
            My Classes
          </h1>
          <p className='text-slate-600 text-base lg:text-lg font-medium'>
            View all your enrolled courses
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className='px-6 lg:px-12 mb-8'>
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600 font-medium mb-1'>Total Enrolled Courses</p>
              <p className='text-3xl font-bold text-[#7A1C1C]'>{classes.length}</p>
            </div>
            <div className='p-4 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg'>
              <BookOpen className='w-8 h-8 text-white' />
            </div>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className='px-6 lg:px-12 pb-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className='bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer hover:-translate-y-1'
            >
              {/* Card Header with Gradient */}
              <div className='bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] px-6 py-5'>
                <div className='flex items-start justify-between mb-3'>
                  <div className='bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5'>
                    <p className='text-white font-bold text-lg tracking-wide'>{classItem.subjectCode}</p>
                  </div>
                  <div className='bg-white/20 backdrop-blur-sm rounded-full p-2'>
                    <BookOpen className='w-5 h-5 text-white' />
                  </div>
                </div>
                <h3 className='text-white font-bold text-xl mb-1 line-clamp-2'>
                  {classItem.subjectName}
                </h3>
              </div>

              {/* Card Body */}
              <div className='px-6 py-5 space-y-4'>
                

                {/* Schedule Info */}
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-slate-100 rounded-lg'>
                    <Calendar className='w-4 h-4 text-[#7A1C1C]' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-xs text-slate-500 font-medium mb-0.5'>Schedule</p>
                    <p className='text-sm font-semibold text-slate-800'>
                      {classItem.schedule}
                    </p>
                  </div>
                </div>

                {/* Enrolled Students */}
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-slate-100 rounded-lg'>
                    <Users className='w-4 h-4 text-[#7A1C1C]' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-xs text-slate-500 font-medium mb-0.5'>Enrolled Students</p>
                    <p className='text-sm font-semibold text-slate-800'>
                      {classItem.enrolledStudents} students
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className='px-6 py-4 bg-slate-50 border-t border-slate-100'>
                <button 
                  onClick={() => navigate(`/portal/my-classes/course/${classItem.id}`)}
                  className='w-full bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold py-2.5 rounded-lg transition-colors text-sm'
                >
                  View Course Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


