import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CustomerPortal } from './pages/CustomerPortal';
import { MunicipalPortal } from './pages/MunicipalPortal';
import { OwnerPortal } from './pages/OwnerPortal';
import { HealthPage } from './pages/HealthPage';
import { LoginPage } from './pages/LoginPage';
import { CleanAIPreloader } from './components/CleanAIPreloader';
import { Sparkles, Shield, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [isPreloaderActive, setIsPreloaderActive] = useState(true);

  return (
    <AuthProvider>
      <Router>
        {isPreloaderActive && (
          <CleanAIPreloader onComplete={() => setIsPreloaderActive(false)} />
        )}
        <div className="min-h-screen flex flex-col bg-[#050505] text-[#F5F5F7] selection:bg-[#2997FF]/30 selection:text-white">
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
          
          {/* Apple-style Minimal Dark Footer */}
          <footer className="border-t border-[#262626] bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8 text-xs text-[#A1A1A6]">
            <div className="max-w-7xl mx-auto space-y-8">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-[#1F1F1F]">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#F5F5F7] font-semibold text-sm">
                    <div className="w-5 h-5 rounded-md bg-[#2997FF]/20 flex items-center justify-center text-[#2997FF]">
                      <Sparkles size={12} />
                    </div>
                    <span>Clean AI</span>
                  </div>
                  <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                    AI-powered public sanitation intelligence for modern smart cities.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#F5F5F7]">Platform</p>
                  <ul className="space-y-1.5 text-[12px]">
                    <li><Link to="/customer" className="hover:text-[#F5F5F7] transition-colors">Find a Clean Toilet</Link></li>
                    <li><Link to="/municipal" className="hover:text-[#F5F5F7] transition-colors">Municipal Command</Link></li>
                    <li><Link to="/owner" className="hover:text-[#F5F5F7] transition-colors">Owner & Contractor Portal</Link></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#F5F5F7]">Technology</p>
                  <ul className="space-y-1.5 text-[12px]">
                    <li><Link to="/health" className="hover:text-[#F5F5F7] transition-colors">YOLOv11 Neural Core</Link></li>
                    <li><span className="text-[#6E6E73]">16 Sanitation Classes</span></li>
                    <li><span className="text-[#6E6E73]">GPS Haversine Engine</span></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#F5F5F7]">System Status</p>
                  <div className="flex items-center gap-2 text-[12px] text-[#30D158]">
                    <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse"></span>
                    <span>All Systems Operational</span>
                  </div>
                  <p className="text-[11px] text-[#6E6E73]">PyTorch Inference Engine Live</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6E6E73]">
                <p>
                  Copyright &copy; {new Date().getFullYear()} Clean AI Inc. All rights reserved. Built with original YOLOv11 nano vision models.
                </p>
                <div className="flex items-center gap-4">
                  <span className="hover:text-[#A1A1A6] cursor-pointer">Privacy Policy</span>
                  <span>•</span>
                  <span className="hover:text-[#A1A1A6] cursor-pointer">Terms of Service</span>
                  <span>•</span>
                  <span className="hover:text-[#A1A1A6] cursor-pointer">Open Data License</span>
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
