import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { BookOpen, Users, Plus, Edit, Trash2, Mail, Loader2, X, User } from 'lucide-react'
import { AddCourseModal } from './AddCourseModal'
import { supabase } from '../../lib/supabase'

export const ManageClasses = () => {
  const navigate = useNavigate()
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [userKey, setUserKey] = useState('Teacher')
  const [classes, setClasses] = useState([])
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [studentEmail, setStudentEmail] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null) // Single selected student object
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const inputContainerRef = useRef(null)

  useEffect(() => {
    const authUserRaw = localStorage.getItem('authUser')
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : { role: 'Teacher', email: '' }
    const key = authUser.role === 'Teacher' ? 'Teacher' : (authUser.email || 'Student')
    setUserKey(key)
  }, [])

  const loadCourses = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback to localStorage
        const storageKey = `classes:list:${userKey}`
        const stored = localStorage.getItem(storageKey)
        const list = stored ? JSON.parse(stored) : []
        setClasses(list)
        return
      }

      // Load courses from database
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('course_id, subject_code, subject_name, schedule_days, start_time, end_time, enrolled_students')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading courses:', error)
        // If table doesn't exist (404), show empty list
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Courses table does not exist yet. Please run CREATE_COURSES_TABLE.sql in Supabase Dashboard.')
          setClasses([])
          return
        }
        // Fallback to localStorage
        const storageKey = `classes:list:${userKey}`
        const stored = localStorage.getItem(storageKey)
        const list = stored ? JSON.parse(stored) : []
        setClasses(list)
        return
      }

      // Transform database data to component format
      const formattedCourses = (coursesData || []).map(course => ({
        id: course.course_id,
        subjectCode: course.subject_code,
        subjectName: course.subject_name,
        enrolledStudents: course.enrolled_students || 0,
        schedule: course.schedule_days && course.start_time && course.end_time
          ? `${course.schedule_days.join(', ')} ${course.start_time} - ${course.end_time}`
          : ''
      }))

      setClasses(formattedCourses)

      // Also update localStorage for backward compatibility
      const storageKey = `classes:list:${userKey}`
      localStorage.setItem(storageKey, JSON.stringify(formattedCourses))
    } catch (err) {
      console.error('Error in loadCourses:', err)
      // Fallback to localStorage
      const storageKey = `classes:list:${userKey}`
      const stored = localStorage.getItem(storageKey)
      const list = stored ? JSON.parse(stored) : []
      setClasses(list)
    }
  }

  useEffect(() => {
    loadCourses()
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

  const addCourse = async (courseData) => {
    try {
      // Get current user's ID (teacher_id = auth.uid())
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !user.id) {
        notify('Error', 'You must be logged in to create a course')
        return
      }

      // Use auth.uid() directly (user.id) as teacher_id
      const teacherId = user.id

      // Save course to database with new structure
      const { data: courseRecord, error: courseError } = await supabase
        .from('courses')
        .insert({
          teacher_id: teacherId,
          subject_code: courseData.courseCode,
          subject_name: courseData.courseName,
          schedule_days: courseData.schedule.days, // Array of days
          start_time: courseData.schedule.startTime,
          end_time: courseData.schedule.endTime,
          semester: 'Current',
          academic_year: new Date().getFullYear().toString()
        })
        .select('course_id, subject_code, subject_name, schedule_days, start_time, end_time')
        .single()

      if (courseError) {
        console.error('Error creating course:', courseError)
        notify('Error', `Failed to create course: ${courseError.message}`)
        return
      }

      // Format schedule for display
      const scheduleText = scheduleToText({
        days: courseRecord.schedule_days || courseData.schedule.days,
        startTime: courseRecord.start_time || courseData.schedule.startTime,
        endTime: courseRecord.end_time || courseData.schedule.endTime
      })

      // Reload courses from database to get the latest data
      await loadCourses()
      
      notify('Course created', `${courseRecord.subject_code} • ${courseRecord.subject_name}`)
    } catch (err) {
      console.error('Error in addCourse:', err)
      notify('Error', 'Failed to create course')
    }
  }

  const deleteCourse = async (courseId) => {
    const c = classes.find(x => x.id === courseId)
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('course_id', courseId)

      if (error) {
        console.error('Error deleting course:', error)
        notify('Error', `Failed to delete course: ${error.message}`)
        return
      }

      // Reload courses from database
      await loadCourses()
      
      notify('Course deleted', `${c?.subjectCode || ''} removed`)
    } catch (err) {
      console.error('Error in deleteCourse:', err)
      notify('Error', 'Failed to delete course')
    }
  }


  // Get current user's email on mount
  useEffect(() => {
    const getCurrentUserEmail = async () => {
      try {
        // Try to get from localStorage first (faster)
        const authUser = localStorage.getItem('authUser')
        if (authUser) {
          try {
            const user = JSON.parse(authUser)
            if (user.email) {
              setCurrentUserEmail(user.email.toLowerCase())
              return
            }
          } catch (e) {
            console.warn('Error parsing authUser:', e)
          }
        }

        // Fallback: Get from Supabase auth
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
          setCurrentUserEmail(user.email.toLowerCase())
        }
      } catch (err) {
        console.error('Error getting current user email:', err)
      }
    }

    getCurrentUserEmail()
  }, [])

  // Update dropdown position when input is focused or suggestions change
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (inputContainerRef.current) {
        const rect = inputContainerRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4, // 4px margin below input
          left: rect.left + window.scrollX,
          width: rect.width
        })
      }
    }

    if (showSuggestions && inputContainerRef.current) {
      updateDropdownPosition()
      window.addEventListener('scroll', updateDropdownPosition, true)
      window.addEventListener('resize', updateDropdownPosition)
    }

    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [showSuggestions, suggestions])

  // Search for registered students as user types (triggers on first letter)
  useEffect(() => {
    const searchStudents = async () => {
      // Show suggestions as soon as user types (even 1 character)
      if (!emailInput.trim() || emailInput.length === 0) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      // Don't search if user is typing an email that's already selected
      if (selectedStudent && selectedStudent.email.toLowerCase() === emailInput.toLowerCase()) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setSearching(true)
      try {
        // Search ONLY students from users table
        // Searches by email, full_name, first_name, or last_name (case-insensitive)
        const searchTerm = emailInput.toLowerCase().trim()
        
        // Query users table - ONLY students (role = 'student')
        const { data: users, error } = await supabase
          .from('users')
          .select('email, full_name, first_name, last_name, role')
          .eq('role', 'student') // Only students
          .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
          .limit(50)
        
        // Check for errors FIRST
        if (error) {
          console.error('❌ Error searching students:', error)
          if (error.message?.includes('policy') || error.message?.includes('RLS') || 
              error.code === '42501' || error.code === 'PGRST301' ||
              error.message?.includes('permission denied')) {
            console.error('🚫 RLS policy is blocking student search!')
            setSuggestions([])
          } else {
            console.warn('Search error (non-RLS):', error.message)
            setSuggestions([])
          }
          setSearching(false)
          return
        }

        // Handle empty results
        if (!users || users.length === 0) {
          setSuggestions([])
          setShowSuggestions(false)
          setSearching(false)
          return
        }

        // Filter out current user's email (exclude self)
        const filteredStudents = (users || []).filter(user => {
          const emailLower = user.email.toLowerCase()
          return emailLower !== currentUserEmail // Exclude self
        })

        // Sort alphabetically by name
        const sortedStudents = [...filteredStudents].sort((a, b) => {
          const aName = (a.full_name || a.email || '').toLowerCase()
          const bName = (b.full_name || b.email || '').toLowerCase()
          return aName.localeCompare(bName)
        })

        setSuggestions(sortedStudents)
        setShowSuggestions(sortedStudents.length > 0)
      } catch (err) {
        console.error('Search error:', err)
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }

    // Debounce search
    const debounceTimer = setTimeout(searchStudents, 200)
    return () => clearTimeout(debounceTimer)
  }, [emailInput, currentUserEmail, selectedStudent])

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputContainerRef.current && !inputContainerRef.current.contains(event.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openAddStudent = (courseId) => {
    setSelectedCourseId(courseId)
    setStudentEmail('')
    setEmailInput('')
    setSelectedStudent(null)
    setSuggestions([])
    setShowSuggestions(false)
    setShowAddStudentModal(true)
  }

  const handleSelectStudent = (student) => {
    const studentObj = {
      email: student.email,
      name: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.email,
      role: student.role
    }
    setSelectedStudent(studentObj)
    setStudentEmail(student.email) // Set the email for the save function
    setEmailInput('') // Clear input after selection
    setSuggestions([]) // Clear suggestions
    setShowSuggestions(false) // Hide suggestions
    inputRef.current?.focus() // Keep focus on input
  }

  const handleRemoveStudent = () => {
    setSelectedStudent(null)
    setStudentEmail('')
    setEmailInput('')
    inputRef.current?.focus()
  }

  const saveAddStudent = async () => {
    // Use selectedStudent email if available, otherwise use studentEmail
    const emailToUse = selectedStudent?.email || studentEmail?.trim().toLowerCase()
    if (!selectedCourseId || !emailToUse) {
      console.warn('Missing course ID or email:', { selectedCourseId, emailToUse })
      notify('Error', 'Please select a student to add')
      return
    }
    const email = emailToUse.trim().toLowerCase()
    
    console.log('Adding student:', { email, courseId: selectedCourseId })
    
    try {
      // Get the actual course UUID first (before checking enrollment)
      // Handle both UUID (from database) and number (from localStorage) formats
      let courseIdForQuery = selectedCourseId
      
      // If selectedCourseId is a number (from old localStorage), convert to UUID
      if (typeof selectedCourseId === 'number' || (typeof selectedCourseId === 'string' && !selectedCourseId.includes('-'))) {
        console.log('Converting numeric course ID to UUID:', selectedCourseId)
        
        // First, try to find in local classes array
        const localCourse = classes.find(c => c.id === selectedCourseId || String(c.id) === String(selectedCourseId))
        
        if (localCourse && localCourse.subjectCode) {
          // Try to find by subject_code in database to get UUID
          const { data: courseByCode, error: codeError } = await supabase
            .from('courses')
            .select('course_id')
            .eq('subject_code', localCourse.subjectCode)
            .limit(1)
            .maybeSingle()
          
          if (!codeError && courseByCode && courseByCode.course_id) {
            courseIdForQuery = courseByCode.course_id
            console.log('Found course UUID by subject_code:', courseIdForQuery)
          } else {
            // Course not in database - need to create it first
            console.log('Course not found in database, creating it now...')
            
            // Create the course in the database
            // Note: enrolled_students will default to 0 if column exists, or be calculated from enrollments
            const courseInsertData = {
              subject_code: localCourse.subjectCode,
              subject_name: localCourse.subjectName,
              schedule: localCourse.schedule || '',
              semester: 'Current',
              academic_year: new Date().getFullYear().toString()
            }
            
            // Only include enrolled_students if the column exists (will be handled by default or trigger)
            const { data: newCourse, error: createError } = await supabase
              .from('courses')
              .insert(courseInsertData)
              .select('course_id')
              .single()
            
            if (createError || !newCourse) {
              console.error('Error creating course in database:', createError)
              notify('Error', `Failed to save course to database: ${createError?.message || 'Unknown error'}. Please create the course again.`)
              setShowAddStudentModal(false)
              setSelectedCourseId(null)
              setStudentEmail('')
              setEmailInput('')
              setSelectedStudent(null)
              setSuggestions([])
              setShowSuggestions(false)
              return
            }
            
            courseIdForQuery = newCourse.course_id
            console.log('Created course in database with UUID:', courseIdForQuery)
            
            // Update local classes array with the new UUID
            const updatedClasses = classes.map(c => 
              c.id === selectedCourseId || String(c.id) === String(selectedCourseId)
                ? { ...c, id: courseIdForQuery }
                : c
            )
            persist(updatedClasses)
          }
        } else {
          console.error('Course not found in local classes array')
          notify('Error', 'Course not found. Please refresh the page and try again.')
          setShowAddStudentModal(false)
          setSelectedCourseId(null)
          setStudentEmail('')
          setEmailInput('')
          setSelectedStudent(null)
          setSuggestions([])
          setShowSuggestions(false)
          return
        }
      }
      
      // Validate that we have a valid UUID (must contain hyphens)
      if (!courseIdForQuery || (typeof courseIdForQuery === 'string' && !courseIdForQuery.includes('-'))) {
        console.error('Invalid course ID format (not a UUID):', courseIdForQuery, 'Type:', typeof courseIdForQuery)
        notify('Error', 'Invalid course ID format. The course must be saved to the database first.')
        setShowAddStudentModal(false)
        setSelectedCourseId(null)
        setStudentEmail('')
        setEmailInput('')
        setSelectedStudent(null)
        setSuggestions([])
        setShowSuggestions(false)
        return
      }
      
      console.log('Using course UUID:', courseIdForQuery)

      // Get student's user_id first (needed for enrollment check)
      const { data: studentDataForCheck, error: studentCheckError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', email)
        .eq('role', 'student')
        .maybeSingle()

      if (studentCheckError || !studentDataForCheck || !studentDataForCheck.user_id) {
        console.error('Error looking up student for check:', studentCheckError)
        notify('Error', `Student with email ${email} not found`)
        setShowAddStudentModal(false)
        setSelectedCourseId(null)
        setStudentEmail('')
        setEmailInput('')
        setSelectedStudent(null)
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      // Check if student is already enrolled using student_id and course_id (UUID)
      const { data: existing, error: checkError } = await supabase
        .from('enrollments')
        .select('enrollment_id')
        .eq('course_id', courseIdForQuery)
        .eq('student_id', studentDataForCheck.user_id)
      
      if (checkError) {
        console.error('Error checking enrollment:', checkError)
        notify('Error', `Failed to check enrollment: ${checkError.message}`)
        // Close modal on error
        setShowAddStudentModal(false)
        setSelectedCourseId(null)
        setStudentEmail('')
        setEmailInput('')
        setSelectedStudent(null)
        setSuggestions([])
        setShowSuggestions(false)
        return
      }
      
      if (existing && existing.length > 0) {
        // Student already enrolled, show message and return
        notify('Student already enrolled', `${email} is already enrolled in this course`)
        setShowAddStudentModal(false)
        setSelectedCourseId(null)
        setStudentEmail('')
        setEmailInput('')
        setSelectedStudent(null)
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      // Get course information for notification and activity log
      // courseIdForQuery was already set above, just use it

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('course_id, subject_code, subject_name, schedule_days, start_time, end_time')
        .eq('course_id', courseIdForQuery)
        .single()

      // Get enrolled_students count separately (in case column doesn't exist)
      let enrolledCount = 0
      const { count: enrolledCountResult } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseIdForQuery)
        .eq('status', 'Active')
      if (enrolledCountResult !== null) {
        enrolledCount = enrolledCountResult
      }

      if (courseError) {
        console.error('Error fetching course:', courseError)
        console.error('Tried course_id:', courseIdForQuery, 'Type:', typeof courseIdForQuery)
        notify('Error', `Failed to fetch course information: ${courseError.message}`)
        // Close modal on error
        setShowAddStudentModal(false)
        setSelectedCourseId(null)
        setStudentEmail('')
        setEmailInput('')
        setSelectedStudent(null)
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      // Use studentDataForCheck that we already fetched above
      const studentData = studentDataForCheck

      // Insert enrollment using UUID course_id and UUID student_id
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert([{ 
          course_id: courseIdForQuery, // Use the UUID
          student_id: studentData.user_id, // Use UUID
          status: 'Active'
        }])

      if (enrollError) {
        console.error('Error enrolling student:', enrollError)
        notify('Error', `Failed to enroll student: ${enrollError.message}`)
        // Close modal on error
        setShowAddStudentModal(false)
        setSelectedCourseId(null)
        setStudentEmail('')
        setEmailInput('')
        setSelectedStudent(null)
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      console.log('Enrollment successful, updating course count...')

      // Update enrolled_students count (if column exists)
      // Calculate from actual enrollments to ensure accuracy
      const { count: enrollmentCount, error: countError } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseIdForQuery)
        .eq('status', 'Active')
      
      if (!countError && enrollmentCount !== null) {
        // Update the enrolled_students count in courses table
        const { error: updateError } = await supabase
          .from('courses')
          .update({ enrolled_students: enrollmentCount })
          .eq('course_id', courseIdForQuery)
        
        if (updateError) {
          // Column might not exist, that's okay - we'll just calculate it dynamically
          console.warn('Error updating course count (column may not exist):', updateError)
        }
      }
      
      // Log activity for the student (use studentData we already have)
      if (studentData && studentData.user_id) {
        try {
          await supabase.from('activity_log').insert({
            user_id: studentData.user_id,
            action_type: 'enrolled',
            file_name: `${courseData.subject_code} - ${courseData.subject_name}`,
            file_id: null,
            details: {
              course_id: courseIdForQuery,
              course_code: courseData.subject_code,
              course_name: courseData.subject_name,
              enrolled_by: 'teacher'
            }
          })
        } catch (activityError) {
          console.warn('Failed to log enrollment activity (non-critical):', activityError)
        }
      }

      // Create notification for the student
      const notification = {
        title: 'Enrolled in Course',
        message: `You have been enrolled in ${courseData.subject_code} - ${courseData.subject_name}`,
        time: 'just now',
        read: false
      }

      // Save notification to localStorage for the student
      const studentNotifKey = `notifications:${email}`
      const existingNotifs = localStorage.getItem(studentNotifKey)
      const notifList = existingNotifs ? JSON.parse(existingNotifs) : []
      localStorage.setItem(studentNotifKey, JSON.stringify([notification, ...notifList]))

      // Format schedule for display
      const scheduleText = courseData.schedule_days && courseData.start_time && courseData.end_time
        ? `${courseData.schedule_days.join(', ')} ${courseData.start_time} - ${courseData.end_time}`
        : ''

      // Also update localStorage enrollment list for the student (for My Classes page)
      const sKey = `enrollments:list:${email}`
      const sStored = localStorage.getItem(sKey)
      const sList = sStored ? JSON.parse(sStored) : []
      const exists = sList.some(x => String(x.id) === String(courseData.course_id) || String(x.id) === String(courseIdForQuery))
      if (!exists) {
        const item = {
          id: courseData.course_id, // Use UUID from database
          subjectCode: courseData.subject_code,
          subjectName: courseData.subject_name,
          enrolledStudents: enrollmentCount || 0,
          schedule: scheduleText
        }
        localStorage.setItem(sKey, JSON.stringify([item, ...sList]))
      }

      // Reload courses to get updated enrolled_students count
      await loadCourses()

      // Dispatch event to refresh My Classes page (if student is currently viewing it)
      window.dispatchEvent(new Event('app:enrollments:updated'))
      
      // Show success notification
      notify('Student added', `${email} added to ${courseData.subject_code}`)
      
      console.log('Student enrollment completed successfully')
      
    } catch (err) {
      console.error('Error in saveAddStudent:', err)
      notify('Error', `Failed to add student to course: ${err.message || 'Unknown error'}`)
    } finally {
      // Always close modal and reset state
      setShowAddStudentModal(false)
      setSelectedCourseId(null)
      setStudentEmail('')
      setEmailInput('')
      setSelectedStudent(null)
      setSuggestions([])
      setShowSuggestions(false)
    }
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
                      </div>
                    </div>
                  </div>
                <div className='flex items-center gap-2 ml-4 relative z-10' onClick={(e) => e.stopPropagation()}>
                    <button 
                      type='button'
                      className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative z-10 cursor-pointer'
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openAddStudent(classItem.id)
                      }}
                      title='Add student'
                    >
                      <Users className='w-5 h-5' />
                    </button>
                    <button 
                      type='button'
                      className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative z-10 cursor-pointer'
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        navigate(`/teacher-dashboard/manage-classes/course/${classItem.id}`)
                      }}
                      title='Edit course'
                    >
                      <Edit className='w-5 h-5' />
                    </button>
                    <button 
                      type='button'
                      className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors relative z-10 cursor-pointer'
                      onClick={(e) => {
                        e.preventDefault()
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
        <div className='fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-bold text-slate-800'>Add Student to Course</h3>
              <button
                onClick={() => { 
                  setShowAddStudentModal(false)
                  setSelectedCourseId(null)
                  setStudentEmail('')
                  setEmailInput('')
                  setSelectedStudent(null)
                  setSuggestions([])
                  setShowSuggestions(false)
                }}
                className='p-1.5 rounded-md text-slate-600 hover:bg-slate-100'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
            
            {/* Email Input with Autocomplete */}
            <div className='relative' ref={inputContainerRef}>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Student Email <span className='text-red-500'>*</span>
              </label>
              
              {/* Selected Student Chip */}
              {selectedStudent && (
                <div className='mb-2 p-2 border border-slate-200 rounded-lg bg-slate-50 min-h-[40px]'>
                  <div className='inline-flex items-center gap-2 px-2 py-1.5 bg-[#7A1C1C] text-white text-xs rounded-full'>
                    {/* Small avatar in chip */}
                    <div className='w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-semibold'>
                      {(() => {
                        const name = selectedStudent.name
                        if (!name || name === selectedStudent.email) {
                          return selectedStudent.email.substring(0, 2).toUpperCase()
                        }
                        const parts = name.trim().split(' ')
                        if (parts.length >= 2) {
                          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                        }
                        return name.substring(0, 2).toUpperCase()
                      })()}
                    </div>
                    <span className='max-w-[200px] truncate'>
                      {selectedStudent.name !== selectedStudent.email ? selectedStudent.name : selectedStudent.email}
                    </span>
                    <button
                      type='button'
                      onClick={handleRemoveStudent}
                      className='hover:bg-[#5a1515] rounded-full p-0.5 transition-colors flex-shrink-0'
                      aria-label={`Remove ${selectedStudent.email}`}
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </div>
                </div>
              )}

              {/* Email Input Field */}
              <div className='relative'>
                <div className='flex items-center border rounded-lg px-3 py-2 border-slate-300 focus-within:border-[#7A1C1C] bg-white'>
                  <Mail className='w-4 h-4 text-slate-400 mr-2 flex-shrink-0' />
                  <input
                    ref={inputRef}
                    type="text"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0 || emailInput.trim().length > 0) {
                        setShowSuggestions(true)
                      }
                    }}
                    placeholder={selectedStudent ? "Search for another student..." : "Type to search students..."}
                    className='w-full outline-none text-sm'
                    disabled={!!selectedStudent}
                  />
                  {searching && (
                    <Loader2 className='w-4 h-4 text-slate-400 animate-spin ml-2' />
                  )}
                </div>
              </div>
            </div>

            {/* Suggestions Dropdown - Rendered outside modal using Portal */}
            {showSuggestions && !searching && suggestions.length > 0 && typeof window !== 'undefined' && createPortal(
              <div
                ref={suggestionsRef}
                className='fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-[320px] overflow-y-auto'
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width || 400}px`,
                }}
              >
                <ul className='py-1'>
                  {suggestions.map((student, index) => {
                    const getInitials = (name) => {
                      if (!name || name === student.email) return student.email.substring(0, 2).toUpperCase()
                      const parts = name.trim().split(' ')
                      if (parts.length >= 2) {
                        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                      }
                      return name.substring(0, 2).toUpperCase()
                    }
                    
                    const displayName = student.full_name || 
                      `${student.first_name || ''} ${student.last_name || ''}`.trim() || 
                      student.email
                    const initials = getInitials(displayName)
                    
                    return (
                      <li key={`${student.email}-${index}`}>
                        <button
                          onClick={() => handleSelectStudent(student)}
                          className='w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors'
                        >
                          {/* Circular Avatar */}
                          <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0'>
                            {initials}
                          </div>
                          {/* Name and Email */}
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-slate-800 truncate'>
                              {displayName}
                            </p>
                            <p className='text-xs text-slate-500 truncate'>
                              {student.email}
                            </p>
                          </div>
                          {/* Role Badge */}
                          <div className='px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex-shrink-0'>
                            Student
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>,
              document.body
            )}

            {/* No results message - Rendered outside modal using Portal */}
            {showSuggestions && !searching && suggestions.length === 0 && emailInput.length > 0 && typeof window !== 'undefined' && createPortal(
              <div
                className='fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl p-4 text-center'
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width || 400}px`,
                }}
              >
                <p className='text-sm text-slate-600 font-medium'>No students found</p>
                <p className='text-xs text-slate-400 mt-1'>Only registered students can be added to courses</p>
              </div>,
              document.body
            )}

            <div className='mt-6 flex items-center justify-end gap-3'>
              <button
                onClick={() => { 
                  setShowAddStudentModal(false)
                  setSelectedCourseId(null)
                  setStudentEmail('')
                  setEmailInput('')
                  setSelectedStudent(null)
                  setSuggestions([])
                  setShowSuggestions(false)
                }}
                className='px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50'
              >
                Cancel
              </button>
              <button
                onClick={saveAddStudent}
                disabled={!selectedStudent && !studentEmail}
                className='px-4 py-2 rounded-lg bg-[#7A1C1C] text-white font-semibold hover:bg-[#5a1515] disabled:opacity-50 disabled:cursor-not-allowed'
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

