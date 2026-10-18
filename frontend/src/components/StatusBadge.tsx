import React from 'react';
import { CheckCircle2, AlertTriangle, Wrench, Clock, AlertCircle } from 'lucide-react';
import { ToiletVerifiedStatus } from '../types';

interface StatusBadgeProps {
  status: ToiletVerifiedStatus;
  isStale?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isStale, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm sm:text-base px-3.5 py-1.5 gap-2 font-semibold'
  }[size];

  const iconSizes = {
    sm: 12,
    md: 15,
    lg: 18
  }[size];

  const getStatusConfig = () => {
    switch (status) {
      case 'Clean':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-500/20',
          icon: <CheckCircle2 size={iconSizes} className="text-emerald-600" />,
          label: 'Clean'
        };
      case 'Needs Cleaning':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200 ring-1 ring-amber-500/20',
          icon: <AlertTriangle size={iconSizes} className="text-amber-600" />,
          label: 'Needs Cleaning'
        };
      case 'Under Maintenance':
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300 ring-1 ring-slate-400/20',
          icon: <Wrench size={iconSizes} className="text-slate-600" />,
          label: 'Under Maintenance'
        };
      case 'Verification Pending':
      default:
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200 ring-1 ring-sky-500/20',
          icon: <Clock size={iconSizes} className="text-sky-600" />,
          label: 'Verification Pending'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses} shadow-xs`}>
        {config.icon}
        <span>{config.label}</span>
      </span>

      {isStale && (
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-xs px-2 py-0.5 gap-1 font-medium" title="Last confirmed inspection was over 3 days ago">
          <AlertCircle size={12} className="text-amber-600" />
          <span>Outdated Verification</span>
        </span>
      )}
    </div>
  );
};
