// frontend/src/app/overview/page.tsx - Modern Desktop Version - Complete
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { ComputerDetailsModal } from "../../components/ComputerDetailsModal";

interface FE {
  id: number;
  name: string;
  ip_address: string;
  status: string;
  status_note: string;
  Status_Datum?: string;
  installed_version: string;
  Inst_Zielversion?: string;
  OZ?: string;
  Monitor_LoggedOn_User?: string;
  Monitor_Datum?: string;
  Monitor_ZORA_Checkpoint?: string;
  Build_Key?: string;
  ZORA_Version?: string;
  FE_ZORA_Version?: string;
  Z_Umgebung_Soll?: string;
  Z_Umgebung_Inventar?: string;
  Chipkarten_Nr?: string;
  Chipkarten_PIN?: string;
  PLZ_Ort?: string;
  Raum_Cube?: string;
  Bemerkung_FE?: string;
  Filialschluessel?: string;
  Kassenschluessel?: string;
  Masterkasse?: string;
  FE_Kennung?: string;
  Riposte_GroupID?: string;
  Riposte_NodeID?: string;
  Aussenstellennummer?: string;
  Weitere_Chipkarten?: string;
  MGS_Paket_ZORA_R?: string;
  FE_LoggedOn_User?: string;
  Cryptostore_Status?: string;
  Hardwareausstattung?: string;
  DBEPOS_Version?: string;
}



interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StatusChangeModal {
  isOpen: boolean;
  newStatus: string;
  statusNote: string;
}

interface VersionChangeModal {
  isOpen: boolean;
  newVersion: string;
}

interface FilterState {
  search: string;
  status: string;
  version: string;
}

