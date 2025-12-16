import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Portal } from "./components/portal/Portal";
import { PortalLayout } from "./components/PortalLayout";
import { TeacherLayout } from "./components/TeacherLayout";
import { FilesPage } from "./components/sidebar/FilesPage";
import { SharedPage } from "./components/sidebar/SharedPage";
import { TrashPage } from "./components/sidebar/TrashPage";
import { SettingsPage } from "./components/sidebar/SettingsPage";
import { TeacherDashboard } from "./components/teacher/TeacherDashboard";
import { TeacherHomepage } from "./components/teacher/TeacherHomepage";
import { ManageClasses } from "./components/teacher/ManageClasses";
import { CourseDetailView } from "./components/teacher/CourseDetailView";
import { MyClasses } from "./components/student/MyClasses";
import { StudentCourseDetails } from "./components/student/StudentCourseDetails";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import Login from "./components/login/Login";
import Navbar from "./components/login/Navbar";
import { About } from "./components/login/About";
import { Security } from "./components/login/Security";
import { supabase } from "./lib/supabase";
import { isEmailConfirmed, isValidTUPEmail } from "./utils/emailConfirmation";


function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle email confirmation callback
    const handleEmailConfirmation = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      // Check if this is an email confirmation callback
      if (type === 'signup' && accessToken) {
        console.log('📧 Email confirmation detected, redirecting to student dashboard...');
        // Supabase will automatically handle the token exchange
        // After confirmation, redirect to student dashboard
        const { data: { session: confirmedSession } } = await supabase.auth.getSession();
        if (confirmedSession && confirmedSession.user) {
          // Check if email is confirmed
          if (confirmedSession.user.email_confirmed_at) {
            console.log('✅ Email confirmed! Redirecting to student dashboard...');
            // Redirect to student dashboard
            window.location.href = '/portal';
            return;
          }
        }
      }
    };

    // Check for email confirmation in URL
    handleEmailConfirmation();

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle email confirmation event
      if (event === 'SIGNED_IN' && session && session.user) {
        // Check if this is from an email confirmation
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        
        if (type === 'signup' && session.user.email_confirmed_at) {
          console.log('✅ Email confirmed via callback! Redirecting to student dashboard...');
          // Clear the hash to clean up URL
          window.history.replaceState({}, document.title, '/portal');
          // Redirect to student dashboard
          window.location.href = '/portal';
          return;
        }
      }
      if (session && session.user) {
        // Check if this is a Google OAuth user
        const isGoogleAuth = session.user.app_metadata?.provider === 'google' || 
                            session.user.identities?.some(identity => identity.provider === 'google');
        
        // For Google OAuth users, validate email domain and confirmation
        if (isGoogleAuth) {
          // Validate email domain
          if (!isValidTUPEmail(session.user.email)) {
            console.warn('Google OAuth user with invalid email domain:', session.user.email);
            await supabase.auth.signOut();
            localStorage.removeItem('authUser');
            setSession(null);
            return;
          }
          
          // Check email confirmation
          if (!isEmailConfirmed(session.user)) {
            console.warn('Google OAuth user email not confirmed:', session.user.email);
            await supabase.auth.signOut();
            localStorage.removeItem('authUser');
            setSession(null);
            return;
          }
        }
      }
      
      setSession(session);
      if (session) {
        // Update localStorage with session data
        // Use maybeSingle() to avoid 406 errors when user doesn't exist in secureshare_users table yet
        supabase
          .from('secureshare_users')
          .select('role, full_name, email')
          .eq('user_id', session.user.id)
          .maybeSingle() // Use maybeSingle() instead of single() - returns null instead of error when no row found
          .then(({ data, error }) => {
            if (data) {
              localStorage.setItem(
                'authUser',
                JSON.stringify({
                  id: session.user.id,
                  email: data.email || session.user.email,
                  fullName: data.full_name || data.email?.split('@')[0] || 'User',
                  role: data.role,
                })
              );
            } else if (error && error.code !== 'PGRST116') {
              // Log error only if it's not a "no rows" error
              console.warn('Error fetching user profile in App.js:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
              });
            }
          });
      } else {
        localStorage.removeItem('authUser');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const RequireAuth = ({ children, requiredRole = null }) => {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const authUser = localStorage.getItem("authUser");
    if (!authUser || !session) {
      return <Navigate to="/login" replace />;
    }
    
    // Additional check for Google OAuth users - ensure email is confirmed
    if (session && session.user) {
      const isGoogleAuth = session.user.app_metadata?.provider === 'google' || 
                          session.user.identities?.some(identity => identity.provider === 'google');
      
      if (isGoogleAuth) {
        // Validate email domain
        if (!isValidTUPEmail(session.user.email)) {
          return <Navigate to="/login" replace />;
        }
        
        // Check email confirmation
        if (!isEmailConfirmed(session.user)) {
          return <Navigate to="/login" replace />;
        }
      }
    }
    
    // If a specific role is required, check it
    if (requiredRole) {
      try {
        const user = JSON.parse(authUser);
        const userRole = user.role?.toLowerCase();
        const requiredRoleLower = requiredRole?.toLowerCase();
        
        if (userRole !== requiredRoleLower) {
          // Redirect based on user's actual role
          if (userRole === 'admin') {
            return <Navigate to="/admin-dashboard" replace />;
          } else if (userRole === 'teacher') {
            return <Navigate to="/teacher-dashboard" replace />;
          } else {
            return <Navigate to="/portal" replace />;
          }
        }
      } catch (e) {
        return <Navigate to="/login" replace />;
      }
    }
    
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/security" element={<><Navbar /><Security /></>} />
        <Route path="/about" element={<><Navbar /><About /></>} />

        {/* Student Portal Routes */}
        <Route
          path="/portal"
          element={
            <RequireAuth requiredRole="student">
              <PortalLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Portal />} />
          <Route path="my-classes" element={<MyClasses />} />
          <Route path="my-classes/course/:courseId" element={<StudentCourseDetails />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="shared" element={<SharedPage />} />
          <Route path="trash" element={<TrashPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Teacher Dashboard Routes */}
        <Route
          path="/teacher-dashboard"
          element={
            <RequireAuth requiredRole="teacher">
              <TeacherLayout />
            </RequireAuth>
          }
        >
          <Route index element={<TeacherHomepage />} />
          <Route path="submissions" element={<TeacherDashboard />} />
          <Route path="manage-classes" element={<ManageClasses />} />
          <Route path="manage-classes/course/:courseId" element={<CourseDetailView />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="shared" element={<SharedPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <RequireAuth requiredRole="admin">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="teachers" element={<AdminDashboard />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
export default App;

