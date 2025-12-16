import React, { useState } from 'react'
import { X, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

export const CreateTeacherModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // First check localStorage for quick admin verification
      const authUser = localStorage.getItem('authUser')
      let isAdmin = false
      
      if (authUser) {
        try {
          const user = JSON.parse(authUser)
          isAdmin = user.role?.toLowerCase() === 'admin'
          if (isAdmin) {
            console.log('Admin verified via localStorage')
          }
        } catch (e) {
          console.error('Error parsing authUser:', e)
        }
      }

      // If not admin in localStorage, verify via database
      if (!isAdmin) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          throw new Error('You must be logged in to create teacher accounts')
        }

        // Verify user is admin - use maybeSingle to avoid errors if not found
        const { data: currentUserProfile, error: profileError } = await supabase
          .from('secureshare_users')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle()

        // Check if query failed or user is not admin (case-insensitive check)
        if (profileError) {
          console.error('Error checking admin role:', profileError)
          // If RLS blocks, fall back to localStorage if available
          if (authUser) {
            try {
              const user = JSON.parse(authUser)
              if (user.role?.toLowerCase() === 'admin') {
                isAdmin = true
                console.log('Using localStorage as fallback for admin verification')
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
          if (!isAdmin) {
            throw new Error('Unable to verify admin status. Please refresh and try again.')
          }
        } else if (currentUserProfile && currentUserProfile.role?.toLowerCase() === 'admin') {
          isAdmin = true
          console.log('Admin verified via database')
        } else {
          throw new Error('Only admins can create teacher accounts')
        }
      }

      // Final check - if still not admin, throw error
      if (!isAdmin) {
        throw new Error('Only admins can create teacher accounts')
      }

      // Use admin API to create user with email_confirm: true
      // This bypasses email confirmation rate limits
      if (!supabaseAdmin) {
        throw new Error('Admin client not initialized. Please check your service role key configuration.')
      }
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true, // Bypass email confirmation
        user_metadata: {
          full_name: formData.fullName,
          role: 'Teacher'
        }
      })

      if (createError) {
        // Handle rate limit error specifically
        if (createError.code === 'over_email_send_rate_limit' || createError.message?.includes('rate limit')) {
          throw new Error(createError.message || 'Email rate limit exceeded. Please wait a moment and try again.')
        }
        throw createError
      }

      if (!newUser?.user) {
        throw new Error('Failed to create user')
      }

      // Create profile in secureshare_users table
      const { error: profileError } = await supabaseAdmin
        .from('secureshare_users')
        .insert({
          user_id: newUser.user.id,
          email: formData.email,
          full_name: formData.fullName.trim(),
          role: 'Teacher'
        })

      if (profileError) {
        // If profile creation fails, try to delete the auth user
        if (newUser.user?.id) {
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id).catch(console.error)
        }
        
        if (profileError.code === '23505') {
          throw new Error('A user with this email already exists.')
        } else if (profileError.code === '23503') {
          throw new Error('Invalid user reference. Please try again.')
        }
        throw new Error(profileError.message || 'Failed to create teacher profile')
      }

      setSuccess(true)
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      })

      // Wait a moment to show success message
      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (err) {
      console.error('Error creating teacher:', err)
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      })
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to create teacher account. Please try again.'
      
      if (err.message) {
        errorMessage = err.message
        // Extract rate limit message if present
        if (err.message.includes('rate limit') || err.message.includes('after') && err.message.includes('seconds')) {
          errorMessage = err.message
        }
      } else if (err.code === '23505') {
        errorMessage = 'A user with this email already exists.'
      } else if (err.code === '23503') {
        errorMessage = 'Invalid user reference. Please try again.'
      } else if (err.code === 'over_email_send_rate_limit') {
        errorMessage = err.message || 'Email rate limit exceeded. Please wait a moment and try again.'
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='bg-gradient-to-r from-[#7A1C1C] to-[#9B2D2D] px-6 py-4 rounded-t-2xl flex items-center justify-between'>
          <h2 className='text-xl font-bold text-white'>Create Teacher Account</h2>
          <button
            onClick={onClose}
            className='text-white hover:text-gray-200 transition-colors'
            disabled={loading}
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2'>
              <AlertCircle className='w-5 h-5 flex-shrink-0' />
              <span className='text-sm'>{error}</span>
            </div>
          )}

          {success && (
            <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2'>
              <CheckCircle className='w-5 h-5 flex-shrink-0' />
              <span className='text-sm'>Teacher account created successfully!</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className='flex justify-start text-sm font-semibold text-[#7A1C1C] mb-1'>
              Full Name <span className='text-red-500'>*</span>
            </label>
            <div className='text-sm flex items-center h-10 border border-gray-400 rounded-lg px-3'>
              <User size={20} color='#7A1C1C' className='mr-2' />
              <input
                type='text'
                name='fullName'
                placeholder='John Doe'
                className='w-full outline-none bg-transparent'
                value={formData.fullName}
                onChange={handleChange}
                disabled={loading || success}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className='flex justify-start text-sm font-semibold text-[#7A1C1C] mb-1'>
              Email <span className='text-red-500'>*</span>
            </label>
            <div className='text-sm flex items-center h-10 border border-gray-400 rounded-lg px-3'>
              <Mail size={20} color='#7A1C1C' className='mr-2' />
              <input
                type='email'
                name='email'
                placeholder='teacher@university.edu'
                className='w-full outline-none bg-transparent'
                value={formData.email}
                onChange={handleChange}
                disabled={loading || success}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className='flex justify-start text-sm font-semibold text-[#7A1C1C] mb-1'>
              Password <span className='text-red-500'>*</span>
            </label>
            <div className='text-sm flex items-center h-10 border border-gray-400 rounded-lg px-3'>
              <Lock size={20} color='#7A1C1C' className='mr-2' />
              <input
                type='password'
                name='password'
                placeholder='Minimum 6 characters'
                className='w-full outline-none bg-transparent'
                value={formData.password}
                onChange={handleChange}
                disabled={loading || success}
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className='flex justify-start text-sm font-semibold text-[#7A1C1C] mb-1'>
              Confirm Password <span className='text-red-500'>*</span>
            </label>
            <div className='text-sm flex items-center h-10 border border-gray-400 rounded-lg px-3'>
              <Lock size={20} color='#7A1C1C' className='mr-2' />
              <input
                type='password'
                name='confirmPassword'
                placeholder='Re-enter password'
                className='w-full outline-none bg-transparent'
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading || success}
                required
              />
            </div>
          </div>

          {/* Info Note */}
          <div className='bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-xs'>
            <p className='font-semibold mb-1'>Note:</p>
            <p>The teacher can log in immediately with the email and password provided. They will be redirected to the teacher dashboard upon login.</p>
          </div>

          {/* Buttons */}
          <div className='flex gap-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              disabled={loading || success}
              className='flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading || success}
              className='flex-1 px-4 py-2.5 bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Creating...' : success ? 'Created!' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

