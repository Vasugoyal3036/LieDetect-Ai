import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '80vh',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px',
            border: '3px solid rgba(255,255,255,0.08)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            margin: '0 auto 1rem',
          }} className="animate-spin"></div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: '0.9rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}