import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CustomerPortal } from './pages/CustomerPortal';
import { MunicipalPortal } from './pages/MunicipalPortal';
import { OwnerPortal } from './pages/OwnerPortal';
import { HealthPage } from './pages/HealthPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/customer" element={<CustomerPortal />} />
              <Route path="/municipal" element={<MunicipalPortal />} />
              <Route path="/owner" element={<OwnerPortal />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="font-semibold text-slate-700">
                Clean AI &copy; {new Date().getFullYear()} — Smarter Toilets. Cleaner Cities.
              </p>
              <div className="flex items-center gap-4 text-slate-500">
                <span>Autonomous YOLO Sanitation Verification</span>
                <span>•</span>
                <span>Municipal Open Data</span>
                <span>•</span>
                <span>Audit Logs Protected</span>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
