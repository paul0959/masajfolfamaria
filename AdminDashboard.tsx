import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Appointment, services } from '../types';
import { LogOut, Users, DollarSign, MessageSquare, Star, Trash2, Save, TrendingUp, Calendar as CalIcon, BarChart3, Activity } from 'lucide-react';
import { format, parseISO, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { ro } from 'date-fns/locale';

// Logica automată de stabilire a statusului bazată STRICT pe timp
const getStatusDisplay = (app: Appointment, currentTime: Date, editedStatus?: string) => {
  const currentStatus = editedStatus || app.status || 'auto';
  
  if (currentStatus === 'cancelled') {
    return { label: 'Anulată', color: 'bg-red-100 text-red-800 border-red-200' };
  }

  if (!app.date || !app.time) return { label: 'Dată invalidă', color: 'bg-gray-100 text-gray-800 border-gray-200' };

  try {
    const [year, month, day] = app.date.split('-').map(Number);
    const [hours, minutes] = app.time.split(':').map(Number);
    const appointmentTime = new Date(year, month - 1, day, hours, minutes);
    
    // Diferența în minute dintre acum și ora programării
    const diffMinutes = (currentTime.getTime() - appointmentTime.getTime()) / (1000 * 60);

    // Presupunem o durată medie de 90 de minute per sesiune
    if (diffMinutes < 0) {
      return { label: 'Urmează', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    } else if (diffMinutes >= 0 && diffMinutes <= 90) {
      return { label: 'În desfășurare', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    } else {
      return { label: 'Terminată', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  } catch (e) {
    return { label: 'Eroare calcul', color: 'bg-gray-100' };
  }
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'financial' | 'chats' | 'reviews'>('appointments');
  const [editedStatuses, setEditedStatuses] = useState<Record<string, string>>({});
  
  // Ceas intern pentru reactualizarea în timp real a statusurilor (la fiecare minut)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const qAppt = query(collection(db, 'programari'), orderBy('dataCreare', 'desc'));
    const unsubAppt = onSnapshot(qAppt, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(apps);
    });

    const qChat = query(collection(db, 'chat_logs'), orderBy('timestamp', 'desc'));
    const unsubChat = onSnapshot(qChat, (snapshot) => {
      setChatLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qRev = query(collection(db, 'recenzii'), orderBy('dataCreare', 'desc'));
    const unsubRev = onSnapshot(qRev, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
    } catch (e) { 
      console.error(e); 
      alert('Eroare la actualizarea statusului.'); 
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sigur dorești să ștergi definitiv această programare?')) {
      try { await deleteDoc(doc(db, 'programari', id)); } catch (e) { console.error(e); }
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (confirm('Sigur dorești să ștergi această recenzie?')) {
      try { await deleteDoc(doc(db, 'recenzii', id)); } catch (e) { console.error(e); }
    }
  };

  // =====================
  // CALCUL FINANCIAR AVANSAT
  // =====================
  const validAppointments = appointments.filter(a => a.status !== 'cancelled' && editedStatuses[a.id] !== 'cancelled');
  
  const getAppRevenue = (app: Appointment) => {
    const service = services?.find(s => s.id === app.serviceId || s.name === app.serviceName);
    return service ? parseInt(service.price.replace(/\D/g, '')) || 0 : 0;
  };

  // Statistici Rapide (Astăzi, Săptămână, Lună, Total)
  let revToday = 0, revWeek = 0, revMonth = 0, revTotal = 0;
  
  validAppointments.forEach(app => {
    const rev = getAppRevenue(app);
    revTotal += rev;
    if (!app.date) return;
    
    try {
      const appDate = new Date(app.date);
      if (isSameDay(appDate, currentTime)) revToday += rev;
      if (isSameWeek(appDate, currentTime, { weekStartsOn: 1 })) revWeek += rev;
      if (isSameMonth(appDate, currentTime)) revMonth += rev;
    } catch(e) {}
  });

  // Generare date pentru Graficul Ultimelor 7 Zile
  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date(currentTime);
    d.setDate(d.getDate() - i);
    return format(d, 'yyyy-MM-dd');
  }).reverse();

  const chartData = last7Days.map(dateStr => {
    const dailyApps = validAppointments.filter(a => a.date === dateStr);
    const revenue = dailyApps.reduce((sum, app) => sum + getAppRevenue(app), 0);
    return { date: dateStr, revenue };
  });

  const maxChartRev = Math.max(...chartData.map(d => d.revenue), 1); // Previne împărțirea la 0

  return (
    <div className="min-h-screen bg-cream-50 font-sans">
      <div className="bg-sage-900 text-white p-4 flex items-center justify-between shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <Activity className="text-gold-400" />
          <h1 className="text-xl font-serif tracking-widest uppercase">Panou Administrator</h1>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 hover:text-gold-400 transition-colors text-sm uppercase tracking-widest">
          <LogOut size={18} /> Ieșire
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-68px)]">
        {/* Sidebar Navigare */}
        <div className="w-full md:w-64 bg-white border-r border-sage-200 p-4 shadow-sm z-0">
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('appointments')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-colors rounded ${activeTab === 'appointments' ? 'bg-sage-100 text-sage-900 font-bold' : 'text-sage-600 hover:bg-cream-100'}`}>
              <Users size={18} /> Programări
            </button>
            <button onClick={() => setActiveTab('financial')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-colors rounded ${activeTab === 'financial' ? 'bg-sage-100 text-sage-900 font-bold' : 'text-sage-600 hover:bg-cream-100'}`}>
              <BarChart3 size={18} /> Statistici & Finanțe
            </button>
            <button onClick={() => setActiveTab('chats')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-colors rounded ${activeTab === 'chats' ? 'bg-sage-100 text-sage-900 font-bold' : 'text-sage-600 hover:bg-cream-100'}`}>
              <MessageSquare size={18} /> Chat Logs
            </button>
            <button onClick={() => setActiveTab('reviews')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-colors rounded ${activeTab === 'reviews' ? 'bg-sage-100 text-sage-900 font-bold' : 'text-sage-600 hover:bg-cream-100'}`}>
              <Star size={18} /> Recenzii
            </button>
          </nav>
        </div>

        {/* Conținut Principal */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-cream-50 custom-scrollbar">
          
          {/* TAB: PROGRAMĂRI */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-serif text-sage-900">Programări</h2>
                  <p className="text-sm text-sage-600 mt-1">Sistemul actualizează starea automat în funcție de oră.</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-sage-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
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
                                <button onClick={() => handleSaveStatus(app.id)} className="flex items-center justify-center gap-1 text-xs bg-green-600 text-white px-2 py-1.5 rounded font-bold uppercase tracking-wider hover:bg-green-500 transition-colors">
                                  <Save size={14} /> Salvează
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDelete(app.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Șterge definitiv">
                              <Trash2 size={20} />
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

          {/* TAB: FINANCIAR */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif text-sage-900 mb-6">Performanță Financiară</h2>
              
              {/* Carduri Statistici */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-sage-200 border-l-4 border-l-sage-400">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sage-500 text-xs font-bold uppercase tracking-wider">Astăzi</h3>
                    <CalIcon size={16} className="text-sage-400"/>
                  </div>
                  <p className="text-2xl font-serif text-sage-900">{revToday} <span className="text-sm font-sans text-sage-500">RON</span></p>
                </div>
                
                <div className="bg-white p-5 rounded-xl shadow-sm border border-sage-200 border-l-4 border-l-gold-400">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sage-500 text-xs font-bold uppercase tracking-wider">Săptămâna Aceasta</h3>
                    <TrendingUp size={16} className="text-gold-400"/>
                  </div>
                  <p className="text-2xl font-serif text-gold-600">{revWeek} <span className="text-sm font-sans text-sage-500">RON</span></p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-sage-200 border-l-4 border-l-sage-700">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sage-500 text-xs font-bold uppercase tracking-wider">Luna Curentă</h3>
                    <CalendarIcon size={16} className="text-sage-700"/>
                  </div>
                  <p className="text-2xl font-serif text-sage-900">{revMonth} <span className="text-sm font-sans text-sage-500">RON</span></p>
                </div>

                <div className="bg-sage-900 p-5 rounded-xl shadow-sm border border-sage-800">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sage-300 text-xs font-bold uppercase tracking-wider">Total Istoric</h3>
                    <DollarSign size={16} className="text-gold-400"/>
                  </div>
                  <p className="text-2xl font-serif text-white">{revTotal} <span className="text-sm font-sans text-sage-400">RON</span></p>
                </div>
              </div>

              {/* Grafic Evoluție Ultimele 7 Zile */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200 mt-8">
                <h3 className="text-lg font-serif text-sage-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="text-gold-500" />
                  Evoluție Venituri (Ultimele 7 zile)
                </h3>
                <div className="h-64 flex items-end gap-2 sm:gap-6 pt-10 border-b border-sage-200 pb-2">
                  {chartData.map((d, i) => {
                    const heightPercent = Math.max((d.revenue / maxChartRev) * 100, 2); // minim 2% pt a se vedea bara
                    const isToday = i === 6;
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        {/* Tooltip pe hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-sage-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10">
                          {d.revenue} RON
                        </div>
                        {/* Bara grafic */}
                        <div className="w-full max-w-[40px] bg-sage-100 rounded-t-md relative flex items-end justify-center h-full">
                          <div 
                            className={`w-full rounded-t-md transition-all duration-1000 ease-out ${isToday ? 'bg-gold-400' : 'bg-sage-400 group-hover:bg-sage-500'}`} 
                            style={{ height: `${heightPercent}%` }}
                          ></div>
                        </div>
                        {/* Data sub bară */}
                        <span className={`text-[10px] sm:text-xs font-medium mt-3 whitespace-nowrap ${isToday ? 'text-gold-600 font-bold' : 'text-sage-500'}`}>
                          {format(new Date(d.date), 'dd MMM', { locale: ro })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB: CHAT LOGS */}
          {activeTab === 'chats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif text-sage-900 mb-6">Istoric Conversații Asistent AI (Mia)</h2>
              <div className="space-y-4">
                {chatLogs.map(log => (
                  <div key={log.id} className="bg-white p-5 rounded-xl shadow-sm border border-sage-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-sage-400 mb-4 border-b pb-2">
                      {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString('ro-RO') : 'Recent'}
                    </p>
                    <div className="space-y-3">
                      {log.messages?.map((msg: any, i: number) => (
                        <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-sage-50 text-sage-900 ml-8 border border-sage-100' : 'bg-cream-100 text-sage-800 mr-8'}`}>
                          <strong className="block text-xs uppercase mb-1 opacity-60">{msg.role === 'user' ? 'Client' : 'Mia'}</strong> 
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {chatLogs.length === 0 && <p className="text-sage-500">Nu există conversații înregistrate.</p>}
              </div>
            </div>
          )}

          {/* TAB: RECENZII */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif text-sage-900 mb-6">Recenzii Site</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.length === 0 ? (
                  <p className="text-sage-500 col-span-full">Nu există nicio recenzie momentan.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-white p-6 border border-sage-200 rounded-xl shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-sage-900">{review.author}</h4>
                            <span className="text-xs font-medium text-sage-400">
                              {review.dataCreare ? new Date(review.dataCreare.seconds * 1000).toLocaleDateString('ro-RO') : 'Nouă'}
                            </span>
                          </div>
                          <div className="flex text-gold-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < review.rating ? 'fill-current' : 'text-sage-200'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-sage-700 italic mb-6 leading-relaxed">"{review.text}"</p>
                      </div>
                      <button onClick={() => handleDeleteReview(review.id)} className="w-full text-center text-xs uppercase tracking-widest font-bold text-red-500 hover:bg-red-50 py-2.5 border border-red-100 rounded-lg transition-colors">
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