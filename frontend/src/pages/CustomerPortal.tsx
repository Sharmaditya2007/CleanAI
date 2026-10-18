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
  LocateFixed
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
        setGeoError('Location permission denied or unavailable. Showing central municipal view.');
        // Default to Connaught Place, New Delhi coordinates
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Compass size={14} />
            <span>Public Civic Discovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Find Clean Public Toilets Nearby
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Discover verified restrooms with live municipal cleanliness badges, handicap access, and turn-by-turn directions.
          </p>
        </div>

        {/* GPS Button */}
        <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5">
          <button
            onClick={handleRequestLocation}
            disabled={geoLoading}
            className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-2xl card-shadow flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {geoLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Locating GPS...</span>
              </>
            ) : (
              <>
                <LocateFixed size={16} />
                <span>{userCoords ? 'Update My GPS Location' : 'Use My Current Location'}</span>
              </>
            )}
          </button>
          {userCoords && (
            <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              GPS active ({userCoords.lat.toFixed(4)}, {userCoords.lon.toFixed(4)})
            </span>
          )}
          {geoError && <p className="text-[11px] text-amber-600">{geoError}</p>}
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 card-shadow space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by facility name, market, metro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Cleanliness Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
            {['all', 'Clean', 'Needs Cleaning', 'Under Maintenance'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'All Statuses' : s}
              </button>
            ))}
          </div>

          {/* Toggle Map / List / Both View */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Map Only
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              List Only
            </button>
          </div>
        </div>

        {/* Secondary Facilities Filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={accessibleOnly}
              onChange={(e) => setAccessibleOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>♿ Wheelchair Accessible</span>
          </label>

          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold">Facility:</span>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
            >
              <option value="all">Any Facility</option>
              <option value="Running Water">Running Water</option>
              <option value="Washbasin">Washbasin</option>
              <option value="Western WC">Western WC</option>
              <option value="Indian Squat">Indian Squat</option>
              <option value="Soap Dispenser">Soap Dispenser</option>
            </select>
          </div>

          <span className="text-slate-400 ml-auto font-medium">
            Showing {filteredToilets.length} registered facilities
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
          <div className={`${viewMode === 'both' ? 'lg:col-span-6 xl:col-span-5' : 'w-full'} space-y-4 max-h-[600px] overflow-y-auto pr-1`}>
            {filteredToilets.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 card-shadow">
                <Compass size={36} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-sm">No public toilets found matching your filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setAccessibleOnly(false);
                    setSelectedFacility('all');
                  }}
                  className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
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
                    className={`p-5 rounded-3xl border transition-all cursor-pointer card-shadow ${
                      isSelected
                        ? 'bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{toilet.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{toilet.address}, {toilet.locality}</p>
                      </div>

                      <StatusBadge
                        status={toilet.verified_status}
                        isStale={toilet.is_stale}
                        size="sm"
                      />
                    </div>

                    {toilet.distance_km !== undefined && (
                      <p className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md inline-block mt-2">
                        📍 {toilet.distance_km} km away
                      </p>
                    )}

                    {/* Facilities Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {toilet.facilities.map((fac, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                          {fac}
                        </span>
                      ))}
                    </div>

                    {/* Operating hours & Actions Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3 text-xs">
                      <span className="text-slate-500 flex items-center gap-1 font-medium">
                        <Clock size={13} />
                        {toilet.opening_hours || '24x7'}
                      </span>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${toilet.latitude},${toilet.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Navigation size={12} />
                          <span>Directions</span>
                        </a>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportingToilet(toilet);
                            setSubmittedComplaint(null);
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition-colors"
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
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 card-shadow space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Search size={18} className="text-emerald-700" />
            <span>Track Citizen Sanitation Report</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Check the live investigation and resolution status of an issue filed with your reference number (e.g. CMP-2026-XXXX).
          </p>
        </div>

        <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="Enter reference number (e.g. CMP-2026-9042)"
            value={trackRef}
            onChange={(e) => setTrackRef(e.target.value)}
            className="flex-1 text-xs p-3 border border-slate-300 rounded-xl font-mono uppercase"
          />
          <button
            type="submit"
            disabled={trackingLoading}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-2"
          >
            {trackingLoading ? <Loader2 size={16} className="animate-spin" /> : 'Check Status'}
          </button>
        </form>

        {trackError && <p className="text-xs text-red-600 font-medium">{trackError}</p>}

        {trackedResult && (
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900">{trackedResult.reference_number}</span>
              <span className="font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {trackedResult.status}
              </span>
            </div>
            <p className="font-bold text-slate-800">{trackedResult.toilet_name}</p>
            <p className="text-slate-600">Category: {trackedResult.category.replace(/_/g, ' ')}</p>
            <p className="text-slate-600">Report: "{trackedResult.description}"</p>
            {trackedResult.resolution_notes && (
              <p className="text-emerald-800 font-medium mt-1">
                Municipal Action: {trackedResult.resolution_notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Report Issue Modal */}
      {reportingToilet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 space-y-4 card-shadow">
            
            {submittedComplaint ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Complaint Registered!</h3>
                  <p className="text-xs text-slate-600 mt-1">Your sanitation report has been submitted to municipal authorities.</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl font-mono text-sm font-bold text-slate-800 inline-block border border-slate-200">
                  Ref: {submittedComplaint.reference_number}
                </div>
                <p className="text-xs text-slate-500">Save this reference number to track your report's status.</p>
                <button
                  onClick={() => {
                    setReportingToilet(null);
                    setSubmittedComplaint(null);
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Report Cleanliness Problem</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{reportingToilet.name}</p>
                  </div>
                  <button onClick={() => setReportingToilet(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>

                <form onSubmit={handleReportSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category *</label>
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
                    <textarea
                      required
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      placeholder="Describe what you observed (e.g. water leaking on floor, garbage piled in corner)..."
                      rows={3}
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Email (Optional for updates)</label>
                    <input
                      type="email"
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      placeholder="e.g. citizen@gmail.com"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Attach Photo (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && setReportPhoto(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setReportingToilet(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReport}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                    >
                      {isSubmittingReport ? <Loader2 size={16} className="animate-spin" /> : 'Submit Civic Report'}
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
