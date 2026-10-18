import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  ExternalLink,
  LocateFixed,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  Navigation,
  FileText,
  SlidersHorizontal,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Toilet } from '../types';
import { LeafletMap } from '../components/LeafletMap';

export const FindToiletsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('search') || '';

  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'both' | 'list' | 'map'>('both');
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);

  // User GPS coordinates
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

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
        params.max_distance_km = 50;
      }
      const data = await api.getToilets(params);
      setToilets(data);
      if (data.length > 0 && !selectedToilet) {
        setSelectedToilet(data[0]);
      }
    } catch (err) {
      console.error('Failed to load toilets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
        setGeoLoading(false);
        setGeoMessage('GPS location activated.');
      },
      (err) => {
        setGeoLoading(false);
        setGeoMessage('Location access denied. Showing central city view.');
        setUserCoords({ lat: 28.6315, lon: 77.2167 });
      },
      { timeout: 8000 }
    );
  };

  const filteredToilets = toilets.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.locality.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' || t.verified_status === statusFilter;

    const matchesFacility =
      facilityFilter === 'all' || t.facilities.includes(facilityFilter);

    const matchesAccessible = !accessibleOnly || t.accessibility;

    return matchesSearch && matchesStatus && matchesFacility && matchesAccessible;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Clean':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={13} className="text-emerald-400" />
            Clean
          </span>
        );
      case 'Needs Cleaning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle size={13} className="text-amber-400" />
            Needs Cleaning
          </span>
        );
      case 'Under Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Wrench size={13} className="text-rose-400" />
            Under Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  const getDirectionsUrl = (lat: number, lon: number) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  };

  const formatInspectionDate = (dateStr?: string) => {
    if (!dateStr) return 'Pending scheduled inspection';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#F5F5F7]">
      
      {/* Header Banner */}
      <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161616] border border-[#333333] text-[#A1A1A6] text-xs font-medium">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Open Civic Network • No Citizen Login Required</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F7]">
            Find Public Toilets
          </h1>
          <p className="text-sm text-[#A1A1A6] max-w-2xl leading-relaxed">
            Browse verified public restrooms with official municipal cleanliness status, operating hours, available facilities, and turn-by-turn directions. Open freely to all citizens without any login credentials.
          </p>
        </div>

        {/* GPS Location Button */}
        <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
          <button
            onClick={handleRequestLocation}
            disabled={geoLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#262626] hover:bg-[#333333] text-[#F5F5F7] border border-[#3D3D3D] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {geoLoading ? (
              <Loader2 size={14} className="animate-spin text-[#2997FF]" />
            ) : (
              <LocateFixed size={14} className="text-[#2997FF]" />
            )}
            <span>{userCoords ? 'Update Location' : 'Use Current Location'}</span>
          </button>
          {geoMessage && (
            <span className="text-[11px] text-[#A1A1A6]">{geoMessage}</span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0D0D0D] border border-[#262626] p-4 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
            <input
              type="text"
              placeholder="Search by toilet name, locality, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#161616] border border-[#262626] rounded-xl text-sm text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#F5F5F7]/40 focus:outline-hidden transition-colors"
            />
          </div>

          {/* Cleanliness Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['all', 'Clean', 'Needs Cleaning', 'Under Maintenance'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-xs px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#F5F5F7] text-[#050505] font-semibold'
                    : 'bg-[#161616] text-[#A1A1A6] hover:text-[#F5F5F7] border border-[#262626]'
                }`}
              >
                {st === 'all' ? 'All Cleanliness' : st}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="hidden lg:flex items-center bg-[#161616] p-1 rounded-xl border border-[#262626] text-xs">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'both' ? 'bg-[#262626] text-[#F5F5F7]' : 'text-[#A1A1A6]'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-[#262626] text-[#F5F5F7]' : 'text-[#A1A1A6]'
              }`}
            >
              Cards Only
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'map' ? 'bg-[#262626] text-[#F5F5F7]' : 'text-[#A1A1A6]'
              }`}
            >
              Map Only
            </button>
          </div>

        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#1C1C1E] text-xs text-[#A1A1A6]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-[#6E6E73]" />
            <span>Facility:</span>
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="bg-[#161616] border border-[#262626] text-[#F5F5F7] text-xs rounded-lg px-2.5 py-1 focus:outline-hidden"
            >
              <option value="all">All Facilities</option>
              <option value="Running Water">Running Water</option>
              <option value="Western WC">Western WC</option>
              <option value="Washbasin">Washbasin</option>
              <option value="Soap Dispenser">Soap Dispenser</option>
              <option value="Hand Dryer">Hand Dryer</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer hover:text-[#F5F5F7] transition-colors">
            <input
              type="checkbox"
              checked={accessibleOnly}
              onChange={(e) => setAccessibleOnly(e.target.checked)}
              className="rounded-sm bg-[#161616] border-[#333333] text-emerald-500 focus:ring-0"
            />
            <span>Wheelchair Accessible Only</span>
          </label>

          <div className="ml-auto text-[#6E6E73]">
            Showing <span className="text-[#F5F5F7] font-semibold">{filteredToilets.length}</span> of {toilets.length} registered toilets
          </div>
        </div>
      </div>

      {/* Main Content Area: Split View or Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
          <Loader2 size={32} className="animate-spin text-[#F5F5F7]" />
          <p className="text-sm text-[#A1A1A6]">Retrieving verified toilet records from municipal database...</p>
        </div>
      ) : toilets.length === 0 ? (
        <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center mx-auto text-[#6E6E73]">
            <MapPin size={24} />
          </div>
          <h3 className="text-lg font-semibold text-[#F5F5F7]">No Public Toilets Registered Yet</h3>
          <p className="text-xs sm:text-sm text-[#A1A1A6] max-w-md mx-auto">
            The municipal registry is currently empty. Authorized municipal officers and registered facility owners can register verified public restrooms via the Authority Dashboard or Owner Portal.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/authority"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F5F5F7] text-[#050505] hover:bg-white transition-colors cursor-pointer"
            >
              Authority Dashboard
            </Link>
            <Link
              to="/owner"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#161616] text-[#F5F5F7] hover:bg-[#202020] border border-[#262626] transition-colors cursor-pointer"
            >
              Owner Portal
            </Link>
          </div>
        </div>
      ) : filteredToilets.length === 0 ? (
        <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center mx-auto text-[#6E6E73]">
            <MapPin size={24} />
          </div>
          <h3 className="text-lg font-semibold text-[#F5F5F7]">No Toilets Found</h3>
          <p className="text-xs sm:text-sm text-[#A1A1A6] max-w-md mx-auto">
            No public restrooms match your current search and filter criteria. Try adjusting your query or resetting filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setFacilityFilter('all');
              setAccessibleOnly(false);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#262626] text-[#F5F5F7] hover:bg-[#333333] transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className={`grid gap-6 ${viewMode === 'both' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
          
          {/* Left Column: Toilet Cards */}
          {(viewMode === 'both' || viewMode === 'list') && (
            <div className={`space-y-4 ${viewMode === 'both' ? 'lg:col-span-7 xl:col-span-6' : 'max-w-4xl mx-auto w-full'}`}>
              {filteredToilets.map((toilet) => {
                const isSelected = selectedToilet?.id === toilet.id;
                return (
                  <div
                    key={toilet.id}
                    onClick={() => setSelectedToilet(toilet)}
                    className={`bg-[#0D0D0D] rounded-2xl p-5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#F5F5F7]/60 bg-[#121212] shadow-xl ring-1 ring-[#F5F5F7]/20'
                        : 'border-[#262626] hover:border-[#3D3D3D] hover:bg-[#101010]'
                    }`}
                  >
                    {/* Top Row: Title & Verified Status Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-[#F5F5F7] leading-snug">
                          {toilet.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-[#A1A1A6] mt-1">
                          <MapPin size={13} className="text-[#6E6E73] shrink-0" />
                          <span>{toilet.locality}, {toilet.city}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(toilet.verified_status)}
                      </div>
                    </div>

                    {/* Address & Description */}
                    <p className="text-xs text-[#8E8E93] line-clamp-2 mb-3">
                      {toilet.address}
                    </p>

                    {/* Facilities Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {toilet.facilities.map((fac) => (
                        <span
                          key={fac}
                          className="px-2 py-0.5 rounded-md text-[11px] bg-[#161616] text-[#A1A1A6] border border-[#262626]"
                        >
                          {fac}
                        </span>
                      ))}
                      {toilet.accessibility && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] bg-[#161616] text-emerald-400 border border-emerald-500/20">
                          Accessible
                        </span>
                      )}
                    </div>

                    {/* Municipal Verification & Inspection Info */}
                    <div className="pt-3 border-t border-[#1F1F1F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-[#6E6E73]">
                        <Clock size={12} />
                        <span>Verified: <strong className="text-[#A1A1A6] font-medium">{formatInspectionDate(toilet.last_inspected_at)}</strong></span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/report?toiletId=${toilet.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] bg-[#161616] hover:bg-[#202020] border border-[#262626] transition-colors flex items-center gap-1"
                        >
                          <FileText size={12} />
                          <span>Report Issue</span>
                        </Link>

                        <a
                          href={getDirectionsUrl(toilet.latitude, toilet.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Navigation size={12} />
                          <span>Directions</span>
                          <ExternalLink size={11} className="opacity-70" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Right Column: Interactive Dark Map */}
          {(viewMode === 'both' || viewMode === 'map') && (
            <div className={`space-y-4 ${viewMode === 'both' ? 'lg:col-span-5 xl:col-span-6' : 'col-span-12'}`}>
              <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl overflow-hidden sticky top-24 shadow-2xl">
                
                {/* Map Header */}
                <div className="px-4 py-3 bg-[#121212] border-b border-[#262626] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F5F7]">
                    <Layers size={14} className="text-[#2997FF]" />
                    <span>Interactive Sanitation Map</span>
                  </div>
                  <span className="text-[11px] text-[#6E6E73]">
                    {filteredToilets.length} markers displayed
                  </span>
                </div>

                {/* Leaflet Map Frame */}
                <div className="h-[480px] lg:h-[580px] w-full">
                  <LeafletMap
                    toilets={filteredToilets}
                    selectedToilet={selectedToilet}
                    onSelectToilet={(t) => setSelectedToilet(t)}
                    userLocation={userCoords}
                  />
                </div>

                {/* Selected Toilet Quick Card at Bottom of Map */}
                {selectedToilet && (
                  <div className="p-4 bg-[#121212] border-t border-[#262626] flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-[#F5F5F7] truncate">
                          {selectedToilet.name}
                        </h4>
                        {getStatusBadge(selectedToilet.verified_status)}
                      </div>
                      <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">
                        {selectedToilet.address} • {selectedToilet.opening_hours || '24x7'}
                      </p>
                    </div>
                    <a
                      href={getDirectionsUrl(selectedToilet.latitude, selectedToilet.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#050505] bg-[#F5F5F7] hover:bg-white transition-colors flex items-center gap-1.5"
                    >
                      <Navigation size={12} />
                      <span>Navigate</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
