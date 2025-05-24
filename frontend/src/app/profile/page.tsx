// frontend/src/app/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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

export default function Profile() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Partial<PasswordForm>>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [userStats, setUserStats] = useState({
    lastLogin: '2024-01-15 14:30:00',
    totalLogins: 127,
    accountCreated: '2023-06-15',
    lastPasswordChange: '2023-12-01'
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, loading, router]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleLogout = () => {
    addToast("Erfolgreich abgemeldet", "success");
    logout();
    // Kurze Verzögerung für die Toast-Nachricht, dann zur Login-Seite
    setTimeout(() => {
      router.push("/login");
    }, 1000);
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Partial<PasswordForm> = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Aktuelles Passwort ist erforderlich';
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'Neues Passwort ist erforderlich';
    } else if (passwordForm.newPassword.length < 4) {
      newErrors.newPassword = 'Neues Passwort muss mindestens 4 Zeichen lang sein';
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      newErrors.newPassword = 'Neues Passwort muss sich vom aktuellen unterscheiden';
    }

    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwort-Bestätigung ist erforderlich';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      addToast('Bitte korrigieren Sie die Eingabefehler', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8080/api/change_password.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        addToast('Passwort erfolgreich geändert', 'success');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setUserStats(prev => ({
          ...prev,
          lastPasswordChange: new Date().toISOString().split('T')[0]
        }));
      } else {
        addToast(data.message || 'Fehler beim Ändern des Passworts', 'error');
      }
    } catch (error) {
      addToast('Netzwerkfehler beim Ändern des Passworts', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin-user': return 'Administrator';
      case 'privileged-user': return 'Privilegierter Benutzer';
      case 'viewer-user': return 'Betrachter';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin-user': return 'bg-red-100 text-red-800';
      case 'privileged-user': return 'bg-blue-100 text-blue-800';
      case 'viewer-user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Profil...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Nicht angemeldet</h2>
          <p className="text-gray-600">Bitte melden Sie sich an, um Ihr Profil zu sehen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Benutzerprofil</h1>
              <p className="text-gray-600 mt-1">Verwalten Sie Ihre Kontoinformationen und Einstellungen</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/overview')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Zurück zur Übersicht
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Abmelden
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Benutzerdaten */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Kontoinformationen</h2>
            
            <div className="space-y-4">
              {/* Profilbild Placeholder */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{user.username}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
              </div>

              {/* Konto-Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Benutzer-ID:</span>
                  <span className="text-gray-900">#{user.id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Rolle:</span>
                  <span className="text-gray-900">{getRoleDisplayName(user.role)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Konto erstellt:</span>
                  <span className="text-gray-900">{userStats.accountCreated}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Letzter Login:</span>
                  <span className="text-gray-900">{new Date(userStats.lastLogin).toLocaleString('de-DE')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Anzahl Logins:</span>
                  <span className="text-gray-900">{userStats.totalLogins}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Passwort geändert:</span>
                  <span className="text-gray-900">{userStats.lastPasswordChange}</span>
                </div>
              </div>

              {/* Berechtigungen */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Berechtigungen:</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${user.role === 'viewer-user' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-600">Computer anzeigen</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${['privileged-user', 'admin-user'].includes(user.role) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-600">Status ändern</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${['privileged-user', 'admin-user'].includes(user.role) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-600">System-Operationen</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${user.role === 'admin-user' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-600">Benutzer verwalten</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${user.role === 'admin-user' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-600">Computer verwalten</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Passwort ändern */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Passwort ändern</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Aktuelles Passwort */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Aktuelles Passwort
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition duration-200 pr-10 ${
                      errors.currentPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                )}
              </div>

              {/* Neues Passwort */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Neues Passwort
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition duration-200 pr-10 ${
                      errors.newPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              {/* Passwort bestätigen */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Neues Passwort bestätigen
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition duration-200 pr-10 ${
                      errors.confirmPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 text-white font-semibold rounded-lg transition duration-200 ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Passwort wird geändert...
                  </div>
                ) : (
                  "Passwort ändern"
                )}
              </button>
            </form>

            {/* Passwort-Hinweise */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Passwort-Richtlinien:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Mindestens 4 Zeichen lang</li>
                <li>• Unterscheidet sich vom aktuellen Passwort</li>
                <li>• Wird sicher verschlüsselt gespeichert</li>
                <li>• Empfehlung: Verwenden Sie ein starkes, einzigartiges Passwort</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sicherheitshinweise */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Sicherheitshinweis</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Bitte beachten Sie: Ändern Sie Ihr Passwort regelmäßig und teilen Sie es niemals mit anderen Personen. 
                Bei Verdacht auf unbefugten Zugriff wenden Sie sich sofort an Ihren Administrator.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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