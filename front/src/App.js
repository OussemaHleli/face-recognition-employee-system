import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeePage from './pages/EmployeePage';
import EmployeeDetails from './pages/EmployeeDetails';
import AddEmployeePage from './pages/AddEmployeePage';
import FaceUploadPage from './pages/FaceUploadPage'; // ✅ Add this
import FaceCheckPage from './pages/FaceCheckPage';   // ✅ Already included

// Components
import PrivateRoute from './components/PrivateRoute';

// Firebase setup
import './firebase';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Private Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/employes"
          element={
            <PrivateRoute>
              <EmployeePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/employes/ajouter"
          element={
            <PrivateRoute>
              <AddEmployeePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/employes/details/:id"
          element={
            <PrivateRoute>
              <EmployeeDetails />
            </PrivateRoute>
          }
        />

        {/* 👇 Public face routes (or make private if needed) */}
        <Route path="/face-upload" element={<FaceUploadPage />} />
        <Route path="/facecheck" element={<FaceCheckPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