const Toast: React.FC<{ toast: Toast; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
  const bgColor = toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  return (
    <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-lg mb-3 animate-slide-in backdrop-blur-sm`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {toast.type === 'success' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === 'error' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function Overview() {
  const { user, hasRole, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [computers, setComputers] = useState<FE[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComputers, setSelectedComputers] = useState<number[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [statusModal, setStatusModal] = useState<StatusChangeModal>({
    isOpen: false,
    newStatus: '',
    statusNote: ''
  });
  const [versionModal, setVersionModal] = useState<VersionChangeModal>({
    isOpen: false,
    newVersion: ''
  });
  const [selectedComputerForDetails, setSelectedComputerForDetails] = useState<FE | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof FE; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  });
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    version: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const statusOptions = ['Testbereit', 'Reserviert', 'Ausser Betrieb', 'Installation/Wartung', 'AIS'];

  const [showFunctionsDropdown, setShowFunctionsDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, loading, router]);

  // Fetch computers only when authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchComputers();
    }
  }, [isAuthenticated, loading]);

  // Click-outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setShowFunctionsDropdown(false);
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchComputers = async () => {
    try {
      setDataLoading(true);
      const response = await fetch("http://localhost:8080/api/get_FEs.php");
      if (!response.ok) throw new Error("Netzwerkantwort war nicht ok");
      const data = await response.json();
      setComputers(data);
    } catch (err: any) {
      setError(err.message);
      addToast("Fehler beim Laden der Daten", "error");
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    addToast("Erfolgreich abgemeldet", "success");
    logout();
    setTimeout(() => {
      router.push("/login");
    }, 1000);
  };

  // Filtered and sorted data
  const filteredAndSortedComputers = useMemo(() => {
    let filtered = computers.filter(computer => {
      const matchesSearch = !filters.search || 
        computer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        computer.ip_address.includes(filters.search) ||
        computer.installed_version.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || computer.status === filters.status;
      const matchesVersion = !filters.version || computer.installed_version.includes(filters.version);
      
      return matchesSearch && matchesStatus && matchesVersion;
    });

    // Sort data
    filtered.sort((a, b) => {
      if (sortConfig.key === "ip_address") {
        const aValue = a[sortConfig.key].split(".").map(Number);
        const bValue = b[sortConfig.key].split(".").map(Number);
        const result = compareIP(aValue, bValue);
        return sortConfig.direction === "asc" ? result : -result;
      } else {
        const aValue = String(a[sortConfig.key]).toLowerCase();
        const bValue = String(b[sortConfig.key]).toLowerCase();
        const result = aValue.localeCompare(bValue);
        return sortConfig.direction === "asc" ? result : -result;
      }
    });

    return filtered;
  }, [computers, filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedComputers.length / itemsPerPage);
  const paginatedComputers = filteredAndSortedComputers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const compareIP = (a: number[], b: number[]) => {
    for (let i = 0; i < 4; i++) {
      if (a[i] !== b[i]) {
        return a[i] - b[i];
      }
    }
    return 0;
  };

  const sortData = (key: keyof FE) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Testbereit':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '✓' };
      case 'Reserviert':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔒' };
      case 'Installation/Wartung':
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '🔧' };
      case 'AIS':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '⚡' };
      case 'Ausser Betrieb':
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '⏸️' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '?' };
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedComputers(paginatedComputers.map(computer => computer.id));
    } else {
      setSelectedComputers([]);
    }
  };

  const handleSelectComputer = (computerId: number, checked: boolean) => {
    if (checked) {
      setSelectedComputers(prev => [...prev, computerId]);
    } else {
      setSelectedComputers(prev => prev.filter(id => id !== computerId));
    }
  };

  // Action handlers
  const handleStatusChange = async () => {
    if (selectedComputers.length === 0) {
      addToast("Bitte mindestens 1 Computer auswählen", "error");
      return;
    }
    if (!statusModal.newStatus) {
      addToast("Bitte einen Status auswählen", "error");
      return;
    }
    if (statusModal.newStatus === 'Reserviert' && !statusModal.statusNote.trim()) {
      addToast("Bei 'Reserviert' ist eine Bemerkung erforderlich", "error");
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/update_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          computer_ids: selectedComputers,
          status: statusModal.newStatus,
          status_note: statusModal.statusNote
        })
      });

      if (!response.ok) throw new Error('Fehler beim Status-Update');
      
      addToast(`Status von ${selectedComputers.length} Computer(n) erfolgreich geändert`, "success");
      setStatusModal({ isOpen: false, newStatus: '', statusNote: '' });
      setSelectedComputers([]);
      fetchComputers();
    } catch (error) {
      addToast("Fehler beim Ändern des Status", "error");
    }
  };

  const handleVersionChange = async () => {
    if (selectedComputers.length === 0) {
      addToast("Bitte mindestens 1 Computer auswählen", "error");
      return;
    }
    if (!versionModal.newVersion.trim()) {
      addToast("Bitte eine Version eingeben", "error");
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/update_version.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          computer_ids: selectedComputers,
          version: versionModal.newVersion
        })
      });

      if (!response.ok) throw new Error('Fehler beim Version-Update');
      
      addToast(`Version von ${selectedComputers.length} Computer(n) erfolgreich geändert`, "success");
      setVersionModal({ isOpen: false, newVersion: '' });
      setSelectedComputers([]);
      fetchComputers();
    } catch (error) {
      addToast("Fehler beim Ändern der Version", "error");
    }
  };

  const handleSystemReboot = async () => {
    if (selectedComputers.length === 0) {
      addToast("Bitte mindestens 1 Computer auswählen", "error");
      return;
    }

    if (confirm(`Möchten Sie wirklich ${selectedComputers.length} Computer(n) neu starten?`)) {
      try {
        const response = await fetch('http://localhost:8080/api/system_reboot.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ computer_ids: selectedComputers })
        });

        if (!response.ok) throw new Error('Fehler beim Neustart');
        
        addToast(`Neustart von ${selectedComputers.length} Computer(n) eingeleitet`, "success");
        setSelectedComputers([]);
      } catch (error) {
        addToast("Fehler beim Neustart", "error");
      }
    }
  };

  // Loading states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Authentifizierung wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Weiterleitung zur Anmeldung...</p>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Testrechner werden geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-red-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Fehler beim Laden</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={fetchComputers} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-50 max-w-md">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Testrechner Übersicht</h1>
              <div className="flex items-center gap-4 text-slate-600">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Angemeldet als: <span className="font-semibold text-slate-900">{user?.username}</span>
                </span>
                <span className="text-slate-400">•</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {user?.role}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{filteredAndSortedComputers.length}</div>
                <div className="text-sm text-slate-500">Computer gefunden</div>
              </div>
              
              <div className="h-10 w-px bg-slate-200"></div>
              
              <button
                onClick={() => router.push('/profile')}
                className="px-4 py-2 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profil
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Abmelden
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          {/* Search and Quick Filters */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Suche</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name, IP-Adresse oder Version suchen..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="col-span-2 flex items-end gap-3">
              {/* Filter Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 border border-slate-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  Filter
                  {(filters.status || filters.version) && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {(filters.status ? 1 : 0) + (filters.version ? 1 : 0)}
                    </span>
                  )}
                </button>
                
                {/* Filter Dropdown Menu */}
                {showFilterDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Status Filter</label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Alle Status</option>
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Version Filter</label>
                        <input
                          type="text"
                          placeholder="Version eingeben..."
                          value={filters.version}
                          onChange={(e) => setFilters(prev => ({ ...prev, version: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setFilters({ search: filters.search, status: '', version: '' });
                            setShowFilterDropdown(false);
                          }}
                          className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm"
                        >
                          Filter zurücksetzen
                        </button>
                        <button
                          onClick={() => setShowFilterDropdown(false)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Anwenden
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Clear Filters Button */}
              {(filters.status || filters.version) && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, status: '', version: '' }))}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Filter löschen
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {/* Funktionen Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFunctionsDropdown(!showFunctionsDropdown)}
                  className="px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  Funktionen
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Functions Dropdown Menu */}
                {showFunctionsDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
                    <div className="py-2">
                      {/* Status ändern */}
                      {hasRole('privileged-user') && (
                        <button
                          onClick={() => {
                            if (selectedComputers.length > 0) {
                              setStatusModal({...statusModal, isOpen: true});
                              setShowFunctionsDropdown(false);
                            } else {
                              addToast("Bitte mindestens 1 Computer auswählen", "error");
                            }
                            }}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3`}
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">Status ändern</div>
                            <div className="text-sm text-slate-500">Computer-Status aktualisieren</div>
                          </div>
                        </button>
                      )}

                      {/* Version ändern */}
                      {hasRole('admin-user') && (
                        <button
                          onClick={() => {
                            if (selectedComputers.length > 0) {
                              setVersionModal({...versionModal, isOpen: true});
                              setShowFunctionsDropdown(false);
                            } else {
                              addToast("Bitte mindestens 1 Computer auswählen", "error");
                            }
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3`}
                        >
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">Version ändern</div>
                            <div className="text-sm text-slate-500">Software-Version aktualisieren</div>
                          </div>
                        </button>
                      )}

                      {/* System Reboot */}
                      {hasRole('privileged-user') && (
                        <button
                          onClick={() => {
                            setShowFunctionsDropdown(false);
                            if (selectedComputers.length > 0) {
                              handleSystemReboot();
                            } else {
                              addToast("Bitte mindestens 1 Computer auswählen", "error");
                            }
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3`}
                        >
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">System Reboot</div>
                            <div className="text-sm text-slate-500">Computer neu starten</div>
                          </div>
                        </button>
                      )}

                      {/* Keine Berechtigung Hinweis */}
                      {!hasRole('privileged-user') && (
                        <div className="px-4 py-3 text-sm text-slate-500 italic">
                          Keine Funktionen verfügbar für Ihre Rolle
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchComputers}
                className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Aktualisieren
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                {selectedComputers.length} von {paginatedComputers.length} ausgewählt
              </span>
            </div>
          </div>
        </div>

        {/* Computer Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedComputers.length === paginatedComputers.length && paginatedComputers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th 
                    className="px-6 py-4 text-left font-semibold text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => sortData("name")}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      {sortConfig.key === 'name' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left font-semibold text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => sortData("ip_address")}
                  >
                    <div className="flex items-center gap-2">
                      IP-Adresse
                      {sortConfig.key === 'ip_address' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left font-semibold text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => sortData("status")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortConfig.key === 'status' && (
                        <span className="text-blue-600">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900">Bemerkung</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900">Version</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900">OZ</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900">Raum</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900">PLZ/Ort</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900">ZORA Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedComputers.map((computer) => {
                  const statusConfig = getStatusConfig(computer.status);
                  return (
                    <tr 
                      key={computer.id} 
                      className={`hover:bg-slate-50 transition-all duration-200 ${
                        selectedComputers.includes(computer.id) ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedComputers.includes(computer.id)}
                          onChange={(e) => handleSelectComputer(computer.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedComputerForDetails(computer)}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {computer.name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-sm">
                          {computer.ip_address}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                          <span className="text-sm">{statusConfig.icon}</span>
                          <span className="font-medium text-sm">{computer.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          {computer.status_note ? (
                            <p className="text-slate-700 text-sm truncate" title={computer.status_note}>
                              {computer.status_note}
                            </p>
                          ) : (
                            <span className="text-slate-400 text-sm italic">Keine Bemerkung</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-sm">
                          {computer.installed_version}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 text-sm">
                          {computer.OZ || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 text-sm">
                          {computer.Raum_Cube || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 text-sm">
                          {computer.PLZ_Ort || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 text-sm">
                          {computer.ZORA_Version || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Zeige {((currentPage - 1) * itemsPerPage) + 1} bis {Math.min(currentPage * itemsPerPage, filteredAndSortedComputers.length)} von {filteredAndSortedComputers.length} Einträgen
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                    }`}
                  >
                    Vorherige
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                    }`}
                  >
                    Nächste
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          {statusOptions.map(status => {
            const count = computers.filter(c => c.status === status).length;
            const config = getStatusConfig(status);
            return (
              <div 
                key={status}
                className={`${config.bg} ${config.border} border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all`}
                onClick={() => setFilters(prev => ({ ...prev, status: prev.status === status ? '' : status }))}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${config.text}`}>{count}</div>
                    <div className={`text-sm ${config.text} opacity-80`}>{status}</div>
                  </div>
                  <div className="text-2xl">{config.icon}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Computer Details Modal */}
      {selectedComputerForDetails && (
        <ComputerDetailsModal
          computer={selectedComputerForDetails}
          isOpen={!!selectedComputerForDetails}
          onClose={() => setSelectedComputerForDetails(null)}
        />
      )}

      {/* Status Change Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 max-w-90vw shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Status ändern</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Neuer Status
                </label>
                <select
                  value={statusModal.newStatus}
                  onChange={(e) => setStatusModal({...statusModal, newStatus: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Status auswählen...</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Bemerkung {statusModal.newStatus === 'Reserviert' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={statusModal.statusNote}
                  onChange={(e) => setStatusModal({...statusModal, statusNote: e.target.value})}
                  placeholder={statusModal.newStatus === 'Reserviert' ? 'Für wen reserviert?' : 'Optionale Bemerkung...'}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleStatusChange}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
              >
                Status ändern
              </button>
              <button
                onClick={() => setStatusModal({isOpen: false, newStatus: '', statusNote: ''})}
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 font-semibold transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Change Modal */}
      {versionModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 max-w-90vw shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Version ändern</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Neue Version
                </label>
                <input
                  type="text"
                  value={versionModal.newVersion}
                  onChange={(e) => setVersionModal({...versionModal, newVersion: e.target.value})}
                  placeholder="z.B. X979-1.0878910"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleVersionChange}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold transition-colors"
              >
                Version ändern
              </button>
              <button
                onClick={() => setVersionModal({isOpen: false, newVersion: ''})}
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 font-semibold transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}