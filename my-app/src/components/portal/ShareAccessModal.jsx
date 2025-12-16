import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Share2, Mail, Upload, Loader2, User, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const ShareAccessModal = ({ onClose, onShare }) => {
  const [emailInput, setEmailInput] = useState('')
  const [selectedEmails, setSelectedEmails] = useState([]) // Array of email objects
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [searching, setSearching] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const inputContainerRef = useRef(null)

  // Get current user's email on component mount
  useEffect(() => {
    const getCurrentUserEmail = async () => {
      try {
        // Get from localStorage first (faster)
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
          top: rect.bottom + 4, // Use viewport coordinates for fixed positioning
          left: rect.left,
          width: rect.width
        })
      }
    }

    if (showSuggestions && inputContainerRef.current) {
      updateDropdownPosition()
      // Update on scroll and resize
      window.addEventListener('scroll', updateDropdownPosition, true)
      window.addEventListener('resize', updateDropdownPosition)
      // Also update when input gets focus
      if (inputRef.current) {
        inputRef.current.addEventListener('focus', updateDropdownPosition)
      }
    }

    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
      if (inputRef.current) {
        inputRef.current.removeEventListener('focus', updateDropdownPosition)
      }
    }
  }, [showSuggestions, suggestions, emailInput])

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setError('') // Clear error when file is selected
    }
  }

  // Search for registered users as user types (triggers on first letter)
  useEffect(() => {
    const searchUsers = async () => {
      // Show suggestions as soon as user types (even 1 character)
      if (!emailInput.trim() || emailInput.length === 0) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      // Don't search if user is typing an email that's already selected
      const isAlreadySelected = selectedEmails.some(
        e => e.email.toLowerCase() === emailInput.toLowerCase()
      )
      if (isAlreadySelected) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setSearching(true)
      try {
        // Search ALL registered users from users table (Students, Teachers, and Admins)
        // Searches by email, full_name, first_name, or last_name (case-insensitive)
        const searchTerm = emailInput.toLowerCase().trim()
        
        // Query users table - returns ALL registered users regardless of role
        // This includes: students, teachers, and admins
        // IMPORTANT: The RLS policy must allow users to search for sharing
        // NO role filter in query - searches ALL users (students, teachers, admins)
        // Then filters to show only students and teachers in UI
        // Note: Try 'users' first, fallback to 'secureshare_users' if needed
        let users = null
        let error = null
        
        // Try 'users' table first (most common)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('user_id, email, full_name, first_name, last_name, role')
          .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
          .limit(50)
        
        if (!usersError && usersData) {
          users = usersData
        } else if (usersError?.code === 'PGRST301' || usersError?.message?.includes('relation "users" does not exist')) {
          // Fallback to secureshare_users if users table doesn't exist
          console.log('⚠️ users table not found, trying secureshare_users...')
          const { data: secureshareUsersData, error: secureshareUsersError } = await supabase
            .from('secureshare_users')
            .select('user_id, email, full_name, first_name, last_name, role')
            .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
            .limit(50)
          
          if (!secureshareUsersError && secureshareUsersData) {
            users = secureshareUsersData
          } else {
            error = secureshareUsersError
          }
        } else {
          error = usersError
        }
        
        // Check for errors FIRST
        if (error) {
          console.error('❌ Error searching users:', error)
          console.error('Full error details:', JSON.stringify(error, null, 2))
          
          // If RLS policy error, show helpful message to user
          if (error.message?.includes('policy') || error.message?.includes('RLS') || 
              error.code === '42501' || error.code === 'PGRST301' ||
              error.message?.includes('permission denied') || error.message?.includes('new row violates')) {
            console.error('🚫 RLS policy is blocking user search!')
            console.error('📝 Please run FIX_USER_SEARCH_ALL_ROLES.sql in Supabase SQL Editor to fix this.')
            setError('Search blocked by security policy. Run FIX_USER_SEARCH_ALL_ROLES.sql in Supabase SQL Editor.')
            setSuggestions([])
          } else {
            // Log other errors but don't show to user (might be temporary network issues)
            console.warn('Search error (non-RLS):', error.message)
            setSuggestions([])
          }
          return
        }

        // Handle empty results
        if (!users || users.length === 0) {
          console.warn('⚠️ No users found. Check RLS policies or search term.')
          console.warn('⚠️ If users exist in database, RLS policy is likely blocking them.')
          console.warn('⚠️ Run FIX_USER_SEARCH_ALL_ROLES.sql in Supabase SQL Editor.')
          setSuggestions([])
          setShowSuggestions(false)
          return
        }

        // Debug: Log all found users to verify students are included
        console.log('🔍 Search results (ALL users found):', users.map(u => ({ 
          email: u.email, 
          name: u.full_name, 
          role: u.role 
        })))
        
        const studentCount = users.filter(u => {
          const role = (u.role || '').toLowerCase()
          return role === 'student' || role === 'students'
        }).length
        const teacherCount = users.filter(u => {
          const role = (u.role || '').toLowerCase()
          return role === 'teacher' || role === 'teachers'
        }).length
        const adminCount = users.filter(u => {
          const role = (u.role || '').toLowerCase()
          return role === 'admin' || role === 'admins'
        }).length
        
        console.log(`📊 Found ${users.length} total users: ${studentCount} students, ${teacherCount} teachers, ${adminCount} admins`)
        
        // Only log warning if we found teachers but no students (might indicate RLS issue)
        // Don't show error to user - this might be normal if no students match the search term
        if (users.length > 0 && studentCount === 0 && teacherCount > 0 && searchTerm.length > 0) {
          // We found teachers but no students - this might indicate RLS blocking students
          console.warn('⚠️ WARNING: Found teachers but no students in search results.')
          console.warn('⚠️ If students exist in database, RLS policy might be blocking them.')
          console.warn('⚠️ Run FIX_USER_SEARCH_ALL_ROLES.sql in Supabase SQL Editor to fix this.')
          // Don't set error - just log warning, as this might be normal if no students match the search
        }
        
        // Clear any previous errors when we get results (even if no students)
        if (users.length > 0) {
          setError('')
        }

        // Filter out already selected emails, exclude admin role, AND exclude current user's email
        // Only show students and teachers (no admins, no self)
        const selectedEmailsLower = selectedEmails.map(e => e.email.toLowerCase())
        const filteredUsers = (users || []).filter(user => {
          const emailLower = (user.email || '').toLowerCase()
          const roleLower = (user.role || '').toLowerCase()
          
          // Exclude: already selected emails, admin role, AND current user's email
          // Include: students and teachers only
          return !selectedEmailsLower.includes(emailLower) && 
                 emailLower !== currentUserEmail && // Exclude self
                 emailLower.length > 0 && // Must have email
                 roleLower !== 'admin' && 
                 (roleLower === 'student' || roleLower === 'teacher' || roleLower === 'students' || roleLower === 'teachers')
        })

        // Sort to show teachers first, then students, both alphabetically
        const sortedUsers = [...filteredUsers].sort((a, b) => {
          // First sort by role (teachers before students)
          const roleOrder = { 'teacher': 1, 'teachers': 1, 'student': 2, 'students': 2 }
          const aRole = (a.role || '').toLowerCase()
          const bRole = (b.role || '').toLowerCase()
          const roleDiff = (roleOrder[aRole] || 99) - (roleOrder[bRole] || 99)
          if (roleDiff !== 0) return roleDiff
          
          // Then sort alphabetically by name (full_name, then email)
          const aName = (a.full_name || a.first_name || a.last_name || a.email || '').toLowerCase()
          const bName = (b.full_name || b.first_name || b.last_name || b.email || '').toLowerCase()
          return aName.localeCompare(bName)
        })

        // Debug: Log to verify only students and teachers are included
        if (sortedUsers.length > 0) {
          const studentCount = sortedUsers.filter(u => {
            const role = (u.role || '').toLowerCase()
            return role === 'student' || role === 'students'
          }).length
          const teacherCount = sortedUsers.filter(u => {
            const role = (u.role || '').toLowerCase()
            return role === 'teacher' || role === 'teachers'
          }).length
          console.log(`✅ Displaying ${sortedUsers.length} users: ${studentCount} students, ${teacherCount} teachers (admins and self excluded)`)
        }

        setSuggestions(sortedUsers)
        setShowSuggestions(sortedUsers.length > 0)
      } catch (err) {
        console.error('Search error:', err)
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }

    // Reduced debounce to 150ms for immediate search response
    const debounceTimer = setTimeout(searchUsers, 150)
    return () => clearTimeout(debounceTimer)
  }, [emailInput, selectedEmails, currentUserEmail])

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        inputContainerRef.current &&
        !inputContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSuggestions])

  const handleEmailInputChange = (e) => {
    const value = e.target.value
    setEmailInput(value)
    setError('') // Clear error when typing
  }

  const handleSelectSuggestion = (user) => {
    const emailObj = {
      email: user.email,
      name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      role: user.role
    }
    
    // Check if already selected
    if (!selectedEmails.some(e => e.email.toLowerCase() === user.email.toLowerCase())) {
      setSelectedEmails([...selectedEmails, emailObj])
    }
    
    setEmailInput('')
    setShowSuggestions(false)
    setSuggestions([])
    inputRef.current?.focus()
  }

  const handleRemoveEmail = (emailToRemove) => {
    setSelectedEmails(selectedEmails.filter(e => e.email !== emailToRemove))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && emailInput.trim() && !showSuggestions) {
      e.preventDefault()
      // Try to add the email if it's a valid format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(emailInput.trim())) {
        // Check if it's in suggestions
        const matchingSuggestion = suggestions.find(
          u => u.email.toLowerCase() === emailInput.trim().toLowerCase()
        )
        if (matchingSuggestion) {
          handleSelectSuggestion(matchingSuggestion)
        } else {
          // User typed a valid email format but not in suggestions
          // We'll validate it on submit
          const emailObj = {
            email: emailInput.trim(),
            name: emailInput.trim(),
            role: 'unknown'
          }
          if (!selectedEmails.some(e => e.email.toLowerCase() === emailInput.trim().toLowerCase())) {
            setSelectedEmails([...selectedEmails, emailObj])
            setEmailInput('')
          }
        }
      }
    } else if (e.key === 'Backspace' && !emailInput && selectedEmails.length > 0) {
      // Remove last email on backspace when input is empty
      handleRemoveEmail(selectedEmails[selectedEmails.length - 1].email)
    } else if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
      e.preventDefault()
      // Focus first suggestion (could be enhanced with keyboard navigation)
    }
  }

  const validateEmails = async (emailList) => {
    if (emailList.length === 0) {
      return { valid: false, invalidEmails: [], message: 'Enter at least one email' }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidFormat = emailList.filter(email => !emailRegex.test(email))
    if (invalidFormat.length > 0) {
      return { 
        valid: false, 
        invalidEmails: invalidFormat, 
        message: `Invalid email format: ${invalidFormat.join(', ')}` 
      }
    }

      // Check if emails exist in users table (case-insensitive)
      setValidating(true)
      try {
        // Convert to lowercase for comparison
        const emailListLower = emailList.map(e => e.toLowerCase())
        
        // Try 'users' table first, fallback to 'secureshare_users'
        let existingUsers = null
        let queryError = null
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('email')
        
        if (!usersError && usersData) {
          existingUsers = usersData
        } else if (usersError?.code === 'PGRST301' || usersError?.message?.includes('relation "users" does not exist')) {
          const { data: secureshareUsersData, error: secureshareUsersError } = await supabase
            .from('secureshare_users')
            .select('email')
          
          if (!secureshareUsersError && secureshareUsersData) {
            existingUsers = secureshareUsersData
          } else {
            queryError = secureshareUsersError
          }
        } else {
          queryError = usersError
        }

      if (queryError) {
        console.error('Error checking users:', queryError)
        // If RLS blocks the query, try a different approach
        // For now, we'll allow if emails were selected from suggestions
        return { 
          valid: false, 
          invalidEmails: [], 
          message: 'Error validating emails. Please try again.' 
        }
      }

      const existingEmails = (existingUsers || []).map(u => (u.email || '').toLowerCase()).filter(Boolean)
      const invalidEmails = emailList.filter(email => 
        !existingEmails.includes(email.toLowerCase())
      )

      if (invalidEmails.length > 0) {
        return { 
          valid: false, 
          invalidEmails, 
          message: `The following emails are not registered users: ${invalidEmails.join(', ')}. Please invite only registered users.` 
        }
      }

      return { valid: true, invalidEmails: [], message: '' }
    } catch (err) {
      console.error('Validation error:', err)
      return { 
        valid: false, 
        invalidEmails: [], 
        message: 'Error validating emails. Please try again.' 
      }
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShowSuggestions(false)
    
    // Get email list from selected emails
    const emailList = selectedEmails.map(e => e.email)
    
    // If user typed something in input, try to add it
    if (emailInput.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(emailInput.trim())) {
        const emailLower = emailInput.trim().toLowerCase()
        if (!emailList.some(e => e.toLowerCase() === emailLower)) {
          emailList.push(emailInput.trim())
        }
      } else {
        setError('Please enter a valid email address or select from suggestions')
        return
      }
    }
    
    // Basic validation
    if (emailList.length === 0) {
      setError('Enter at least one email')
      return
    }
    
    if (!selectedFile) {
      setError('Please select a file to share')
      return
    }

    // Validate emails are registered users
    const validation = await validateEmails(emailList)
    
    if (!validation.valid) {
      setError(validation.message)
      return
    }

    // All emails are valid, proceed with sharing
    setLoading(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to share files')
        setLoading(false)
        return
      }

      const userId = user.id
      const safeName = selectedFile.name.replace(/[^\w\-.]+/g, '_')
      const timestamp = Date.now()
      const path = `${userId}/shared/${timestamp}_${safeName}`
      const bucket = 'files'

      // Step 1: Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, selectedFile, { 
          upsert: true, 
          contentType: selectedFile.type || 'application/octet-stream' 
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError(`Failed to upload file: ${uploadError.message}`)
        setLoading(false)
        return
      }

      // Step 2: Save file metadata to database
      const fileSizeBytes = selectedFile.size
      let insertedFile = null
      
      // Try using the RPC function first (bypasses RLS)
      const { data: fileRecord, error: rpcError } = await supabase.rpc('insert_file', {
        p_user_id: userId,
        p_file_name: selectedFile.name,
        p_file_path: path,
        p_file_size: fileSizeBytes,
        p_file_type: selectedFile.type || 'application/octet-stream',
        p_folder_path: 'shared',
        p_bucket: bucket,
        p_is_folder: false,
        p_is_trashed: false
      })

      if (!rpcError && fileRecord) {
        insertedFile = fileRecord
      } else {
        // Fallback: Direct insert
        const { data: directInsert, error: insertError } = await supabase
          .from('files')
          .insert({
            user_id: userId,
            file_name: selectedFile.name,
            file_path: path,
            file_size: fileSizeBytes,
            file_type: selectedFile.type || 'application/octet-stream',
            bucket: bucket,
            is_folder: false,
            is_trashed: false,
            is_shared: true
          })
          .select()
          .single()

        if (insertError) {
          console.error('Database insert error:', insertError)
          setError(`Failed to save file record: ${insertError.message}`)
          // Try to clean up uploaded file
          await supabase.storage.from(bucket).remove([path])
          setLoading(false)
          return
        }
        insertedFile = directInsert
      }

      if (!insertedFile || !insertedFile.file_id) {
        setError('Failed to save file record')
        await supabase.storage.from(bucket).remove([path])
        setLoading(false)
        return
      }

      // Step 3: Get user IDs for recipient emails
      // Try 'users' table first, fallback to 'secureshare_users'
      let recipientUsers = null
      let userLookupError = null
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('user_id, email')
        .in('email', emailList)
      
      if (!usersError && usersData) {
        recipientUsers = usersData
      } else if (usersError?.code === 'PGRST301' || usersError?.message?.includes('relation "users" does not exist')) {
        const { data: secureshareUsersData, error: secureshareUsersError } = await supabase
          .from('secureshare_users')
          .select('user_id, email')
          .in('email', emailList)
        
        if (!secureshareUsersError && secureshareUsersData) {
          recipientUsers = secureshareUsersData
        } else {
          userLookupError = secureshareUsersError
        }
      } else {
        userLookupError = usersError
      }

      if (userLookupError) {
        console.error('Error looking up users:', userLookupError)
        setError('Failed to look up recipient users')
        setLoading(false)
        return
      }

      // Step 4: Create shared_access records for each recipient
      const shareRecords = emailList.map(email => {
        const recipientUser = recipientUsers?.find(u => u.email.toLowerCase() === email.toLowerCase())
        return {
          file_id: insertedFile.file_id,
          owner_id: userId,
          shared_with_email: email.toLowerCase(), // Store lowercase for case-insensitive matching
          shared_with_id: recipientUser?.user_id || null, // Auth UUID from users table
          permission_level: 'View', // Default permission
          expires_at: null // No expiry by default
        }
      })

      const { error: shareError } = await supabase
        .from('shared_access')
        .insert(shareRecords)

      if (shareError) {
        console.error('Error creating share records:', shareError)
        setError(`Failed to share file: ${shareError.message}`)
        setLoading(false)
        return
      }

      // Step 5: Log activity (non-critical)
      try {
        await supabase.from('activity_log').insert({
          user_id: userId,
          action_type: 'share',
          file_name: selectedFile.name,
          file_id: insertedFile.file_id,
          details: { 
            shared_with: emailList,
            permission: 'View'
          }
        })
      } catch (activityError) {
        console.warn('Failed to log activity (non-critical):', activityError)
      }

      // Step 6: Trigger events to refresh UI
      window.dispatchEvent(new Event('app:shared:updated'))
      window.dispatchEvent(new Event('app:files:updated'))

      // Step 7: Call onShare callback if provided (for backward compatibility)
      if (onShare) {
        await onShare({ emails: emailList, file: selectedFile, fileId: insertedFile.file_id })
      }

      // Success - close modal
      onClose()
    } catch (err) {
      console.error('Share error:', err)
      setError(`Failed to share file: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D]'>
              <Share2 className='w-4 h-4 text-white' />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Share access</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100">
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* File Selection */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Choose File <span className='text-red-500'>*</span>
            </label>
            <label className='block'>
              <input
                type='file'
                className='hidden'
                onChange={handleFileSelect}
                accept='.pdf,.doc,.docx,.ppt,.pptx,.jpg,.png'
              />
              <div className='flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-[#7A1C1C] transition-colors cursor-pointer'>
                <Upload className='w-5 h-5 text-slate-400' />
                <span className='text-sm font-medium text-slate-600'>
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </span>
              </div>
            </label>
            <p className='mt-1 text-xs text-slate-500'>Accepted: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG</p>
          </div>

          {/* Email Input with Autocomplete */}
          <div className='relative'>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Invite by Email <span className='text-red-500'>*</span>
            </label>
            
            {/* Selected Email Chips */}
            {selectedEmails.length > 0 && (
              <div className='flex flex-wrap gap-2 mb-2 p-2 border border-slate-200 rounded-lg bg-slate-50 min-h-[40px]'>
                {selectedEmails.map((emailObj, index) => {
                  // Get initials for chip avatar
                  const getInitials = (name) => {
                    if (!name || name === emailObj.email) return emailObj.email.substring(0, 2).toUpperCase()
                    const parts = name.trim().split(' ')
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                    }
                    return name.substring(0, 2).toUpperCase()
                  }
                  
                  const initials = getInitials(emailObj.name)
                  const displayText = emailObj.name !== emailObj.email ? emailObj.name : emailObj.email
                  
                  return (
                    <div
                      key={`${emailObj.email}-${index}`}
                      className='inline-flex items-center gap-2 px-2 py-1.5 bg-[#7A1C1C] text-white text-xs rounded-full'
                    >
                      {/* Small avatar in chip */}
                      <div className='w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-semibold'>
                        {initials}
                      </div>
                      <span className='max-w-[200px] truncate'>{displayText}</span>
                      <button
                        type='button'
                        onClick={() => handleRemoveEmail(emailObj.email)}
                        className='hover:bg-[#5a1515] rounded-full p-0.5 transition-colors flex-shrink-0'
                        aria-label={`Remove ${emailObj.email}`}
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Email Input Field */}
            <div className='relative' ref={inputContainerRef}>
              <div className='flex items-center border rounded-lg px-3 py-2 border-slate-300 focus-within:border-[#7A1C1C] bg-white'>
                <Mail className='w-4 h-4 text-slate-400 mr-2 flex-shrink-0' />
                <input
                  ref={inputRef}
                  type="text"
                  value={emailInput}
                  onChange={handleEmailInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    // Show suggestions when focused if there are any or if user has typed something
                    if (suggestions.length > 0 || emailInput.trim().length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  placeholder={selectedEmails.length === 0 ? "Type to search registered users..." : "Add another user..."}
                  className='w-full outline-none text-sm'
                />
                {searching && (
                  <Loader2 className='w-4 h-4 text-slate-400 animate-spin ml-2' />
                )}
              </div>
            </div>

            {/* Suggestions Dropdown - Rendered outside modal using Portal */}
            {showSuggestions && suggestions.length > 0 && typeof window !== 'undefined' && createPortal(
              <div
                ref={suggestionsRef}
                className='fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden'
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width || 400}px`,
                  maxHeight: '320px',
                  overflowY: 'auto'
                }}
              >
                  {suggestions.map((user, index) => {
                    const displayName = user.full_name || 
                      `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                      user.email
                    
                    // Get initials for avatar
                    const getInitials = (name) => {
                      if (!name) return 'U'
                      const parts = name.trim().split(' ')
                      if (parts.length >= 2) {
                        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                      }
                      return name.substring(0, 2).toUpperCase()
                    }
                    
                    const initials = getInitials(displayName)
                    
                    // Color based on first letter for consistency
                    const colors = [
                      'bg-yellow-100 text-yellow-700',
                      'bg-blue-100 text-blue-700',
                      'bg-purple-100 text-purple-700',
                      'bg-green-100 text-green-700',
                      'bg-pink-100 text-pink-700',
                      'bg-indigo-100 text-indigo-700',
                    ]
                    const colorIndex = (initials.charCodeAt(0) || 0) % colors.length
                    const avatarColor = colors[colorIndex]
                    
                    return (
                      <button
                        key={`${user.email}-${index}`}
                        type='button'
                        onClick={() => handleSelectSuggestion(user)}
                        className='w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 focus:bg-slate-50 focus:outline-none'
                      >
                        <div className='flex items-center gap-3'>
                          {/* Avatar Circle with Initials */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center font-semibold text-sm`}>
                            {initials}
                          </div>
                          {/* Name and Email */}
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-slate-900 truncate'>
                              {displayName}
                            </p>
                            <p className='text-xs text-slate-500 truncate mt-0.5'>{user.email}</p>
                          </div>
                          {/* Role Badge */}
                          <div className='flex-shrink-0'>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              user.role?.toLowerCase() === 'teacher' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {user.role || 'User'}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              , document.body
            )}

            {/* No results message - Also rendered outside modal */}
            {showSuggestions && !searching && suggestions.length === 0 && emailInput.length > 0 && typeof window !== 'undefined' && createPortal(
              <div
                className='fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl p-4 text-center'
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width || 400}px`
                }}
              >
                <p className='text-sm text-slate-600 font-medium'>No registered users found</p>
                <p className='text-xs text-slate-400 mt-1'>Only users registered in the system can be invited</p>
              </div>
              , document.body
            )}

            <p className='mt-1 text-xs text-slate-500'>
              Type to search registered users. Only registered users can be invited.
            </p>
            {validating && (
              <div className='mt-2 flex items-center gap-2 text-xs text-blue-600'>
                <Loader2 className='w-3 h-3 animate-spin' />
                <span>Validating emails...</span>
              </div>
            )}
          </div>

          {error && (
            <div className='text-xs text-red-600 bg-red-50 p-3 rounded border border-red-200'>
              <p className='font-semibold mb-1'>Validation Error:</p>
              <p>{error}</p>
            </div>
          )}
        </form>

        <div className='flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50'>
          <button 
            onClick={onClose} 
            type='button' 
            disabled={loading || validating}
            className='px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            type='submit' 
            disabled={loading || validating || !selectedFile || selectedEmails.length === 0}
            className='px-4 py-2 text-sm rounded-lg text-white bg-[#7A1C1C] hover:bg-[#5a1515] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
          >
            {loading ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>Sharing...</span>
              </>
            ) : validating ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>Validating...</span>
              </>
            ) : (
              'Share'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}



