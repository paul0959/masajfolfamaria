import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Appointment, services } from '../types';
import { LogOut, Users, DollarSign, MessageSquare, Star, Trash2, Save } from 'lucide-react';

const getStatusDisplay = (app: Appointment, editedStatus?: string) => {
  const statusToEvaluate = editedStatus || app.status || 'pending';
  if (statusToEvaluate === 'pending') return { label: 'În așteptare', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  if (statusToEvaluate === 'cancelled') return { label: 'Anulată', color: 'bg-red-100 text-red-800 border-red-200' };
  if (!app.date || !app.time) return { label: 'Confirmată', color: 'bg-green-100 text-green-800 border-green-200' };
  try {
    const [year, month, day] = app.date.split('-').map(Number);
    const [hours, minutes] = app.time.split(':').map(Number);
    const appointmentTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    const diffMinutes = (now.getTime() - appointmentTime.getTime()) / (1000 * 60);
    if (diffMinutes < 0) return { label: 'Urmează', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    else if (diffMinutes >= 0 && diffMinutes <= 90) return { label: 'În desfășurare', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    else return { label: 'Terminat', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  } catch (e) {
    return { label: 'Confirmată', color: 'bg-green-100 text-green-800 border-green-200' };
  }
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'financial' | 'chats' | 'reviews'>('appointments');
  const [editedStatuses, setEditedStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    // 1. Ascultăm Programările
    const qAppt = query(collection(db, 'programari'), orderBy('dataCreare', 'desc'));
    const unsubAppt = onSnapshot(qAppt, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: doc.data().status || 'pending' } as Appointment));
      setAppointments(apps);
    });

    // 2. Ascultăm Chat-ul
    const qChat = query(collection(db, 'chat_logs'), orderBy('timestamp', 'desc'));
    const unsubChat = onSnapshot(qChat, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatLogs(logs);
    });

    // 3. Ascultăm Recenziile
    const qRev = query(collection(db, 'recenzii'), orderBy('dataCreare', 'desc'));
    const unsubRev = onSnapshot(qRev, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(revs);
    });

    return () => { unsubAppt(); unsubChat(); unsubRev(); };
  }, []);

  const handleStatusChangeLocal = (id: string, newStatus: string) => setEditedStatuses(prev => ({ ...prev, [id]: newStatus }));
  
  const handleSaveStatus = async (id: string) => {
    const newStatus = editedStatuses[id];
    if (!newStatus) return;
    try {
      await updateDoc(doc(db, 'programari', id), { status: newStatus });
      setEditedStatuses(prev => { const next = { ...prev }; delete next[id]; return next; });
      alert('Status actualizat cu succes!');
    } catch (e) { console.error(e); alert('Eroare la actualizarea statusului.'); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sigur dorești să ștergi această programare?')) {
      try { await deleteDoc(doc(db, 'programari', id)); } catch (e) { console.error(e); }
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (confirm('Sigur dorești să ștergi definitiv această recenzie de pe site?')) {
      try { await deleteDoc(doc(db, 'recenzii', id)); } catch (e) { console.error(e); }
    }
  };

  const totalRevenue = appointments.reduce((acc, curr) => {
    const service = services?.find(s => s.id === curr.serviceId || s.name === curr.serviceName);
    if (service && curr.status !== 'cancelled') { return acc + (parseInt(service.price.replace(/\D/g, '')) || 0); }
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-cream-50 font-sans">
      <div className="bg-sage-900 text-white p-4 flex items-center justify-between shadow-lg">
        <h1 className="text-xl font-serif tracking-widest uppercase">Admin Panel</h1>
        <button onClick={onLogout} className="flex items-center gap-2 hover:text-gold-400 transition-colors text-sm uppercase tracking-widest">
          <LogOut size={18} /> Ieșire
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-60px)]">
        <div className="w-full md:w-64 bg-white border-r border-sage-200 p-4">
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('appointments')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-colors ${activeTab === 'appointments' ? 'bg-sage-100 text-sage-900 font-medium' : 'text-sage-600 hover:bg-cream-100'}`}>
              <Users size={18} /> Programări
            </button>
            <button onClick={() => setActiveTab('financial')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-colors ${activeTab === 'financial' ? 'bg-sage-100 text-sage-900 font-medium' : 'text-sage-600 hover:bg-cream-100'}`}>
              <DollarSign size={18} /> Financiar
            </button>
            <button onClick={() => setActiveTab('chats')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-colors ${activeTab === 'chats' ? 'bg-sage-100 text-sage-900 font-medium' : 'text-sage-600 hover:bg-cream-100'}`}>
              <MessageSquare size={18} /> Chat Logs
            </button>
            <button onClick={() => setActiveTab('reviews')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-colors ${activeTab === 'reviews' ? 'bg-sage-100 text-sage-900 font-medium' : 'text-sage-600 hover:bg-cream-100'}`}>
              <Star size={18} /> Recenzii
            </button>
          </nav>
        </div>

        <div className="flex-1 p-8 overflow-y-auto bg-cream-50">
          
          {/* TAB PROGRAMĂRI */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif text-sage-900 mb-6">Programări Recente</h2>
              <div className="bg-white rounded-lg shadow-sm border border-sage-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-sage-50 text-sage-900 text-sm uppercase tracking-wider border-b border-sage-200">
                      <th className="p-4 font-medium">Client</th>
                      <th className="p-4 font-medium">Contact</th>
                      <th className="p-4 font-medium">Serviciu & Dată</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-100">
                    {appointments.map(app => {
                      const statusInfo = getStatusDisplay(app, editedStatuses[app.id]);
                      return (
                        <tr key={app.id} className="hover:bg-cream-50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-sage-900">{app.name}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-sage-700">{app.phone}</p>
                            <p className="text-sm text-sage-500">{app.email}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-medium text-sage-900">{app.serviceName}</p>
                            <p className="text-sm text-sage-600">{app.date} la {app.time}</p>
                          </td>
                          <td className="p-4">
                            <select
                              value={editedStatuses[app.id] || app.status || 'pending'}
                              onChange={(e) => handleStatusChangeLocal(app.id, e.target.value)}
                              className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${statusInfo.color} outline-none cursor-pointer`}
                            >
                              <option value="pending">În așteptare</option>
                              <option value="confirmed">Confirmată</option>
                              <option value="completed">Terminată</option>
                              <option value="cancelled">Anulată</option>
                            </select>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {editedStatuses[app.id] && (
                              <button onClick={() => handleSaveStatus(app.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                                <Save size={18} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(app.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {appointments.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-sage-500">Nu există programări momentan.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB FINANCIAR */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif text-sage-900 mb-6">Raport Financiar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-sage-200">
                  <h3 className="text-sage-500 text-sm uppercase tracking-wider mb-2">Venit Estimat (fără anulări)</h3>
                  <p className="text-3xl font-serif text-gold-600">{totalRevenue} RON</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-sage-200">
                  <h3 className="text-sage-500 text-sm uppercase tracking-wider mb-2">Programări Valide</h3>
                  <p className="text-3xl font-serif text-sage-900">{appointments.filter(a => a.status !== 'cancelled').length}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB CHAT */}
          {activeTab === 'chats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif text-sage-900 mb-6">Istoric Conversații Chatbot</h2>
              <div className="space-y-4">
                {chatLogs.map(log => (
                  <div key={log.id} className="bg-white p-4 rounded-lg shadow-sm border border-sage-200">
                    <p className="text-xs text-sage-400 mb-2">{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString('ro-RO') : 'Recent'}</p>
                    <div className="space-y-2">
                      {log.messages?.map((msg: any, i: number) => (
                        <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-sage-50 text-sage-900 ml-8' : 'bg-cream-100 text-sage-800 mr-8'}`}>
                          <strong>{msg.role === 'user' ? 'Client' : 'Mia'}:</strong> {msg.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {chatLogs.length === 0 && <p className="text-sage-500">Nu există conversații înregistrate.</p>}
              </div>
            </div>
          )}

          {/* TAB RECENZII */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif text-sage-900 mb-6">Gestionare Recenzii Publice</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.length === 0 ? (
                  <p className="text-sage-500 col-span-full text-center py-10">Nu există nicio recenzie momentan.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-white p-6 border border-sage-200 rounded-lg shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-sage-900">{review.author}</h4>
                            <span className="text-xs text-sage-400">
                              {review.dataCreare ? new Date(review.dataCreare.seconds * 1000).toLocaleDateString('ro-RO') : 'Recenzie nouă'}
                            </span>
                          </div>
                          <div className="flex text-gold-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < review.rating ? 'fill-current' : 'text-sage-200'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-sage-700 italic mb-6">"{review.text}"</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteReview(review.id)}
                        className="w-full text-center text-xs uppercase tracking-widest font-bold text-red-600 hover:bg-red-50 py-2 border border-red-100 rounded transition-colors"
                      >
                        Șterge Recenzia
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}