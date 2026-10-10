import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Workbench from './pages/Workbench';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-6 rounded bg-brand" />
          <h1 className="font-semibold text-lg">个人知识库</h1>
        </div>
        <nav className="flex gap-4 text-sm text-slate-600">
          <Link to="/app" className="hover:text-brand">工作台</Link>
          <Link to="/login" className="hover:text-brand">登录</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<Workbench />} />
          <Route path="*" element={<div className="p-8">页面不存在</div>} />
        </Routes>
      </main>
    </div>
  );
}
