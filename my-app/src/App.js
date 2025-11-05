import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Portal } from "./components/portal/Portal";
import { PortalLayout } from "./components/PortalLayout";
import { FilesPage } from "./components/sidebar/FilesPage";
import { SharedPage } from "./components/sidebar/SharedPage";
import { TrashPage } from "./components/sidebar/TrashPage";
import { SettingsPage } from "./components/sidebar/SettingsPage";
import Login from "./components/login/Login";
import Navbar from "./components/login/Navbar";
import { About } from "./components/login/About";


function App() {
  const RequireAuth = ({ children }) => {
    const authUser = localStorage.getItem("authUser");
    if (!authUser) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<><Navbar /><About /></>} />

        <Route
          path="/portal"
          element={
            <RequireAuth>
              <PortalLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Portal />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="shared" element={<SharedPage />} />
          <Route path="trash" element={<TrashPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
export default App;
