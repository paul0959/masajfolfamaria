import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Appointment } from '../types';
import { X, LogOut, Users, Trash2, Save, Lock, User, AlertCircle } from 'lucide-react';

const getStatusDisplay = (app: Appointment, currentTime: Date, editedStatus?: string) => {
  const currentStatus = editedStatus || app.status || 'auto';
  
  if (currentStatus === 'cancelled') {
    return { label: 'Anulată', color: 'bg-red-100 text-red-800 border-red-200' };
  }

  if (!app.date || !app.time || !app.date.includes('-') || !app.time.includes(':')) {
    return { label: 'Nesetată', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  }

  try {
    const [year, month, day] = app.date.split('-').map(Number);
    const [hours, minutes] = app.time.split(':').map(Number);
    const appointmentTime = new Date(year, month - 1, day, hours, minutes);
    
    const diffMinutes = (currentTime.getTime() - appointmentTime.getTime()) / (1000 * 60);

    if (diffMinutes < 0) {
      return { label: 'Urmează', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    } else if (diffMinutes >= 0 && diffMinutes <= 90) {
      return { label: 'În desfășurare', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    } else {
      return { label: 'Terminată', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  } catch (e) {
    return { label: 'Necunoscut', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  }
};

export default function TherapistAdminModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editedStatuses, setEditedStatuses] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const qAppt = query(collection(db, 'programari'), orderBy('dataCreare', 'desc'));
    const unsubAppt = onSnapshot(qAppt, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(apps);
    });
    return () => unsubAppt();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'admin' && password === 'terapeut') {
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Nume de utilizator sau parolă incorectă!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setErrorMsg('');
  };

  const handleStatusChangeLocal = (id: string, newStatus: string) => {
    setEditedStatuses(prev => ({ ...prev, [id]: newStatus }));
  };

  const handleSaveStatus = async (id: string) => {
    const newStatus = editedStatuses[id];
    if (!newStatus) return;
    try {
      await updateDoc(doc(db, 'programari', id), { status: newStatus });
      setEditedStatuses(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      alert('Eroare la actualizarea statusului.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sigur dorești să ștergi definitiv această programare?')) {
      try {
        await deleteDoc(doc(db, 'programari', id));
      } catch (e) {}
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cream-50 w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-sage-200">
        
        {/* Header Fereastră */}
        <div className="bg-sage-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Users className="text-gold-400" size={20} />
            <h2 className="text-lg font-serif tracking-widest uppercase">
              {isAuthenticated ? 'Gestiune Programări' : 'Autentificare Admin'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs uppercase tracking-wider text-sage-300 hover:text-gold-400 mr-2 transition-colors"
              >
                <LogOut size={16} /> Deconectare
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1 text-sage-300 hover:text-white rounded-full transition-colors"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Conținut Fereastră */}
        <div className="p-6 overflow-y-auto flex-1">
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto py-10">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-sage-200">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-3 text-sage-800">
                    <Lock size={22} />
                  </div>
                  <h3 className="text-xl font-serif text-sage-900">Acces Programări</h3>
                  <p className="text-xs text-sage-500 mt-1">Introdu datele de conectare pentru a vizualiza lista.</p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-sage-700 mb-1">
                      Utilizator
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" />
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-cream-50 border border-sage-300 rounded-lg focus:outline-none focus:border-sage-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-sage-700 mb-1">
                      Parolă
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-cream-50 border border-sage-300 rounded-lg focus:outline-none focus:border-sage-700"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-2 py-3 bg-sage-900 text-white rounded-lg text-xs font-bold tracking-[0.2em] uppercase hover:bg-sage-800 transition-colors shadow-sm"
                  >
                    Conectare
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-xl font-serif text-sage-900">Listă Programări</h3>
                  <p className="text-xs text-sage-600">Actualizare automată a stării în timp real.</p>
                </div>
                <span className="text-xs font-semibold text-sage-500 bg-sage-100 px-3 py-1 rounded-full">
                  Total: {appointments.length}
                </span>
              </div>

              {/* Tabel cu scroll orizontal pentru mobil */}
              <div className="bg-white rounded-xl shadow-sm border border-sage-200 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="bg-sage-50 text-sage-900 text-xs uppercase tracking-wider border-b border-sage-200">
                      <th className="p-4 font-bold">Client & Contact</th>
                      <th className="p-4 font-bold">Serviciu & Dată</th>
                      <th className="p-4 font-bold">Stare Curentă</th>
                      <th className="p-4 font-bold">Control Manual</th>
                      <th className="p-4 font-bold text-right">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-100">
                    {appointments.map(app => {
                      const statusInfo = getStatusDisplay(app, currentTime, editedStatuses[app.id]);
                      const currentSelectValue = editedStatuses[app.id] || app.status || 'auto';
                      
                      return (
                        <tr key={app.id} className="hover:bg-cream-50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-sage-900">{app.name}</p>
                            <p className="text-xs text-sage-600 font-medium">{app.phone}</p>
                            <p className="text-xs text-sage-400">{app.email}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-bold text-sage-900">{app.serviceName}</p>
                            <p className="text-xs font-medium text-sage-600">{app.date} | Ora: {app.time}</p>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${statusInfo.color} shadow-sm`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-2">
                              <select
                                value={currentSelectValue === 'cancelled' ? 'cancelled' : 'auto'}
                                onChange={(e) => handleStatusChangeLocal(app.id, e.target.value)}
                                className="text-xs font-bold uppercase tracking-wider px-3 py-2 rounded border border-sage-300 bg-white outline-none cursor-pointer hover:border-sage-400 transition-colors"
                              >
                                <option value="auto">Timp Real (Automat)</option>
                                <option value="cancelled">Anulează Programarea</option>
                              </select>
                              {editedStatuses[app.id] && (
                                <button 
                                  onClick={() => handleSaveStatus(app.id)} 
                                  className="flex items-center justify-center gap-1 text-xs bg-green-600 text-white px-2 py-1.5 rounded font-bold uppercase tracking-wider hover:bg-green-500 transition-colors"
                                >
                                  <Save size={14} /> Salvează
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleDelete(app.id)} 
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" 
                              title="Șterge definitiv"
                            >
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {appointments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-sage-500">
                          Nu există programări momentan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}