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
import Login from "./components/login/Login";
import Navbar from "./components/login/Navbar";
import { About } from "./components/login/About";
import { Security } from "./components/login/Security";
import { supabase } from "./lib/supabase";


function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Update localStorage with session data
        supabase
          .from('users')
          .select('role, full_name, email')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              localStorage.setItem(
                'authUser',
                JSON.stringify({
                  id: session.user.id,
                  email: data.email || session.user.email,
                  fullName: data.full_name,
                  role: data.role,
                })
              );
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
    
    // If a specific role is required, check it
    if (requiredRole) {
      try {
        const user = JSON.parse(authUser);
        if (user.role !== requiredRole) {
          // Redirect based on user's actual role
          if (user.role === 'Teacher') {
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
            <RequireAuth requiredRole="Student">
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
            <RequireAuth requiredRole="Teacher">
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

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
export default App;

