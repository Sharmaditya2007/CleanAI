import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Clock,
  Layers,
  Search,
  Filter,
  Camera,
  Check,
  X,
  FileText,
  AlertCircle,
  PlusCircle,
  TrendingUp,
  BarChart3,
  Loader2,
  Send,
  ChevronRight,
  RotateCw
} from 'lucide-react';
import { api } from '../services/api';
import { Toilet, MunicipalAnalytics, Complaint, CleaningTask } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AIInspectModal } from '../components/AIInspectModal';
import { useAuth } from '../context/AuthContext';

export const MunicipalPortal: React.FC = () => {
  const { user, quickSwitchRole } = useAuth();

  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [analytics, setAnalytics] = useState<MunicipalAnalytics | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'toilets' | 'complaints' | 'tasks' | 'analytics'>('toilets');

  // Modal states
  const [selectedToiletForInspect, setSelectedToiletForInspect] = useState<Toilet | null>(null);
  const [rejectingToiletId, setRejectingToiletId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Assign task modal
  const [assigningTaskToilet, setAssigningTaskToilet] = useState<Toilet | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [taskPriority, setTaskPriority] = useState('High');

  useEffect(() => {
    if (user && user.role !== 'officer') {
      quickSwitchRole('officer');
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, anData, cList, tkList] = await Promise.all([
        api.getToilets(),
        api.getAnalytics(),
        api.getComplaints(),
        api.getTasks()
      ]);
      setToilets(tList);
      setAnalytics(anData);
      setComplaints(cList);
      setTasks(tkList);
    } catch (e) {
      console.error('Failed to load municipal portal data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (toiletId: string) => {
    try {
      await api.approveToilet(toiletId);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Approval failed');
    }
  };

  const handleRejectSubmit = async (toiletId: string) => {
    if (!rejectReason.trim()) {
      alert('Rejection reason is required.');
      return;
    }
    try {
      await api.rejectToilet(toiletId, rejectReason);
      setRejectingToiletId(null);
      setRejectReason('');
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Rejection failed');
    }
  };

  const handleAssignTaskSubmit = async () => {
    if (!assigningTaskToilet) return;
    try {
      await api.createTask({
        toilet_id: assigningTaskToilet.id,
        priority: taskPriority,
        notes: taskNotes || 'Sanitation maintenance required.'
      });
      setAssigningTaskToilet(null);
      setTaskNotes('');
      await loadData();
      alert('Cleaning task successfully assigned to facility owner.');
    } catch (e: any) {
      alert(e.message || 'Task assignment failed');
    }
  };

  const handleUpdateComplaint = async (complaintId: string, status: string) => {
    try {
      await api.updateComplaintStatus(complaintId, status, 'Reviewed and verified by municipal officer.');
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to update complaint');
    }
  };

  // Filtered toilets
  const filteredToilets = toilets.filter(t => {
    const matchesSearch = searchQuery === '' || 
      `${t.name} ${t.locality} ${t.address}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.verified_status === statusFilter || t.registration_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F5F5F7]">
      
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#161616] border border-[#262626] text-[#2997FF] rounded-xl">
              <ShieldCheck size={20} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F7]">
              Municipal Command Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1A6] mt-1">
            Real-time public sanitation intelligence, YOLO inspection audit trails, and contractor oversight.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 bg-[#161616] hover:bg-[#222222] text-[#F5F5F7] font-medium border border-[#262626] rounded-full text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RotateCw size={13} className={loading ? 'animate-spin text-[#2997FF]' : 'text-[#A1A1A6]'} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Live Metric Cards from Real Database */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="apple-glass-card p-3.5 rounded-2xl text-center">
            <p className="text-[11px] font-medium text-[#A1A1A6]">Total Facilities</p>
            <p className="text-2xl font-bold tracking-tight text-[#F5F5F7] mt-0.5">{analytics.total_toilets}</p>
          </div>
          <div className="apple-glass-card p-3.5 rounded-2xl text-center">
            <p className="text-[11px] font-medium text-[#30D158]">Clean</p>
            <p className="text-2xl font-bold tracking-tight text-[#30D158] mt-0.5">{analytics.clean_toilets}</p>
          </div>
          <div className="apple-glass-card p-3.5 rounded-2xl text-center">
            <p className="text-[11px] font-medium text-[#FF9F0A]">Needs Cleaning</p>
            <p className="text-2xl font-bold tracking-tight text-[#FF9F0A] mt-0.5">{analytics.needs_cleaning_toilets}</p>
          </div>
          <div className="apple-glass-card p-3.5 rounded-2xl text-center">
            <p className="text-[11px] font-medium text-[#8E8E93]">Maintenance</p>
            <p className="text-2xl font-bold tracking-tight text-[#8E8E93] mt-0.5">{analytics.under_maintenance_toilets}</p>
          </div>
          <div className="apple-glass-card p-3.5 rounded-2xl text-center">
            <p className="text-[11px] font-medium text-[#2997FF]">Pending Review</p>
            <p className="text-2xl font-bold tracking-tight text-[#2997FF] mt-0.5">{analytics.pending_approval_toilets}</p>
          </div>
          <div className="apple-glass-card p-3.5 rounded-2xl text-center">
            <p className="text-[11px] font-medium text-[#BF5AF2]">Inspections</p>
            <p className="text-2xl font-bold tracking-tight text-[#BF5AF2] mt-0.5">{analytics.completed_inspections}</p>
          </div>
          <div className="apple-glass-card p-3.5 rounded-2xl text-center">
            <p className="text-[11px] font-medium text-[#FF453A]">Complaints</p>
            <p className="text-2xl font-bold tracking-tight text-[#FF453A] mt-0.5">{analytics.open_complaints}</p>
          </div>
          <div className="apple-glass-card p-3.5 rounded-2xl text-center">
            <p className="text-[11px] font-medium text-[#FF9F0A]">Overdue Tasks</p>
            <p className="text-2xl font-bold tracking-tight text-[#FF9F0A] mt-0.5">{analytics.overdue_tasks}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#262626] space-x-2 sm:space-x-4">
        <button
          onClick={() => setActiveTab('toilets')}
          className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'toilets'
              ? 'border-[#2997FF] text-[#2997FF]'
              : 'border-transparent text-[#A1A1A6] hover:text-[#F5F5F7]'
          }`}
        >
          <Layers size={15} />
          <span>Toilet Facilities ({toilets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'complaints'
              ? 'border-[#2997FF] text-[#2997FF]'
              : 'border-transparent text-[#A1A1A6] hover:text-[#F5F5F7]'
          }`}
        >
          <AlertCircle size={15} />
          <span>Citizen Reports ({complaints.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'tasks'
              ? 'border-[#2997FF] text-[#2997FF]'
              : 'border-transparent text-[#A1A1A6] hover:text-[#F5F5F7]'
          }`}
        >
          <Clock size={15} />
          <span>Cleaning Tasks ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'analytics'
              ? 'border-[#2997FF] text-[#2997FF]'
              : 'border-transparent text-[#A1A1A6] hover:text-[#F5F5F7]'
          }`}
        >
          <TrendingUp size={15} />
          <span>Analytics & Trends</span>
        </button>
      </div>

      {/* TAB 1: TOILETS LIST & AI INSPECT */}
      {activeTab === 'toilets' && (
        <div className="space-y-4">
          
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
              <input
                type="text"
                placeholder="Search facility name or locality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#2997FF] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
              <span className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mr-1">Status:</span>
              {['all', 'Clean', 'Needs Cleaning', 'Under Maintenance', 'Pending Approval'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                    statusFilter === s
                      ? 'bg-[#F5F5F7] text-[#050505]'
                      : 'bg-[#161616] text-[#A1A1A6] hover:text-[#F5F5F7]'
                  }`}
                >
                  {s === 'all' ? 'All Facilities' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="apple-glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#161616] border-b border-[#262626] text-[#A1A1A6] font-semibold">
                    <th className="py-3.5 px-4">Facility Name & Locality</th>
                    <th className="py-3.5 px-4">Registration</th>
                    <th className="py-3.5 px-4">Verified Public Status</th>
                    <th className="py-3.5 px-4">Facilities</th>
                    <th className="py-3.5 px-4">Owner / Contractor</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {filteredToilets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[#6E6E73] font-medium">
                        No facilities found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredToilets.map((toilet) => (
                      <tr key={toilet.id} className="hover:bg-[#161616]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#F5F5F7] text-sm tracking-tight">{toilet.name}</p>
                          <p className="text-[#A1A1A6] text-[11px] mt-0.5">{toilet.address}, {toilet.locality}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              toilet.registration_status === 'Approved'
                                ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/25'
                                : toilet.registration_status === 'Pending Approval'
                                ? 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/25'
                                : 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/25'
                            }`}
                          >
                            {toilet.registration_status}
                          </span>
                          {toilet.rejection_reason && (
                            <p className="text-[10px] text-[#FF453A] mt-1 max-w-[140px] truncate" title={toilet.rejection_reason}>
                              Reason: {toilet.rejection_reason}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={toilet.verified_status} isStale={toilet.is_stale} size="sm" />
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {toilet.facilities.slice(0, 3).map((f, i) => (
                              <span key={i} className="bg-[#161616] text-[#A1A1A6] border border-[#262626] px-1.5 py-0.5 rounded-md text-[10px]">
                                {f}
                              </span>
                            ))}
                            {toilet.facilities.length > 3 && (
                              <span className="text-[10px] text-[#6E6E73]">+{toilet.facilities.length - 3}</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium text-[#F5F5F7]">{toilet.owner_name || 'Municipal'}</p>
                          <p className="text-[#6E6E73] text-[10px] font-mono">{toilet.contact_number || 'N/A'}</p>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {toilet.registration_status === 'Pending Approval' && (
                              <>
                                <button
                                  onClick={() => handleApprove(toilet.id)}
                                  className="p-1.5 bg-[#30D158]/20 hover:bg-[#30D158]/30 text-[#30D158] border border-[#30D158]/30 rounded-lg transition-colors"
                                  title="Approve Registration"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => setRejectingToiletId(toilet.id)}
                                  className="p-1.5 bg-[#FF453A]/20 hover:bg-[#FF453A]/30 text-[#FF453A] border border-[#FF453A]/30 rounded-lg transition-colors"
                                  title="Reject Registration"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => setSelectedToiletForInspect(toilet)}
                              className="apple-button-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-semibold shadow-xs"
                            >
                              <Camera size={13} />
                              <span>AI Inspect</span>
                            </button>

                            <button
                              onClick={() => setAssigningTaskToilet(toilet)}
                              className="px-2.5 py-1.5 bg-[#161616] hover:bg-[#222222] border border-[#262626] text-[#F5F5F7] font-medium rounded-full text-[11px] transition-colors"
                              title="Assign Cleaning Task"
                            >
                              Assign Task
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CITIZEN COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="apple-glass-card rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-[#262626]">
            <h3 className="font-semibold text-base text-[#F5F5F7]">Citizen Sanitation Reports</h3>
            <p className="text-xs text-[#A1A1A6] mt-0.5">
              Review issues filed by public citizens with unique tracking references.
            </p>
          </div>

          <div className="divide-y divide-[#1F1F1F]">
            {complaints.length === 0 ? (
              <p className="text-center py-8 text-[#6E6E73] text-xs">No citizen complaints recorded.</p>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#161616]/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#2997FF] bg-[#2997FF]/10 border border-[#2997FF]/20 px-2 py-0.5 rounded-full">
                        {c.reference_number}
                      </span>
                      <span className="text-xs font-medium text-[#F5F5F7] bg-[#161616] border border-[#262626] px-2 py-0.5 rounded-full capitalize">
                        {c.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-[#6E6E73] font-mono">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-[#F5F5F7]">{c.toilet_name}</p>
                    <p className="text-xs text-[#A1A1A6] leading-relaxed max-w-2xl">{c.description}</p>
                    {c.resolution_notes && (
                      <p className="text-[11px] text-[#30D158] font-medium mt-1">Resolution: {c.resolution_notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-[#161616] border-[#262626] text-[#A1A1A6]">
                      {c.status}
                    </span>
                    {c.status !== 'Resolved' && (
                      <button
                        onClick={() => handleUpdateComplaint(c.id, 'Resolved')}
                        className="apple-button-primary px-3 py-1.5 text-xs font-semibold rounded-full transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CLEANING TASKS */}
      {activeTab === 'tasks' && (
        <div className="apple-glass-card rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-[#262626]">
            <h3 className="font-semibold text-base text-[#F5F5F7]">Assigned Cleaning Tasks</h3>
            <p className="text-xs text-[#A1A1A6] mt-0.5">
              Active sanitation orders dispatched to facility contractors and owners.
            </p>
          </div>

          <div className="divide-y divide-[#1F1F1F]">
            {tasks.length === 0 ? (
              <p className="text-center py-8 text-[#6E6E73] text-xs">No active cleaning tasks.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#161616]/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/25">
                        {task.priority} Priority
                      </span>
                      <span className="text-xs text-[#A1A1A6]">
                        Assigned to: {task.assigned_to_owner_name || 'Contractor'}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-[#F5F5F7]">{task.toilet_name}</p>
                    <p className="text-xs text-[#A1A1A6]">{task.notes}</p>
                    {task.completion_notes && (
                      <p className="text-xs text-[#2997FF] bg-[#2997FF]/10 p-2 rounded-xl mt-1 font-medium border border-[#2997FF]/20">
                        Owner Completion Report: "{task.completion_notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full border ${
                        task.status === 'Verified'
                          ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/25'
                          : task.status === 'Cleaning Reported'
                          ? 'bg-[#2997FF]/10 text-[#2997FF] border-[#2997FF]/25'
                          : 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/25'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS & TRENDS */}
      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inspections Trend */}
          <div className="apple-glass-card p-6 rounded-3xl space-y-4">
            <h3 className="font-semibold text-base text-[#F5F5F7] flex items-center gap-2">
              <BarChart3 size={16} className="text-[#2997FF]" />
              <span>Inspection Activity (Last 7 Days)</span>
            </h3>
            <div className="space-y-2.5 pt-2">
              {analytics.recent_inspections_trend.map((trend, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="w-16 font-mono text-[#A1A1A6]">{trend.day}</span>
                  <div className="flex-1 mx-3 h-3 bg-[#161616] rounded-full overflow-hidden flex border border-[#262626]">
                    <div
                      className="bg-[#30D158] h-full"
                      style={{ width: `${trend.inspections > 0 ? (trend.clean / trend.inspections) * 100 : 0}%` }}
                    />
                    <div
                      className="bg-[#FF9F0A] h-full"
                      style={{ width: `${trend.inspections > 0 ? (trend.needs_cleaning / trend.inspections) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-14 text-right font-mono text-[#F5F5F7]">{trend.inspections} insp</span>
                </div>
              ))}
            </div>
          </div>

          {/* Frequent Issue Categories */}
          <div className="apple-glass-card p-6 rounded-3xl space-y-4">
            <h3 className="font-semibold text-base text-[#F5F5F7] flex items-center gap-2">
              <TrendingUp size={16} className="text-[#2997FF]" />
              <span>Most Common Sanitation Complaints</span>
            </h3>
            <div className="space-y-3 pt-2">
              {analytics.frequent_issue_categories.map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#F5F5F7]">{cat.category}</span>
                    <span className="text-[#6E6E73] font-mono">{cat.count} reports</span>
                  </div>
                  <div className="w-full h-2 bg-[#161616] rounded-full overflow-hidden border border-[#262626]">
                    <div
                      className="bg-gradient-to-r from-[#2997FF] to-[#0077ED] h-full rounded-full"
                      style={{ width: `${Math.min(100, cat.count * 30)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Inspection Modal */}
      {selectedToiletForInspect && (
        <AIInspectModal
          toilet={selectedToiletForInspect}
          onClose={() => setSelectedToiletForInspect(null)}
          onInspectionConfirmed={async () => {
            await loadData();
          }}
        />
      )}

      {/* Reject Modal */}
      {rejectingToiletId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
          <div className="w-full max-w-md bg-[#0D0D0D] border border-[#262626] rounded-3xl p-6 space-y-4 shadow-2xl text-[#F5F5F7]">
            <h3 className="font-semibold text-base text-[#F5F5F7]">Record Rejection Reason</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="State the regulatory or physical reason for rejection..."
              rows={3}
              className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#FF453A] focus:outline-hidden"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingToiletId(null)}
                className="px-4 py-2 text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectSubmit(rejectingToiletId)}
                className="px-4 py-2 bg-[#FF453A] hover:bg-[#FF453A]/90 text-white text-xs font-semibold rounded-full"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {assigningTaskToilet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
          <div className="w-full max-w-md bg-[#0D0D0D] border border-[#262626] rounded-3xl p-6 space-y-4 shadow-2xl text-[#F5F5F7]">
            <h3 className="font-semibold text-base text-[#F5F5F7]">Assign Cleaning Task</h3>
            <p className="text-xs text-[#A1A1A6]">Facility: {assigningTaskToilet.name}</p>
            
            <div>
              <label className="block text-xs font-medium text-[#A1A1A6] mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full text-xs p-2.5 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1A6] mb-1">Instructions / Notes</label>
              <textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="Specific instructions (e.g. mop floor, restock soap, repair tap)..."
                rows={3}
                className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#2997FF] focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAssigningTaskToilet(null)}
                className="px-4 py-2 text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTaskSubmit}
                className="apple-button-primary px-4 py-2 text-xs font-semibold rounded-full"
              >
                Dispatch Task
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

