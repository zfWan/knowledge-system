import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Workbench from './pages/Workbench';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './stores/auth';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/workbench" element={<Workbench />} />
      </Route>
      <Route path="/" element={<Navigate to="/workbench" replace />} />
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center text-slate-500">
            页面不存在
          </div>
        }
      />
    </Routes>
  );
}
