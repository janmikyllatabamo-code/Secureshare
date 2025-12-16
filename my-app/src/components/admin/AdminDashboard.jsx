import React, { useState, useEffect } from 'react'
import { Users, UserPlus, Shield, TrendingUp, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CreateTeacherModal } from './CreateTeacherModal'

export const AdminDashboard = () => {
  const [userName, setUserName] = useState('Admin')
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [stats, setStats] = useState({
    totalTeachers: 0,
    activeTeachers: 0,
    totalStudents: 0,
    recentAccounts: 0
  })

  useEffect(() => {
    // Get admin name from localStorage
    const authUser = localStorage.getItem('authUser')
    if (authUser) {
      try {
        const user = JSON.parse(authUser)
        setUserName(user.fullName || user.email?.split('@')[0] || 'Admin')
      } catch (e) {
        console.error('Error parsing user info:', e)
      }
    }
    // Load statistics
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    setLoading(true)
    try {
      // Fetch all teachers from secureshare_users table
      const { data, error } = await supabase
        .from('secureshare_users')
        .select('user_id, email, full_name, role, created_at')
        .eq('role', 'Teacher')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading teachers:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      if (data) {
        setTeachers(data)
        setStats(prev => ({
          ...prev,
          totalTeachers: data.length,
          activeTeachers: data.length
        }))
      } else {
        setTeachers([])
        setStats(prev => ({
          ...prev,
          totalTeachers: 0,
          activeTeachers: 0
        }))
      }
    } catch (err) {
      console.error('Error loading teachers:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      })
      setTeachers([])
      setStats(prev => ({
        ...prev,
        totalTeachers: 0,
        activeTeachers: 0
      }))
    } finally {
      setLoading(false)
    }

    // Load students count
    try {
      const { count: studentsCount, error: studentsError } = await supabase
        .from('secureshare_users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'Student')

      if (studentsError) {
        console.error('Error loading students count:', {
          message: studentsError.message,
          details: studentsError.details,
          hint: studentsError.hint,
          code: studentsError.code
        })
      }

      setStats(prev => ({
        ...prev,
        totalStudents: studentsCount || 0
      }))
    } catch (err) {
      console.error('Error loading students count:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      })
      setStats(prev => ({
        ...prev,
        totalStudents: 0
      }))
    }

    // Load new accounts (all users created in the last 7 days)
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoISO = weekAgo.toISOString()

      const { count: newAccountsCount, error: newAccountsError } = await supabase
        .from('secureshare_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgoISO)

      if (newAccountsError) {
        console.error('Error loading new accounts count:', {
          message: newAccountsError.message,
          details: newAccountsError.details,
          hint: newAccountsError.hint,
          code: newAccountsError.code
        })
      }

      setStats(prev => ({
        ...prev,
        recentAccounts: newAccountsCount || 0
      }))
    } catch (err) {
      console.error('Error loading new accounts count:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      })
      setStats(prev => ({
        ...prev,
        recentAccounts: 0
      }))
    }
  }

  const handleTeacherCreated = () => {
    setShowCreateModal(false)
    loadTeachers()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className='container mx-auto bg-radial-at-center from-[#F9F0D9] to-[#F2F2F2] min-h-screen m-0 p-0'>
      {/* Welcome Section */}
      <div className='px-6 lg:px-12 pt-8 pb-6'>
        <div className='mb-2'>
          <h1 className='text-4xl lg:text-5xl font-bold text-[#4B1B1B] mb-2'>
            Welcome, <span className='text-[#7A1C1C]'>{userName}!</span>
          </h1>
          <p className='text-[#4B1B1B]/80 text-base lg:text-lg font-medium'>
            Manage teacher accounts and system administration
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='px-6 lg:px-12 mb-8'>
        <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
          <li className='bg-white/30 backdrop-blur-xl hover:bg-white/50 w-full px-6 py-6 rounded-2xl border border-white/40 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default group'>
            <div className='flex items-center justify-between mb-3'>
              <p className='font-semibold text-[#4B1B1B] text-sm uppercase tracking-wide'>Total Teachers</p>
              <Users className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
            </div>
            <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{stats.totalTeachers}</span>
            <p className='text-xs text-[#4B1B1B]/80'>Active accounts</p>
          </li>
          <li className='bg-white/30 backdrop-blur-xl hover:bg-white/50 w-full px-6 py-6 rounded-2xl border border-white/40 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default group'>
            <div className='flex items-center justify-between mb-3'>
              <p className='font-semibold text-[#4B1B1B] text-sm uppercase tracking-wide'>Active Teachers</p>
              <Shield className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
            </div>
            <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{stats.activeTeachers}</span>
            <p className='text-xs text-[#4B1B1B]/80'>Currently registered</p>
          </li>
          <li className='bg-white/30 backdrop-blur-xl hover:bg-white/50 w-full px-6 py-6 rounded-2xl border border-white/40 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default group'>
            <div className='flex items-center justify-between mb-3'>
              <p className='font-semibold text-[#4B1B1B] text-sm uppercase tracking-wide'>Total Students</p>
              <Users className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
            </div>
            <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{stats.totalStudents}</span>
            <p className='text-xs text-[#4B1B1B]/80'>Student accounts</p>
          </li>
          <li className='bg-white/30 backdrop-blur-xl hover:bg-white/50 w-full px-6 py-6 rounded-2xl border border-white/40 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default group'>
            <div className='flex items-center justify-between mb-3'>
              <p className='font-semibold text-[#4B1B1B] text-sm uppercase tracking-wide'>New Accounts</p>
              <TrendingUp className='w-5 h-5 text-slate-400 group-hover:text-[#7A1C1C] transition-colors' />
            </div>
            <span className='text-4xl text-[#7A1C1C] font-bold block mb-1'>{stats.recentAccounts}</span>
            <p className='text-xs text-[#4B1B1B]/80'>This week</p>
          </li>
        </ul>
      </div>

      {/* Quick Actions */}
      <div className='px-6 lg:px-12 mb-8'>
        <h2 className='text-2xl lg:text-3xl font-bold text-[#4B1B1B] mb-6'>Quick Actions</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          <button
            onClick={() => setShowCreateModal(true)}
            className='bg-white/30 backdrop-blur-xl hover:bg-white/50 w-full px-6 py-6 rounded-2xl border border-white/40 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-[#7A1C1C] cursor-pointer transition-all duration-300 ease-in-out group text-left'
          >
            <div className='flex items-center gap-3 mb-3'>
              <div className='p-2 bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] rounded-lg shadow-md group-hover:shadow-lg transition-shadow'>
                <UserPlus className='w-5 h-5 text-white' />
              </div>
              <p className='font-semibold text-[#4B1B1B]'>Create Teacher Account</p>
            </div>
            <p className='text-xs text-[#4B1B1B]/80 ml-11'>Add a new teacher to the system</p>
          </button>
        </div>
      </div>

      {/* Teachers List */}
      <section className='px-6 lg:px-12 pb-12'>
        <div className='w-full rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl overflow-hidden'>
          <div className='bg-gradient-to-r from-white/40 to-white/30 backdrop-blur-xl px-6 py-5 border-b border-white/40 flex items-center justify-between'>
            <h2 className='font-bold text-xl text-[#4B1B1B] flex items-center gap-2'>
              <Users className='w-5 h-5 text-[#7A1C1C]' />
              Teacher Accounts
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className='px-4 py-2 bg-[#7A1C1C] hover:bg-[#5a1515] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2'
            >
              <UserPlus className='w-4 h-4' />
              Add Teacher
            </button>
          </div>
          <div className='overflow-y-auto max-h-[600px]'>
            {loading ? (
              <div className='px-6 py-8 text-center text-[#4B1B1B]/60'>Loading teachers...</div>
            ) : teachers.length === 0 ? (
              <div className='px-6 py-8 text-center text-[#4B1B1B]/60'>
                <Users className='w-12 h-12 mx-auto mb-3 opacity-50' />
                <p>No teachers found. Create your first teacher account.</p>
              </div>
            ) : (
              <ul className='divide-y divide-white/20'>
                {teachers.map((teacher) => (
                  <li key={teacher.user_id} className='px-6 py-4 hover:bg-white/20 transition-colors duration-150'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4 flex-1'>
                        <div className='p-2 bg-white/60 rounded-lg border border-white/40'>
                          <UserPlus className='w-5 h-5 text-[#7A1C1C]' />
                        </div>
                        <div className='flex-1'>
                          <p className='font-semibold text-[#4B1B1B] mb-1'>
                            {teacher.full_name || teacher.email || 'Unknown Teacher'}
                          </p>
                          <p className='text-xs text-[#4B1B1B]/80 flex items-center gap-2'>
                            <Mail className='w-3 h-3' />
                            <span>{teacher.email}</span>
                          </p>
                        </div>
                      </div>
                      <div className='ml-4'>
                        <span className='px-3 py-1 rounded-full text-xs font-semibold bg-[#7A1C1C]/10 text-[#7A1C1C]'>
                          Teacher
                        </span>
                        <p className='text-xs text-[#4B1B1B]/80 mt-2 text-right'>
                          Created {formatDate(teacher.created_at)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Create Teacher Modal */}
      {showCreateModal && (
        <CreateTeacherModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTeacherCreated}
        />
      )}
    </div>
  )
}

