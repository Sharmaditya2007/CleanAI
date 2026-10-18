import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  List,
  Navigation,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Upload,
  Loader2,
  Check,
  LocateFixed,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Toilet, Complaint } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LeafletMap } from '../components/LeafletMap';

export const CustomerPortal: React.FC = () => {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);

  // Geolocation state
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string>('all');

  // Report Modal state
  const [reportingToilet, setReportingToilet] = useState<Toilet | null>(null);
  const [reportCategory, setReportCategory] = useState('dirty_toilet');
  const [reportDesc, setReportDesc] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportPhoto, setReportPhoto] = useState<File | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  // Track Complaint by Reference
  const [trackRef, setTrackRef] = useState('');
  const [trackedResult, setTrackedResult] = useState<Complaint | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    loadToilets();
  }, [userCoords]);

  const loadToilets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lon = userCoords.lon;
        params.max_distance_km = 30;
      }
      const list = await api.getToilets(params);
      setToilets(list);
      if (list.length > 0 && !selectedToilet) {
        setSelectedToilet(list[0]);
      }
    } catch (e) {
      console.error('Failed to load toilets for customer portal:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError('Showing central municipal view.');
        setUserCoords({ lat: 28.6315, lon: 77.2167 });
      },
      { timeout: 8000 }
    );
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingToilet || !reportDesc.trim()) return;

    setIsSubmittingReport(true);
    try {
      const cmp = await api.submitComplaint({
        toilet_id: reportingToilet.id,
        category: reportCategory,
        description: reportDesc,
        reporter_email: reportEmail || undefined,
        photo: reportPhoto || undefined
      });
      setSubmittedComplaint(cmp);
      setReportDesc('');
      setReportPhoto(null);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackRef.trim()) return;

    setTrackingLoading(true);
    setTrackError(null);
    setTrackedResult(null);

    try {
      const res = await api.trackComplaint(trackRef);
      setTrackedResult(res);
    } catch (err: any) {
      setTrackError(err.message || 'Reference number not found.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Filtered Toilets
  const filteredToilets = toilets.filter(t => {
    const matchesSearch = searchQuery === '' || 
      `${t.name} ${t.locality} ${t.address}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.verified_status === statusFilter;
    const matchesAccess = !accessibleOnly || t.accessibility;
    const matchesFac = selectedFacility === 'all' || t.facilities.includes(selectedFacility);
    return matchesSearch && matchesStatus && matchesAccess && matchesFac;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#F5F5F7]">
      
      {/* Header Banner */}
      <div className="apple-glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161616] text-[#2997FF] text-xs font-medium border border-[#262626]">
            <Compass size={13} />
            <span>Civic Sanitation Discovery</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F7]">
            Find Clean Public Toilets
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1A6] max-w-2xl leading-relaxed">
            Verified restrooms with real-time municipal cleanliness badges, wheelchair accessibility, and turn-by-turn navigation.
          </p>
        </div>

        {/* GPS Button */}
        <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5">
          <button
            onClick={handleRequestLocation}
            disabled={geoLoading}
            className="apple-button-primary px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            {geoLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Locating GPS...</span>
              </>
            ) : (
              <>
                <LocateFixed size={14} />
                <span>{userCoords ? 'Update My GPS' : 'Use Current Location'}</span>
              </>
            )}
          </button>
          {userCoords && (
            <span className="text-[11px] text-[#30D158] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
              GPS Active ({userCoords.lat.toFixed(4)}, {userCoords.lon.toFixed(4)})
            </span>
          )}
          {geoError && <p className="text-[11px] text-[#FF9F0A]">{geoError}</p>}
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="apple-glass-card p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
            <input
              type="text"
              placeholder="Search facility name, market, metro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#161616] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#2997FF] focus:outline-hidden"
            />
          </div>

          {/* Cleanliness Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
            {['all', 'Clean', 'Needs Cleaning', 'Under Maintenance'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                  statusFilter === s
                    ? 'bg-[#F5F5F7] text-[#050505] shadow-xs'
                    : 'bg-[#161616] text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#1F1F1F]'
                }`}
              >
                {s === 'all' ? 'All Statuses' : s}
              </button>
            ))}
          </div>

          {/* Toggle Map / List / Both View */}
          <div className="flex items-center bg-[#161616] p-0.5 rounded-full border border-[#262626] text-xs">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                viewMode === 'both' ? 'bg-[#262626] text-[#F5F5F7]' : 'text-[#A1A1A6]'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                viewMode === 'map' ? 'bg-[#262626] text-[#F5F5F7]' : 'text-[#A1A1A6]'
              }`}
            >
              Map Only
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                viewMode === 'list' ? 'bg-[#262626] text-[#F5F5F7]' : 'text-[#A1A1A6]'
              }`}
            >
              List Only
            </button>
          </div>
        </div>

        {/* Secondary Facilities Filter */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#1F1F1F] text-xs text-[#A1A1A6]">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-[#F5F5F7]">
            <input
              type="checkbox"
              checked={accessibleOnly}
              onChange={(e) => setAccessibleOnly(e.target.checked)}
              className="rounded bg-[#161616] border-[#262626] text-[#2997FF] focus:ring-0"
            />
            <span>♿ Wheelchair Accessible</span>
          </label>

          <div className="flex items-center gap-1.5">
            <span className="text-[#6E6E73] font-medium">Facility:</span>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="bg-[#161616] border border-[#262626] text-[#F5F5F7] rounded-lg px-2.5 py-1 text-xs focus:outline-hidden"
            >
              <option value="all">Any Facility</option>
              <option value="Running Water">Running Water</option>
              <option value="Washbasin">Washbasin</option>
              <option value="Western WC">Western WC</option>
              <option value="Indian Squat">Indian Squat</option>
              <option value="Soap Dispenser">Soap Dispenser</option>
            </select>
          </div>

          <span className="text-[#6E6E73] ml-auto font-mono text-[11px]">
            {filteredToilets.length} registered facilities
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`grid gap-6 ${viewMode === 'both' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        
        {/* Map View */}
        {(viewMode === 'both' || viewMode === 'map') && (
          <div className={`${viewMode === 'both' ? 'lg:col-span-6 xl:col-span-7' : 'w-full'}`}>
            <LeafletMap
              toilets={filteredToilets}
              selectedToilet={selectedToilet}
              onSelectToilet={(t) => setSelectedToilet(t)}
              userLocation={userCoords}
              height={viewMode === 'both' ? '600px' : '520px'}
            />
          </div>
        )}

        {/* List View */}
        {(viewMode === 'both' || viewMode === 'list') && (
          <div className={`${viewMode === 'both' ? 'lg:col-span-6 xl:col-span-5' : 'w-full'} space-y-3.5 max-h-[600px] overflow-y-auto pr-1`}>
            {filteredToilets.length === 0 ? (
              <div className="apple-glass-card p-10 rounded-3xl text-center text-[#6E6E73]">
                <Compass size={36} className="mx-auto mb-2 opacity-30" />
                <p className="font-semibold text-sm text-[#A1A1A6]">No public toilets found matching filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setAccessibleOnly(false);
                    setSelectedFacility('all');
                  }}
                  className="mt-3 text-xs font-semibold text-[#2997FF] hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              filteredToilets.map((toilet) => {
                const isSelected = selectedToilet?.id === toilet.id;
                return (
                  <div
                    key={toilet.id}
                    onClick={() => setSelectedToilet(toilet)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#161616] border-[#2997FF]/60 shadow-lg'
                        : 'bg-[#111111] border-[#262626] hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-base text-[#F5F5F7] tracking-tight">{toilet.name}</h3>
                        <p className="text-xs text-[#A1A1A6] mt-0.5">{toilet.address}, {toilet.locality}</p>
                      </div>

                      <StatusBadge
                        status={toilet.verified_status}
                        isStale={toilet.is_stale}
                        size="sm"
                      />
                    </div>

                    {toilet.distance_km !== undefined && (
                      <p className="text-[11px] font-mono text-[#2997FF] bg-[#2997FF]/10 border border-[#2997FF]/20 px-2 py-0.5 rounded-full inline-block mt-2">
                        📍 {toilet.distance_km} km away
                      </p>
                    )}

                    {/* Facilities Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {toilet.facilities.map((fac, idx) => (
                        <span key={idx} className="bg-[#161616] text-[#A1A1A6] border border-[#262626] px-2 py-0.5 rounded-full text-[11px] font-medium">
                          {fac}
                        </span>
                      ))}
                    </div>

                    {/* Operating hours & Actions Footer */}
                    <div className="flex items-center justify-between border-t border-[#1F1F1F] pt-3 mt-3 text-xs">
                      <span className="text-[#6E6E73] flex items-center gap-1 font-mono text-[11px]">
                        <Clock size={12} />
                        {toilet.opening_hours || '24x7'}
                      </span>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${toilet.latitude},${toilet.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-[#161616] hover:bg-[#222222] border border-[#262626] text-[#F5F5F7] font-medium rounded-full flex items-center gap-1 text-[11px] transition-colors"
                        >
                          <Navigation size={11} />
                          <span>Directions</span>
                        </a>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportingToilet(toilet);
                            setSubmittedComplaint(null);
                          }}
                          className="px-3 py-1.5 bg-[#FF453A]/10 hover:bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/25 font-semibold rounded-full text-[11px] transition-colors"
                        >
                          Report Issue
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* Citizen Complaint Tracking Lookup Section */}
      <div className="apple-glass-card p-6 sm:p-8 rounded-3xl space-y-4">
        <div>
          <h3 className="font-semibold text-base text-[#F5F5F7] flex items-center gap-2">
            <Search size={16} className="text-[#2997FF]" />
            <span>Track Citizen Sanitation Report</span>
          </h3>
          <p className="text-xs text-[#A1A1A6] mt-0.5">
            Check the live investigation and resolution status using your reference code (e.g. CMP-2026-XXXX).
          </p>
        </div>

        <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="Enter reference number (e.g. CMP-2026-9042)"
            value={trackRef}
            onChange={(e) => setTrackRef(e.target.value)}
            className="flex-1 text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl font-mono uppercase text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#2997FF] focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={trackingLoading}
            className="apple-button-primary px-6 py-3 rounded-xl text-xs font-semibold shrink-0 flex items-center justify-center gap-2"
          >
            {trackingLoading ? <Loader2 size={14} className="animate-spin" /> : 'Check Status'}
          </button>
        </form>

        {trackError && <p className="text-xs text-[#FF453A] font-medium">{trackError}</p>}

        {trackedResult && (
          <div className="p-4 bg-[#161616] rounded-2xl border border-[#262626] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[#2997FF]">{trackedResult.reference_number}</span>
              <span className="font-semibold px-2.5 py-0.5 rounded-full bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20">
                {trackedResult.status}
              </span>
            </div>
            <p className="font-semibold text-[#F5F5F7]">{trackedResult.toilet_name}</p>
            <p className="text-[#A1A1A6]">Category: {trackedResult.category.replace(/_/g, ' ')}</p>
            <p className="text-[#A1A1A6]">Report: "{trackedResult.description}"</p>
            {trackedResult.resolution_notes && (
              <p className="text-[#30D158] font-medium mt-1">
                Resolution: {trackedResult.resolution_notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Report Issue Modal */}
      {reportingToilet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
          <div className="w-full max-w-lg bg-[#0D0D0D] border border-[#262626] rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl text-[#F5F5F7]">
            
            {submittedComplaint ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-[#30D158]/10 border border-[#30D158]/30 text-[#30D158] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#F5F5F7]">Report Registered</h3>
                  <p className="text-xs text-[#A1A1A6] mt-1">Your sanitation report has been submitted to municipal authorities.</p>
                </div>
                <div className="p-3 bg-[#161616] rounded-xl font-mono text-sm font-bold text-[#2997FF] inline-block border border-[#262626]">
                  Ref: {submittedComplaint.reference_number}
                </div>
                <p className="text-xs text-[#6E6E73]">Save this reference number to track resolution status.</p>
                <button
                  onClick={() => {
                    setReportingToilet(null);
                    setSubmittedComplaint(null);
                  }}
                  className="apple-button-primary px-6 py-2.5 rounded-full text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                  <div>
                    <h3 className="font-semibold text-base text-[#F5F5F7]">Report Cleanliness Concern</h3>
                    <p className="text-xs text-[#A1A1A6] mt-0.5">{reportingToilet.name}</p>
                  </div>
                  <button onClick={() => setReportingToilet(null)} className="text-[#A1A1A6] hover:text-[#F5F5F7]">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleReportSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#A1A1A6] mb-1">Issue Category *</label>
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7]"
                    >
                      <option value="dirty_toilet">Dirty Toilet / Pan</option>
                      <option value="dirty_floor">Dirty / Slippery Floor</option>
                      <option value="missing_water">No Running Water</option>
                      <option value="broken_facility">Broken Flush / Tap / Fixture</option>
                      <option value="closed">Locked / Closed during hours</option>
                      <option value="wrong_location">Incorrect GPS Location</option>
                      <option value="other">Other Cleanliness Concern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#A1A1A6] mb-1">Detailed Description *</label>
                    <textarea
                      required
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      placeholder="Describe the issue..."
                      rows={3}
                      className="w-full text-xs p-3 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7] focus:border-[#2997FF] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#A1A1A6] mb-1">Your Email (Optional for alerts)</label>
                    <input
                      type="email"
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      placeholder="e.g. citizen@gmail.com"
                      className="w-full text-xs p-2.5 bg-[#161616] border border-[#262626] rounded-xl text-[#F5F5F7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#A1A1A6] mb-1">Attach Photo (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && setReportPhoto(e.target.files[0])}
                      className="w-full text-xs text-[#A1A1A6] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-[#1A1A1A] file:text-[#F5F5F7] hover:file:bg-[#222222]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[#1F1F1F]">
                    <button
                      type="button"
                      onClick={() => setReportingToilet(null)}
                      className="px-4 py-2 text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] rounded-full"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReport}
                      className="px-5 py-2.5 bg-[#FF453A] hover:bg-[#FF453A]/90 text-white text-xs font-semibold rounded-full shadow-xs flex items-center gap-2"
                    >
                      {isSubmittingReport ? <Loader2 size={14} className="animate-spin" /> : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

