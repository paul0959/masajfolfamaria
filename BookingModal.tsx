import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar as CalendarIcon, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import { services } from '../types';
import { checkAvailability, TimeSlot } from '../lib/calendar';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceId?: string | null;
}

export default function BookingModal({ isOpen, onClose, preselectedServiceId }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string>(preselectedServiceId || '');
  
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gdpr: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedService(preselectedServiceId);
      setStep(2);
    } else {
      setStep(1);
    }
  }, [isOpen, preselectedServiceId]);

  useEffect(() => {
    if (step === 2) {
      loadAvailability(selectedDate);
    }
  }, [step, selectedDate]);

  useEffect(() => {
    if (step !== 2) return;
    
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const q = query(collection(db, 'programari'), where('date', '==', formattedDate));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookedTimes: string[] = [];
      snapshot.forEach(doc => {
        if (doc.data().status !== 'cancelled') {
          bookedTimes.push(doc.data().time);
        }
      });
      
      setAvailableSlots(prevSlots => {
        if (prevSlots.length === 0) return prevSlots; 
        return prevSlots.map(slot => ({
          ...slot,
          available: bookedTimes.includes(slot.time) ? false : slot.available
        }));
      });
      
      if (selectedTime && bookedTimes.includes(selectedTime)) {
        setSelectedTime('');
        alert("Ne pare rău, ora selectată tocmai a fost rezervată. Te rugăm să alegi o altă oră.");
      }
    });
    
    return () => unsubscribe();
  }, [step, selectedDate, selectedTime]);

  const loadAvailability = async (date: Date) => {
    setIsLoadingSlots(true);
    setSelectedTime('');
    try {
      const slots = await checkAvailability(date);
      setAvailableSlots(slots);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gdpr) return;
    
    setIsSubmitting(true);
    
    try {
      const service = services.find(s => s.id === selectedService);
      const serviceNameStr = service?.name || selectedService;
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // 1. Salvare în Firebase via Server
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          serviceName: serviceNameStr,
          date: dateStr,
          time: selectedTime
        })
      });

      if (response.ok) {
         // 2. REDIRECȚIONARE WHATSAPP CU TEXT OFICIAL
         const adminPhone = "40750294688"; 
         const mesaj = `Bună ziua! Vă contactez pentru a solicita o programare prin intermediul site-ului. Detaliile sunt următoarele:%0A%0A👤 *Nume:* ${formData.name}%0A📞 *Telefon:* ${formData.phone}%0A💆‍♀️ *Serviciu:* ${serviceNameStr}%0A📅 *Data:* ${dateStr}%0A⏰ *Ora:* ${selectedTime}%0A%0AVă rog să îmi confirmați disponibilitatea. Vă mulțumesc!`;
         const whatsappUrl = `https://wa.me/${adminPhone}?text=${mesaj}`;
         
         // Deschide WhatsApp
         window.open(whatsappUrl, '_blank');
         
         // Mergem la pasul final
         setStep(4);
      } else {
         alert("Eroare la salvare. Te rugăm să încerci din nou.");
      }
    } catch (error) {
      alert("Eroare de conexiune. Verifică internetul.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-sage-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white shadow-2xl flex flex-col md:flex-row h-[600px] max-h-[85vh] overflow-hidden rounded-xl"
      >
        {/* Panou Stânga */}
        <div className="hidden md:flex w-2/5 bg-sage-900 text-white flex-col relative">
          <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800" alt="Spa" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" />
          <div className="relative z-10 p-8 flex flex-col h-full">
            <h3 className="text-3xl font-serif mb-8 text-cream-50">Programare<br/>Online</h3>
            <div className="space-y-6 flex-1 mt-4">
              <div className={`flex items-center gap-3 transition-opacity ${step >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 1 ? 'bg-gold-400 text-white' : 'bg-white/20 text-white'}`}>1</div>
                <span className="font-medium tracking-wide">Alegere Serviciu</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity ${step >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 2 ? 'bg-gold-400 text-white' : 'bg-white/20 text-white'}`}>2</div>
                <span className="font-medium tracking-wide">Dată și Oră</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity ${step >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 3 ? 'bg-gold-400 text-white' : 'bg-white/20 text-white'}`}>3</div>
                <span className="font-medium tracking-wide">Detalii Personale</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panou Dreapta */}
        <div className="w-full md:w-3/5 flex flex-col h-full bg-cream-50 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-sage-400 hover:text-sage-900 transition-colors z-20 bg-cream-50 rounded-full p-1"><X size={24} /></button>
          
          <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center h-full overflow-hidden">
            <AnimatePresence mode="wait">
              
              {/* PASUL 1 */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                  <h4 className="text-2xl font-serif text-sage-900 mb-6">Ce tip de terapie dorești?</h4>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-2">
                      {services.map(s => (
                        <button key={s.id} onClick={() => { setSelectedService(s.id); setStep(2); }} className={`flex items-center justify-between p-4 border rounded-lg text-left transition-all ${selectedService === s.id ? 'border-gold-400 bg-gold-50/50 shadow-sm' : 'border-sage-200 bg-white'}`}>
                          <div>
                            <div className="font-medium text-sage-900">{s.name}</div>
                            <div className="text-xs text-sage-500 mt-0.5"><Clock size={12} className="inline mr-1" />{s.duration} • {s.price}</div>
                          </div>
                          <ChevronRight size={18} className={selectedService === s.id ? 'text-gold-500' : 'text-sage-300'} />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PASUL 2 */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                  <h4 className="text-2xl font-serif text-sage-900 mb-6">Când ești disponibil/ă?</h4>
                  <div className="mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                        const d = addDays(new Date(), offset);
                        if (d.getDay() === 0) return null;
                        const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
                        return (
                          <button key={offset} onClick={() => setSelectedDate(d)} className={`flex-shrink-0 w-[4.5rem] py-3 rounded-lg border text-center transition-all ${isSelected ? 'border-sage-900 bg-sage-900 text-white' : 'border-sage-200 bg-white'}`}>
                            <div className="text-[10px] uppercase font-semibold opacity-80">{format(d, 'EEE', { locale: ro })}</div>
                            <div className="font-serif text-2xl">{format(d, 'dd')}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {isLoadingSlots ? (
                      <div className="h-32 flex items-center justify-center text-sage-500 text-sm animate-pulse">Se verifică disponibilitatea...</div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableSlots.map(slot => {
                          const [hours, minutes] = slot.time.split(':').map(Number);
                          const slotDateObj = new Date(selectedDate);
                          slotDateObj.setHours(hours, minutes, 0, 0);
                          const isActuallyAvailable = slot.available && (slotDateObj >= new Date());

                          return (
                            <button key={slot.time} disabled={!isActuallyAvailable} onClick={() => setSelectedTime(slot.time)} className={`py-3 rounded-lg border text-sm font-medium transition-all ${!isActuallyAvailable ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' : selectedTime === slot.time ? 'border-gold-400 bg-gold-400 text-white' : 'border-sage-200 bg-white'}`}>
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-sage-200 flex justify-between items-center shrink-0">
                    <button onClick={() => setStep(1)} className="text-sage-600 text-sm font-medium px-2 py-2">← Înapoi</button>
                    <button disabled={!selectedTime} onClick={() => setStep(3)} className="bg-sage-900 text-white px-8 py-3 rounded-lg disabled:opacity-50 text-sm font-medium">Continuă</button>
                  </div>
                </motion.div>
              )}

              {/* PASUL 3 */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                  <h4 className="text-2xl font-serif text-sage-900 mb-6">Detaliile tale</h4>
                  <form onSubmit={handleBook} className="flex flex-col flex-1 min-h-0">
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-2 custom-scrollbar">
                      <div>
                        <label className="block text-sm font-medium text-sage-700 mb-1.5">Nume Complet *</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-sage-200 rounded-lg px-4 py-3" placeholder="Ex: Maria Popescu" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sage-700 mb-1.5">Telefon *</label>
                        <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-sage-200 rounded-lg px-4 py-3" placeholder="07xx xxx xxx" />
                      </div>
                      <label className="flex items-start gap-3 pt-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input type="checkbox" checked={formData.gdpr} onChange={e => setFormData({...formData, gdpr: e.target.checked})} className="peer w-5 h-5 appearance-none border border-sage-300 rounded cursor-pointer checked:bg-gold-400 checked:border-gold-400" />
                          <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                        </div>
                        <span className="text-sm text-sage-600">Sunt de acord cu prelucrarea datelor cu caracter personal în scopul gestionării programării.</span>
                      </label>
                    </div>
                    <div className="mt-4 pt-4 border-t border-sage-200 flex justify-between items-center shrink-0">
                      <button type="button" onClick={() => setStep(2)} className="text-sage-600 text-sm font-medium px-2 py-2">← Înapoi</button>
                      <button type="submit" disabled={!formData.gdpr || isSubmitting} className="bg-green-600 text-white px-8 py-3 rounded-lg disabled:opacity-50 hover:bg-green-500 text-sm font-medium flex items-center gap-2">
                        {isSubmitting ? 'Se procesează...' : 'Confirmă prin WhatsApp'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* PASUL 4 */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full items-center justify-center text-center">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50/50">
                    <CheckCircle className="text-sage-600 w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-serif text-sage-900 mb-4">Aproape gata!</h3>
                  <p className="text-sage-600 mb-8 max-w-sm mx-auto text-lg leading-relaxed">
                    Apasă Trimite în aplicația WhatsApp care tocmai s-a deschis pentru a finaliza programarea.
                  </p>
                  <button onClick={onClose} className="bg-sage-900 text-white px-10 py-3.5 rounded-lg font-medium">Închide</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}