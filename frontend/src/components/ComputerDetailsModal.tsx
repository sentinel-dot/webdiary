// frontend/src/components/ComputerDetailsModal.tsx
"use client";

import { useEffect, useState } from 'react';

interface Computer {
  id: number;
  name: string;
  ip_address: string;
  status: string;
  status_note: string;
  installed_version: string;
  created_at?: string;
  updated_at?: string;
}

interface StatusChange {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  change_note: string;
  changed_at: string;
}

interface ComputerDetailsModalProps {
  computer: Computer;
  isOpen: boolean;
  onClose: () => void;
}

export const ComputerDetailsModal: React.FC<ComputerDetailsModalProps> = ({
  computer,
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([]);
  const [pingStatus, setPingStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [systemInfo, setSystemInfo] = useState({
    uptime: 'Unbekannt',
    lastSeen: 'Unbekannt',
    cpu: 'Intel Core i7-10700K',
    ram: '16 GB DDR4',
    storage: '512 GB SSD',
    os: 'Windows 10 Enterprise'
  });

  useEffect(() => {
    if (isOpen) {
      fetchComputerDetails();
      checkPingStatus();
    }
  }, [isOpen, computer.id]);

  const fetchComputerDetails = async () => {
    setLoading(true);
    try {
      // Hier würde normalerweise ein API-Call kommen
      // Für Demo-Zwecke verwenden wir Mock-Daten
      
      // Mock Status History
      const mockHistory: StatusChange[] = [
        {
          id: 1,
          old_status: 'Reserviert',
          new_status: 'Testbereit',
          changed_by: 'admin',
          change_note: 'Test abgeschlossen, wieder verfügbar',
          changed_at: '2024-01-15 14:30:00'
        },
        {
          id: 2,
          old_status: 'Testbereit',
          new_status: 'Reserviert',
          changed_by: 'testuser',
          change_note: 'Reserviert für Performance-Tests',
          changed_at: '2024-01-10 09:15:00'
        },
        {
          id: 3,
          old_status: 'Installation/Wartung',
          new_status: 'Testbereit',
          changed_by: 'admin',
          change_note: 'Updates installiert, System bereit',
          changed_at: '2024-01-05 16:45:00'
        }
      ];
      
      setStatusHistory(mockHistory);
    } catch (error) {
      console.error('Fehler beim Laden der Computer-Details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPingStatus = async () => {
    setPingStatus('checking');
    try {
      // Mock ping check - in der Realität würde dies über eine API laufen
      setTimeout(() => {
        const isOnline = Math.random() > 0.3; // 70% chance online
        setPingStatus(isOnline ? 'online' : 'offline');
      }, 1500);
    } catch (error) {
      setPingStatus('offline');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Testbereit': return 'bg-green-100 text-green-800';
      case 'Reserviert': return 'bg-red-100 text-red-800';
      case 'Installation/Wartung': return 'bg-blue-100 text-blue-800';
      case 'AIS': return 'bg-orange-100 text-orange-800';
      case 'Ausser Betrieb': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPingStatusDisplay = () => {
    switch (pingStatus) {
      case 'checking':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-1"></div>
            Prüfung...
          </span>
        );
      case 'online':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-1"></div>
            Online
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <div className="w-2 h-2 bg-red-600 rounded-full mr-1"></div>
            Offline
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{computer.name}</h2>
            <p className="text-gray-600">Computer Details</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Lade Details...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grundinformationen */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Grundinformationen</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="text-gray-900">{computer.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">IP-Adresse:</span>
                    <span className="text-gray-900 font-mono">{computer.ip_address}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(computer.status)}`}>
                      {computer.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Ping Status:</span>
                    {getPingStatusDisplay()}
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Version:</span>
                    <span className="text-gray-900 font-mono">{computer.installed_version}</span>
                  </div>
                  
                  {computer.created_at && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Erstellt:</span>
                      <span className="text-gray-900">{formatDate(computer.created_at)}</span>
                    </div>
                  )}
                </div>

                {/* Aktuelle Bemerkung */}
                {computer.status_note && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Aktuelle Bemerkung:</h4>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-gray-900 text-sm">{computer.status_note}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Systeminfo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Systemspezifikationen</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Betriebssystem:</span>
                    <span className="text-gray-900">{systemInfo.os}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">CPU:</span>
                    <span className="text-gray-900">{systemInfo.cpu}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">RAM:</span>
                    <span className="text-gray-900">{systemInfo.ram}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Speicher:</span>
                    <span className="text-gray-900">{systemInfo.storage}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Uptime:</span>
                    <span className="text-gray-900">{systemInfo.uptime}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Zuletzt gesehen:</span>
                    <span className="text-gray-900">{systemInfo.lastSeen}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Schnellaktionen:</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={checkPingStatus}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition"
                    >
                      Ping prüfen
                    </button>
                    <button className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition">
                      Remote Desktop
                    </button>
                    <button className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200 transition">
                      SSH Verbindung
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status-Historie */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status-Historie</h3>
            
            {statusHistory.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {statusHistory.map((change, index) => (
                    <div key={change.id} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(change.old_status)}`}>
                              {change.old_status}
                            </span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(change.new_status)}`}>
                              {change.new_status}
                            </span>
                          </div>
                          {change.change_note && (
                            <p className="text-sm text-gray-600 mt-1">{change.change_note}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500 ml-4">
                          <div>{formatDate(change.changed_at)}</div>
                          <div>von {change.changed_by}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">Keine Status-Historie verfügbar</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};