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
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-[12px] px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-[13px] px-3.5 py-1.5 gap-2 font-semibold'
  }[size];

  const iconSizes = {
    sm: 11,
    md: 13,
    lg: 15
  }[size];

  const getStatusConfig = () => {
    switch (status) {
      case 'Clean':
        return {
          bg: 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/25',
          icon: <CheckCircle2 size={iconSizes} className="text-[#30D158]" />,
          label: 'Clean'
        };
      case 'Needs Cleaning':
        return {
          bg: 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/25',
          icon: <AlertTriangle size={iconSizes} className="text-[#FF9F0A]" />,
          label: 'Needs Cleaning'
        };
      case 'Under Maintenance':
        return {
          bg: 'bg-[#8E8E93]/10 text-[#8E8E93] border-[#8E8E93]/25',
          icon: <Wrench size={iconSizes} className="text-[#8E8E93]" />,
          label: 'Under Maintenance'
        };
      case 'Verification Pending':
      default:
        return {
          bg: 'bg-[#2997FF]/10 text-[#2997FF] border-[#2997FF]/25',
          icon: <Clock size={iconSizes} className="text-[#2997FF]" />,
          label: 'Verification Pending'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center rounded-full border backdrop-blur-md tracking-tight ${config.bg} ${sizeClasses}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>

      {isStale && (
        <span
          className="inline-flex items-center rounded-full border border-[#FF9F0A]/30 bg-[#FF9F0A]/10 text-[#FF9F0A] text-[11px] px-2 py-0.5 gap-1 font-medium tracking-tight"
          title="Last confirmed inspection was over 3 days ago"
        >
          <AlertCircle size={11} className="text-[#FF9F0A]" />
          <span>Outdated Verification</span>
        </span>
      )}
    </div>
  );
};

