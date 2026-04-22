import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import Feedback from './pages/Feedback';
import History from './pages/History';
import QuestionBank from './pages/QuestionBank';
import Report from './pages/Report';
import SharedReport from './pages/SharedReport';
import Pricing from './pages/Pricing';
import Team from './pages/Team';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import CandidateInvite from './pages/CandidateInvite';
import Invites from './pages/Invites';
import Simulator from './pages/Simulator';
import Practice from './pages/Practice';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/shared-report/:token" element={<SharedReport />} />
      <Route path="/invite/:token" element={<CandidateInvite />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
      <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/questions" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/invites" element={<ProtectedRoute><Invites /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
      <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
      <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
