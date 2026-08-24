import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Appointment } from '../types';
import { LogOut, Download, Users, DollarSign, Activity, MessageSquare, Printer } from 'lucide-react';
import { services } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getStatusDisplay = (app: Appointment, editedStatus?: string) => {
  const statusToEvaluate = editedStatus || app.status;
  
  if (statusToEvaluate === 'pending') return { label: 'În așteptare', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  if (statusToEvaluate === 'cancelled') return { label: 'Anulată', color: 'bg-red-100 text-red-800 border-red-200' };
  
  // It's confirmed. Now calculate based on date/time
  if (!app.date || !app.time) return { label: 'Confirmată', color: 'bg-green-100 text-green-800 border-green-200' };

  try {
    const [year, month, day] = app.date.split('-').map(Number);
    const [hours, minutes] = app.time.split(':').map(Number);
    
    // Add 2 hours for duration just as a safe buffer for "În desfășurare"
    const appointmentTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    
    const diffMinutes = (now.getTime() - appointmentTime.getTime()) / (1000 * 60);
    
    if (diffMinutes < 0) {
      return { label: 'Urmează', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    } else if (diffMinutes >= 0 && diffMinutes <= 90) { // Assuming 90 mins max duration
      return { label: 'În desfășurare', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    } else {
      return { label: 'Terminat', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  } catch (e) {
    return { label: 'Confirmată', color: 'bg-green-100 text-green-800 border-green-200' };
  }
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'financial' | 'chats'>('appointments');
  const [editedStatuses, setEditedStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    // Listen to appointments
    const qAppt = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const unsubAppt = onSnapshot(qAppt, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(apps);
    });

    // Listen to chat logs
    const qChat = query(collection(db, 'chat_logs'), orderBy('timestamp', 'desc'));
    const unsubChat = onSnapshot(qChat, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatLogs(logs);
    });

    return () => {
      unsubAppt();
      unsubChat();
    };
  }, []);

  const handleStatusChangeLocal = (id: string, newStatus: string) => {
    setEditedStatuses(prev => ({ ...prev, [id]: newStatus }));
  };

  const handleSaveStatus = async (id: string) => {
    const newStatus = editedStatuses[id];
    if (!newStatus) return;

    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      
      setEditedStatuses(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      alert('Status actualizat cu succes!');
    } catch (e) {
      console.error(e);
      alert('Eroare la actualizarea statusului.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sigur dorești să ștergi această programare?')) {
      try {
        await deleteDoc(doc(db, 'appointments', id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Calculate totals
  const totalRevenue = appointments.reduce((acc, curr) => {
    const service = services.find(s => s.id === curr.serviceId);
    if (service && curr.status !== 'cancelled') {
      const price = parseInt(service.price.replace(/\D/g, '')) || 0;
      return acc + price;
    }
    return acc;
  }, 0);

  // Generare raport financiar pe servicii
  const financialStats = services.map(service => {
    const apps = appointments.filter(a => a.serviceId === service.id && a.status !== 'cancelled');
    const price = parseInt(service.price.replace(/\D/g, '')) || 0;
    return {
      name: service.name,
      count: apps.length,
      revenue: apps.length * price
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const generateFinancialPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Raport Financiar - Masaj & Terapie", 14, 22);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Data generării: ${new Date().toLocaleDateString('ro-RO')}`, 14, 32);
    doc.text(`Total programări onorate/în așteptare: ${appointments.filter(a => a.status !== 'cancelled').length}`, 14, 38);
    doc.text(`Total încasări estimate: ${totalRevenue} RON`, 14, 44);

    const tableData = financialStats.map(stat => [
      stat.name,
      stat.count.toString(),
      `${stat.revenue} RON`
    ]);

    autoTable(doc, {
      startY: 54,
      head: [['Serviciu', 'Număr Programări', 'Încasări Estimate']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [85, 107, 97] }, // sage-700
      styles: { font: 'helvetica' }
    });

    doc.save(`Raport_Financiar_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleSaveAllStatuses = async () => {
    const ids = Object.keys(editedStatuses);
    if (ids.length === 0) return;
    
    try {
      for (const id of ids) {
        const newStatus = editedStatuses[id];
        await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      }
      setEditedStatuses({});
      alert(`Salvat cu succes! Toate modificările au fost înregistrate.`);
    } catch (e) {
      console.error(e);
      alert('A apărut o eroare la salvarea modificărilor.');
    }
  };

  const downloadCSV = () => {
    if (appointments.length === 0) return;
    const headers = ['Data', 'Ora', 'Client', 'Telefon', 'Serviciu', 'Status', 'Observatii'];
    const rows = appointments.map(app => [
      app.date,
      app.time,
      app.name,
      app.phone,
      app.serviceName,
      app.status,
      app.notes || '-'
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `programari_masaj_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans">
      {/* Topbar */}
      <div className="bg-sage-900 text-white p-4 flex items-center justify-between shadow-lg">
        <h1 className="text-xl font-serif tracking-widest uppercase">Admin Panel</h1>
        <button onClick={onLogout} className="flex items-center gap-2 hover:text-gold-400 transition-colors text-sm uppercase tracking-widest">
          <LogOut size={18} /> Ieșire
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-60px)]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white border-r border-sage-200 p-4">
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('appointments')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-colors ${activeTab === 'appointments' ? 'bg-sage-100 text-sage-900 font-medium' : 'text-sage-600 hover:bg-cream-100'}`}
            >
              <Users size={18} /> Programări
            </button>
            <button 
              onClick={() => setActiveTab('financial')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-colors ${activeTab === 'financial' ? 'bg-sage-100 text-sage-900 font-medium' : 'text-sage-600 hover:bg-cream-100'}`}
            >
              <DollarSign size={18} /> Financiar
            </button>
            <button 
              onClick={() => setActiveTab('chats')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-colors ${activeTab === 'chats' ? 'bg-sage-100 text-sage-900 font-medium' : 'text-sage-600 hover:bg-cream-100'}`}
            >
              <MessageSquare size={18} /> Chat Logs
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-cream-50">
          
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif text-sage-900">Toate Programările</h2>
                <div className="flex items-center gap-3">
                  {Object.keys(editedStatuses).length > 0 && (
                    <button 
                      onClick={handleSaveAllStatuses}
                      className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 text-sm tracking-widest uppercase transition-colors shadow-md animate-pulse"
                    >
                      Salvează Toate Modificările
                    </button>
                  )}
                  <button 
                    onClick={downloadCSV}
                    className="flex items-center gap-2 bg-sage-700 hover:bg-sage-600 text-white px-4 py-2 text-sm tracking-widest uppercase transition-colors"
                  >
                    <Download size={16} /> Descarcă CSV
                  </button>
                </div>
              </div>

              <div className="bg-white border border-sage-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sage-100 text-sage-900 text-xs uppercase tracking-widest">
                        <th className="p-4 border-b border-sage-200">Client</th>
                        <th className="p-4 border-b border-sage-200">Contact</th>
                        <th className="p-4 border-b border-sage-200">Serviciu</th>
                        <th className="p-4 border-b border-sage-200">Data / Ora</th>
                        <th className="p-4 border-b border-sage-200">Status</th>
                        <th className="p-4 border-b border-sage-200 text-right">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-sage-500">Nu există programări momentan.</td>
                        </tr>
                      ) : (
                        appointments.map((app) => (
                          <tr key={app.id} className="border-b border-sage-100 hover:bg-sage-50 transition-colors">
                            <td className="p-4">
                              <div className="font-medium text-sage-900">{app.name}</div>
                            </td>
                            <td className="p-4 text-sm text-sage-600">
                              <div>{app.phone}</div>
                              <div className="text-xs">{app.email}</div>
                            </td>
                            <td className="p-4 text-sm text-sage-900">{app.serviceName}</td>
                            <td className="p-4 text-sm text-sage-900">
                              <div>{app.date}</div>
                              <div className="text-xs text-sage-500">{app.time}</div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <select 
                                  value={editedStatuses[app.id] || app.status}
                                  onChange={(e) => handleStatusChangeLocal(app.id, e.target.value)}
                                  className={`text-xs font-medium px-2 py-1 border rounded focus:outline-none ${getStatusDisplay(app, editedStatuses[app.id]).color}`}
                                >
                                  <option value="pending">În așteptare</option>
                                  <option value="confirmed">{getStatusDisplay(app, 'confirmed').label}</option>
                                  <option value="cancelled">Anulată</option>
                                </select>
                                {editedStatuses[app.id] && editedStatuses[app.id] !== app.status && (
                                  <button onClick={() => handleSaveStatus(app.id)} className="bg-sage-600 text-white px-3 py-1 rounded text-xs uppercase tracking-widest font-medium hover:bg-sage-700 transition-colors shadow-sm">
                                    Salvează
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <button onClick={() => handleDelete(app.id)} className="text-red-500 hover:text-red-700 text-xs uppercase tracking-widest transition-colors font-medium">
                                Șterge
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif text-sage-900">Situație Financiară Detaliată</h2>
                <button 
                  onClick={generateFinancialPDF}
                  className="flex items-center gap-2 bg-sage-700 hover:bg-sage-600 text-white px-4 py-2 text-sm tracking-widest uppercase transition-colors shadow-sm"
                >
                  <Printer size={16} /> Descarcă Raport PDF
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 border border-sage-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={64}/></div>
                  <div className="flex items-center gap-3 text-sage-600 mb-4 relative z-10">
                    <DollarSign size={20} />
                    <h3 className="text-sm font-medium uppercase tracking-widest">Total Încasări (Estimat)</h3>
                  </div>
                  <p className="text-4xl font-serif text-sage-900 relative z-10">{totalRevenue} <span className="text-xl text-sage-500">RON</span></p>
                </div>
                
                <div className="bg-white p-6 border border-sage-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={64}/></div>
                  <div className="flex items-center gap-3 text-sage-600 mb-4 relative z-10">
                    <Users size={20} />
                    <h3 className="text-sm font-medium uppercase tracking-widest">Programări Active</h3>
                  </div>
                  <p className="text-4xl font-serif text-sage-900 relative z-10">{appointments.filter(a => a.status !== 'cancelled').length}</p>
                </div>

                <div className="bg-white p-6 border border-sage-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={64}/></div>
                  <div className="flex items-center gap-3 text-sage-600 mb-4 relative z-10">
                    <Activity size={20} />
                    <h3 className="text-sm font-medium uppercase tracking-widest">Top Serviciu</h3>
                  </div>
                  <p className="text-xl font-serif text-sage-900 truncate relative z-10" title={financialStats[0]?.name || '-'}>
                    {financialStats[0]?.name || '-'}
                  </p>
                  <p className="text-xs text-sage-500 mt-2 relative z-10 uppercase tracking-wider">{financialStats[0]?.count || 0} rezervări</p>
                </div>
              </div>

              {/* Tabel Defalcat */}
              <div className="bg-white border border-sage-200 shadow-sm mt-8">
                <div className="p-5 border-b border-sage-200 bg-cream-50">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-sage-900">Analiză pe Servicii</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sage-50 text-sage-900 text-xs uppercase tracking-widest">
                        <th className="p-4 border-b border-sage-200 font-semibold">Serviciu</th>
                        <th className="p-4 border-b border-sage-200 font-semibold text-center">Programări</th>
                        <th className="p-4 border-b border-sage-200 font-semibold text-right">Încasări Generate</th>
                        <th className="p-4 border-b border-sage-200 font-semibold text-right">Procentaj</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialStats.map((stat, idx) => {
                        const percentage = totalRevenue > 0 ? ((stat.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={idx} className="border-b border-sage-100 hover:bg-cream-50 transition-colors">
                            <td className="p-4 font-medium text-sage-900">{stat.name}</td>
                            <td className="p-4 text-center text-sage-700">{stat.count}</td>
                            <td className="p-4 text-right font-serif text-sage-900">{stat.revenue} RON</td>
                            <td className="p-4 text-right">
                              <span className="inline-block bg-sage-100 text-sage-800 px-2 py-1 rounded text-xs font-medium">
                                {percentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {financialStats.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-sage-500">Nu există date financiare de afișat.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif text-sage-900 mb-6">Istoric Chatbot Gemini</h2>
              
              <div className="bg-white border border-sage-200 shadow-sm">
                <div className="max-h-[600px] overflow-y-auto p-4 space-y-4">
                  {chatLogs.length === 0 ? (
                    <p className="text-center text-sage-500 py-8">Nu există conversații înregistrate.</p>
                  ) : (
                    chatLogs.map((log) => (
                      <div key={log.id} className="p-4 border border-sage-100 rounded-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs font-bold uppercase tracking-widest ${log.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                            {log.role === 'user' ? 'Client' : 'Asistent AI'}
                          </span>
                          <span className="text-xs text-sage-400">ID: {log.sessionId}</span>
                        </div>
                        <p className="text-sm text-sage-800">{log.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
