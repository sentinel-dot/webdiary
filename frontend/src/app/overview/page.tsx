"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface FE {
  id: number;
  name: string;
  ip_address: string;
  status: string;
  status_note: string;
  installed_version: string;
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

const Toast: React.FC<{ toast: Toast; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
  const bgColor = toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  return (
    <div className={`${bgColor} text-white px-4 py-2 rounded-lg shadow-lg mb-2 animate-slide-in`}>
      <div className="flex justify-between items-center">
        <span>{toast.message}</span>
        <button onClick={() => onRemove(toast.id)} className="ml-2 text-white hover:text-gray-200">×</button>
      </div>
    </div>
  );
};

export default function Overview() {
  const { user, hasRole, logout } = useAuth();
  const [computers, setComputers] = useState<FE[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [sortConfig, setSortConfig] = useState<{ key: keyof FE; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  });

  const statusOptions = ['Testbereit', 'Reserviert', 'Ausser Betrieb', 'Installation/Wartung', 'AIS'];

  useEffect(() => {
    fetchComputers();
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
      const response = await fetch("http://localhost:8080/api/get_FEs.php");
      if (!response.ok) throw new Error("Netzwerkantwort war nicht ok");
      const data = await response.json();
      setComputers(data);
    } catch (err: any) {
      setError(err.message);
      addToast("Fehler beim Laden der Daten", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedComputers(computers.map(computer => computer.id));
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

  const handleStatusChange = async () => {
    if (selectedComputers.length === 0) {
      addToast("Bitte mindestens 1 FE auswählen", "error");
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
      // API-Aufruf zum Status-Update
      const response = await fetch('http://localhost:8080/api/update_status.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      fetchComputers(); // Refresh data
    } catch (error) {
      addToast("Fehler beim Ändern des Status", "error");
    }
  };

  const handleVersionChange = async () => {
    if (selectedComputers.length === 0) {
      addToast("Bitte mindestens 1 FE auswählen", "error");
      return;
    }
    if (!versionModal.newVersion.trim()) {
      addToast("Bitte eine Version eingeben", "error");
      return;
    }

    try {
      // API-Aufruf zum Version-Update
      const response = await fetch('http://localhost:8080/api/update_version.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          computer_ids: selectedComputers,
          version: versionModal.newVersion
        })
      });

      if (!response.ok) throw new Error('Fehler beim Version-Update');
      
      addToast(`Version von ${selectedComputers.length} Computer(n) erfolgreich geändert`, "success");
      setVersionModal({ isOpen: false, newVersion: '' });
      setSelectedComputers([]);
      fetchComputers(); // Refresh data
    } catch (error) {
      addToast("Fehler beim Ändern der Version", "error");
    }
  };

  const handleSystemReboot = async () => {
    if (selectedComputers.length === 0) {
      addToast("Bitte mindestens 1 FE auswählen", "error");
      return;
    }

    if (confirm(`Möchten Sie wirklich ${selectedComputers.length} Computer(n) neu starten?`)) {
      try {
        // API-Aufruf zum Reboot
        const response = await fetch('http://localhost:8080/api/system_reboot.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            computer_ids: selectedComputers
          })
        });

        if (!response.ok) throw new Error('Fehler beim Neustart');
        
        addToast(`Neustart von ${selectedComputers.length} Computer(n) eingeleitet`, "success");
        setSelectedComputers([]);
      } catch (error) {
        addToast("Fehler beim Neustart", "error");
      }
    }
  };

  const sortData = (key: keyof FE) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });

    const sortedData = [...computers].sort((a, b) => {
      if (key === "ip_address") {
        const aValue = a[key].split(".").map(Number);
        const bValue = b[key].split(".").map(Number);
        return direction === "asc" ? compareIP(aValue, bValue) : compareIP(bValue, aValue);
      } else {
        const aValue = String(a[key]).toLowerCase();
        const bValue = String(b[key]).toLowerCase();
        return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
    });

    setComputers(sortedData);
  };

  const compareIP = (a: number[], b: number[]) => {
    for (let i = 0; i < 4; i++) {
      if (a[i] !== b[i]) {
        return a[i] - b[i];
      }
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Fehler</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchComputers} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="p-4 min-h-screen bg-gray-50">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Testrechner Übersicht</h1>
          <p className="text-gray-600">
            Angemeldet als: <span className="font-medium">{user?.username}</span> ({user?.role})
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {selectedComputers.length} von {computers.length} ausgewählt
          </span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Abmelden
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          {/* TEST Dropdown */}
          <div className="relative group">
            <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition">
              TEST
            </button>
            <div className="absolute left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
              <button
                onClick={() => setStatusModal({...statusModal, isOpen: true})}
                disabled={!hasRole('privileged-user')}
                className={`block w-full text-left px-4 py-2 transition ${
                  hasRole('privileged-user') 
                    ? 'text-gray-800 hover:bg-gray-100' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                Status ändern
              </button>
            </div>
          </div>

          {/* INFRA Dropdown */}
          <div className="relative group">
            <button className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition">
              INFRA
            </button>
            <div className="absolute left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
              <button
                onClick={() => setVersionModal({...versionModal, isOpen: true})}
                disabled={!hasRole('admin-user')}
                className={`block w-full text-left px-4 py-2 transition ${
                  hasRole('admin-user') 
                    ? 'text-gray-800 hover:bg-gray-100' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                Installierte Version ändern
              </button>
              <button
                disabled={!hasRole('admin-user')}
                className={`block w-full text-left px-4 py-2 transition ${
                  hasRole('admin-user') 
                    ? 'text-gray-800 hover:bg-gray-100' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                Rechnertab importieren
              </button>
            </div>
          </div>

          {/* SYSTEM Dropdown */}
          <div className="relative group">
            <button className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow hover:bg-orange-700 transition">
              SYSTEM
            </button>
            <div className="absolute left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
              <button
                onClick={handleSystemReboot}
                disabled={!hasRole('privileged-user')}
                className={`block w-full text-left px-4 py-2 transition ${
                  hasRole('privileged-user') 
                    ? 'text-gray-800 hover:bg-gray-100' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                Systemreboot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedComputers.length === computers.length && computers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => sortData("name")}
                >
                  Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => sortData("ip_address")}
                >
                  IP-Adresse {sortConfig.key === 'ip_address' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => sortData("status")}
                >
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Bemerkung</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {computers.map((computer) => (
                <tr 
                  key={computer.id} 
                  className={`hover:bg-gray-50 transition ${
                    selectedComputers.includes(computer.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedComputers.includes(computer.id)}
                      onChange={(e) => handleSelectComputer(computer.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{computer.name}</td>
                  <td className="px-4 py-3 text-gray-700">{computer.ip_address}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      computer.status === "Testbereit"
                        ? "bg-green-100 text-green-800"
                        : computer.status === "Reserviert"
                        ? "bg-red-100 text-red-800"
                        : computer.status === "Installation/Wartung"
                        ? "bg-blue-100 text-blue-800"
                        : computer.status === "AIS"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {computer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{computer.status_note}</td>
                  <td className="px-4 py-3 text-gray-700">{computer.installed_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Change Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-lg font-semibold mb-4">Status ändern</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neuer Status
                </label>
                <select
                  value={statusModal.newStatus}
                  onChange={(e) => setStatusModal({...statusModal, newStatus: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Status auswählen...</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bemerkung {statusModal.newStatus === 'Reserviert' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={statusModal.statusNote}
                  onChange={(e) => setStatusModal({...statusModal, statusNote: e.target.value})}
                  placeholder={statusModal.newStatus === 'Reserviert' ? 'Für wen reserviert?' : 'Optionale Bemerkung...'}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleStatusChange}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ändern
              </button>
              <button
                onClick={() => setStatusModal({isOpen: false, newStatus: '', statusNote: ''})}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Change Modal */}
      {versionModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-lg font-semibold mb-4">Version ändern</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neue Version
                </label>
                <input
                  type="text"
                  value={versionModal.newVersion}
                  onChange={(e) => setVersionModal({...versionModal, newVersion: e.target.value})}
                  placeholder="z.B. X979-1.0878910"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleVersionChange}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Ändern
              </button>
              <button
                onClick={() => setVersionModal({isOpen: false, newVersion: ''})}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
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
    </main>
  );
}