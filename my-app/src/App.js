import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Portal } from "./components/portal/Portal";
import { PortalLayout } from "./components/PortalLayout";
import { FilesPage } from "./components/sidebar/FilesPage";
import { SharedPage } from "./components/sidebar/SharedPage";
import { TrashPage } from "./components/sidebar/TrashPage";
import { SettingsPage } from "./components/sidebar/SettingsPage";
import Login from "./components/login/Login";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PortalLayout />}> 
          <Route index element={<Portal />} />
          <Route path="portal" element={<Portal />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="shared" element={<SharedPage />} />
          <Route path="trash" element={<TrashPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
export default App;
