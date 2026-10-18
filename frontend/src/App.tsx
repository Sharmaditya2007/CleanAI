import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { FindToiletsPage } from './pages/FindToiletsPage';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { MunicipalPortal } from './pages/MunicipalPortal';
import { OwnerPortal } from './pages/OwnerPortal';
import { LoginPage } from './pages/LoginPage';
import { CleanAIPreloader } from './components/CleanAIPreloader';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [isPreloaderActive, setIsPreloaderActive] = useState(true);

  return (
    <AuthProvider>
      <Router>
        {/* Preserved 5-second cinematic preloader */}
        {isPreloaderActive && (
          <CleanAIPreloader onComplete={() => setIsPreloaderActive(false)} />
        )}
        
        <div className="min-h-screen flex flex-col bg-[#050505] text-[#F5F5F7] selection:bg-[#F5F5F7] selection:text-[#050505]">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/toilets" element={<FindToiletsPage />} />
              <Route path="/customer" element={<Navigate to="/toilets" replace />} />
              <Route path="/report" element={<ReportIssuePage />} />
              <Route path="/authority" element={<MunicipalPortal />} />
              <Route path="/municipal" element={<MunicipalPortal />} />
              <Route path="/owner" element={<OwnerPortal />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Simple Modern Minimalist Footer */}
          <footer className="border-t border-[#1F1F1F] bg-[#0A0A0A] py-10 px-4 sm:px-6 lg:px-8 text-xs text-[#A1A1A6]">
            <div className="max-w-7xl mx-auto space-y-6">
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#1A1A1A]">
                <div className="flex items-center gap-2 text-[#F5F5F7] font-semibold">
                  <div className="w-6 h-6 rounded-md bg-[#161616] border border-[#262626] flex items-center justify-center text-[#F5F5F7]">
                    <Sparkles size={12} />
                  </div>
                  <span>Clean AI</span>
                  <span className="text-xs text-[#6E6E73] font-normal">| Municipal Public Sanitation Network</span>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs text-[#A1A1A6]">
                  <Link to="/" className="hover:text-[#F5F5F7] transition-colors">Home</Link>
                  <Link to="/toilets" className="hover:text-[#F5F5F7] transition-colors">Find Toilets</Link>
                  <Link to="/report" className="hover:text-[#F5F5F7] transition-colors">Report an Issue</Link>
                  <Link to="/authority" className="hover:text-[#F5F5F7] transition-colors">Authority Dashboard</Link>
                  <Link to="/owner" className="hover:text-[#F5F5F7] transition-colors">Owner Portal</Link>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6E6E73]">
                <p>
                  &copy; {new Date().getFullYear()} Clean AI. Built with original YOLOv11 nano vision models for public sanitation intelligence.
                </p>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Municipal Registry Online</span>
                </div>
              </div>

            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
