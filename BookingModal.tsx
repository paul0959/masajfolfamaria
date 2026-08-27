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
  
  // Date & Time
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gdpr: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedService(preselectedServiceId);
      setStep(2);
    } else {
      setStep(1);
    }
    setIsSuccess(false);
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
        const appt = doc.data();
        if (appt.status !== 'cancelled') {
          bookedTimes.push(appt.time);
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
        alert("Ne pare rău, ora selectată tocmai a fost rezervată de altcineva. Te rugăm să alegi o altă oră.");
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
      
      // 1. Salvăm în baza de date pe server
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
         // 2. IMEDIAT DUPĂ SALVARE, TRIMITEM EMAILURILE DIRECT DIN BROWSER (Ocolim serverul)
         try {
           // A. Email către Administrator
           const payloadAdmin = {
             service_id: 'service_ozdh5vo',
             template_id: 'template_ttdpsfh',
             user_id: '9hW5rySbyy76L-RZr',
             template_params: {
               nume: formData.name,
               telefon: formData.phone,
               email: formData.email || 'Nu a lăsat',
               serviciu: serviceNameStr,
               data: dateStr,
               ora: selectedTime
             }
           };
           fetch('https://api.emailjs.com/api/v1.0/email/send', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payloadAdmin)
           }).catch(err => console.error("Eroare trimitere email admin:", err));

           // B. Email către Client (Dacă a pus adresa)
           if (formData.email && formData.email.includes('@')) {
             const payloadClient = {
               service_id: 'service_ozdh5vo',
               template_id: 'template_faubiae',
               user_id: '9hW5rySbyy76L-RZr',
               template_params: {
                 nume: formData.name,
                 email: formData.email,
                 serviciu: serviceNameStr,
                 data: dateStr,
                 ora: selectedTime
               }
             };
             fetch('https://api.emailjs.com/api/v1.0/email/send', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(payloadClient)
             }).catch(err => console.error("Eroare trimitere email client:", err));
           }
         } catch (emailEx) {
           console.error("Eroare EmailJS:", emailEx);
         }

         // 3. Finalizăm pașii pe ecran
         setIsSuccess(true);
         setStep(4);
      } else {
         alert("A apărut o eroare la salvarea programării. Te rugăm să încerci din nou.");
      }
    } catch (error) {
      console.error("Eroare la programare:", error);
      alert("Eroare de conexiune. Verifică internetul și încearcă din nou.");
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
        {/* Left Pane - Visual & Summary */}
        <div className="hidden md:flex w-2/5 bg-sage-900 text-white flex-col relative">
          <img 
            src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800" 
            alt="Spa background" 
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
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

            {(selectedService || selectedDate) && step < 4 && (
              <div className="mt-auto bg-white/10 p-5 rounded-lg backdrop-blur-md border border-white/10">
                <h5 className="text-xs uppercase tracking-widest text-gold-400 mb-3 font-semibold">Sumar Selecție</h5>
                {selectedService && (
                  <p className="text-sm text-cream-50 font-medium mb-1 line-clamp-1">
                    {services.find(s => s.id === selectedService)?.name}
                  </p>
                )}
                {selectedTime && step > 1 && (
                  <p className="text-sm text-sage-200 flex items-center gap-2">
                    <CalendarIcon size={14}/>
                    {format(selectedDate, 'dd MMM yyyy', { locale: ro })} - {selectedTime}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Content */}
        <div className="w-full md:w-3/5 flex flex-col h-full bg-cream-50 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-sage-400 hover:text-sage-900 transition-colors z-20 bg-cream-50 rounded-full p-1">
            <X size={24} />
          </button>
          
          <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center h-full overflow-hidden">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                  <h4 className="text-2xl font-serif text-sage-900 mb-6">Ce tip de terapie dorești?</h4>
                  
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-2">
                      {services.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedService(s.id);
                            setStep(2);
                          }}
                          className={`flex items-center justify-between p-4 border rounded-lg text-left transition-all group ${
                            selectedService === s.id 
                              ? 'border-gold-400 bg-gold-50/50 shadow-sm' 
                              : 'border-sage-200 bg-white hover:border-gold-300 hover:shadow-sm'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-sage-900 group-hover:text-gold-700 transition-colors">{s.name}</div>
                            <div className="text-xs text-sage-500 mt-0.5 flex items-center gap-2">
                              <span><Clock size={12} className="inline mr-1" />{s.duration}</span>
                              <span>•</span>
                              <span className="font-medium">{s.price}</span>
                            </div>
                          </div>
                          <ChevronRight size={18} className={`${selectedService === s.id ? 'text-gold-500' : 'text-sage-300 group-hover:text-gold-400'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                  <h4 className="text-2xl font-serif text-sage-900 mb-6">Când ești disponibil/ă?</h4>
                  
                  <div className="mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                        const d = addDays(new Date(), offset);
                        if (d.getDay() === 0) return null; // Skip sunday
                        const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
                        return (
                          <button
                            key={offset}
                            onClick={() => setSelectedDate(d)}
                            className={`flex-shrink-0 w-[4.5rem] py-3 rounded-lg border text-center transition-all ${
                              isSelected 
                                ? 'border-sage-900 bg-sage-900 text-white shadow-md' 
                                : 'border-sage-200 bg-white text-sage-700 hover:border-sage-400 hover:shadow-sm'
                            }`}
                          >
                            <div className="text-[10px] uppercase font-semibold tracking-wider mb-1 opacity-80">{format(d, 'EEE', { locale: ro })}</div>
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
                          // Logica nouă care blochează orele din trecut pentru ziua curentă
                          const [hours, minutes] = slot.time.split(':').map(Number);
                          const slotDateObj = new Date(selectedDate);
                          slotDateObj.setHours(hours, minutes, 0, 0);
                          
                          const isPast = slotDateObj < new Date();
                          const isActuallyAvailable = slot.available && !isPast;

                          return (
                            <button
                              key={slot.time}
                              disabled={!isActuallyAvailable}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                                !isActuallyAvailable 
                                  ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed opacity-60' 
                                  : selectedTime === slot.time
                                    ? 'border-gold-400 bg-gold-400 text-white shadow-md transform scale-[1.02]'
                                    : 'border-sage-200 bg-white hover:border-gold-400 text-sage-700 hover:shadow-sm'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-sage-200 flex justify-between items-center bg-white shrink-0">
                    <button onClick={() => setStep(1)} className="text-sage-600 hover:text-sage-900 text-sm font-medium px-2 py-2 transition-colors">
                      ← Înapoi
                    </button>
                    <button 
                      disabled={!selectedTime}
                      onClick={() => setStep(3)}
                      className="bg-sage-900 text-white px-8 py-3 rounded-lg disabled:opacity-50 hover:bg-sage-800 transition-all text-sm font-medium shadow-sm hover:shadow-md"
                    >
                      Continuă
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                  <h4 className="text-2xl font-serif text-sage-900 mb-6">Detaliile tale</h4>
                  
                  <form onSubmit={handleBook} className="flex flex-col flex-1 min-h-0">
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-2 custom-scrollbar">
                      <div>
                        <label className="block text-sm font-medium text-sage-700 mb-1.5">Nume Complet *</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-sage-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 text-sage-900 bg-white shadow-sm transition-all" placeholder="Ex: Maria Popescu" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-sage-700 mb-1.5">Telefon *</label>
                        <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-sage-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 text-sage-900 bg-white shadow-sm transition-all" placeholder="07xx xxx xxx" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-sage-700 mb-1.5">Email (Optional, pentru confirmare)</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-sage-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 text-sage-900 bg-white shadow-sm transition-all" placeholder="exemplu@email.com" />
                      </div>

                      <label className="flex items-start gap-3 pt-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input 
                            type="checkbox" 
                            checked={formData.gdpr}
                            onChange={e => setFormData({...formData, gdpr: e.target.checked})}
                            className="peer w-5 h-5 appearance-none border border-sage-300 rounded cursor-pointer checked:bg-gold-400 checked:border-gold-400 transition-all"
                          />
                          <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                        </div>
                        <span className="text-sm text-sage-600 leading-relaxed group-hover:text-sage-800 transition-colors">
                          Sunt de acord cu prelucrarea datelor cu caracter personal în scopul gestionării programării.
                        </span>
                      </label>
                    </div>

                    <div className="mt-4 pt-4 border-t border-sage-200 flex justify-between items-center bg-white shrink-0">
                      <button type="button" onClick={() => setStep(2)} className="text-sage-600 hover:text-sage-900 text-sm font-medium px-2 py-2 transition-colors">
                        ← Înapoi
                      </button>
                      <button 
                        type="submit"
                        disabled={!formData.gdpr || isSubmitting}
                        className="bg-gold-500 text-white px-8 py-3 rounded-lg disabled:opacity-50 hover:bg-gold-400 transition-all text-sm font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        {isSubmitting ? 'Se procesează...' : 'Confirmă Programarea'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full items-center justify-center text-center">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50/50">
                    <CheckCircle className="text-sage-600 w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-serif text-sage-900 mb-4">Totul este pregătit!</h3>
                  <p className="text-sage-600 mb-8 max-w-sm mx-auto text-lg leading-relaxed">
                    Mulțumim, <span className="font-medium text-sage-900">{formData.name}</span>.<br/>Te așteptăm cu drag la terapie.
                  </p>
                  <button 
                    onClick={onClose}
                    className="bg-sage-900 text-white px-10 py-3.5 rounded-lg hover:bg-sage-800 transition-all font-medium shadow-md hover:shadow-lg"
                  >
                    Închide
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}