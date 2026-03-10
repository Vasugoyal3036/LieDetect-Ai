import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import Feedback from './pages/Feedback';
import History from './pages/History';
import QuestionBank from './pages/QuestionBank';
import Report from './pages/Report';
import SharedReport from './pages/SharedReport';
import Pricing from './pages/Pricing';
import NotFound from './pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/shared-report/:token" element={<SharedReport />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
      <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/questions" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
