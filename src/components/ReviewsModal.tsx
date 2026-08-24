import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Loader2, MessageSquareQuote } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: any;
}

export default function ReviewsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Review[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as Review);
      });
      setReviews(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    
    setSubmitting(true);
    
    // Optimistic UI update
    addDoc(collection(db, 'reviews'), {
      name,
      rating,
      text,
      createdAt: Timestamp.now()
    }).catch(err => {
      console.error("Eroare la adăugarea recenziei în fundal:", err);
    });

    setName('');
    setRating(5);
    setText('');
    setSubmitting(false);
    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 4000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-sage-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-cream-50 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl rounded-sm"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-sage-600 hover:text-sage-900 bg-white/50 backdrop-blur-sm p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            {/* Form Section */}
            <div className="w-full md:w-2/5 bg-white p-8 md:p-10 flex flex-col border-r border-sage-900/10 shrink-0 overflow-y-auto custom-scrollbar">
              <div className="my-auto">
                <div className="mb-8 text-center md:text-left">
                <span className="text-gold-400 font-medium tracking-[0.2em] uppercase text-xs block mb-2">
                  Părerea ta contează
                </span>
                <h2 className="text-3xl font-serif text-sage-900 mb-2">Lasă o recenzie</h2>
                <p className="text-sage-600 text-sm font-light leading-relaxed">
                  Experiența ta ne ajută să creștem calitatea serviciilor.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded text-sm mb-2 font-medium">
                    Recenzia a fost trimisă și salvată cu succes. Îți mulțumim!
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium tracking-widest text-sage-900 uppercase mb-2">
                    Numele tău
                  </label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-cream-50 border border-sage-200 px-4 py-3 focus:outline-none focus:border-sage-500 transition-colors"
                    placeholder="Ex: Ana M."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium tracking-widest text-sage-900 uppercase mb-2">
                    Notă
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="transition-colors focus:outline-none"
                      >
                        <Star 
                          size={24} 
                          className={`transition-colors ${(hoveredStar || rating) >= star ? 'fill-gold-400 text-gold-400' : 'text-sage-200'} `}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium tracking-widest text-sage-900 uppercase mb-2">
                    Mesajul tău
                  </label>
                  <textarea 
                    required
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    className="w-full bg-cream-50 border border-sage-200 px-4 py-3 focus:outline-none focus:border-sage-500 transition-colors resize-none"
                    placeholder="Cum a fost experiența ta?"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting || successMessage}
                  className={`px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 mt-2 flex items-center justify-center gap-2 ${
                    successMessage 
                      ? 'bg-green-600 text-white cursor-default' 
                      : 'bg-sage-900 text-cream-50 hover:bg-sage-800'
                  }`}
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : successMessage ? (
                    'Recenzie Trimisă!'
                  ) : (
                    'Trimite Recenzia'
                  )}
                </button>
              </form>
              </div>
            </div>

            {/* Reviews List Section */}
            <div className="w-full md:w-3/5 p-8 md:p-10 overflow-y-auto custom-scrollbar bg-cream-50 relative">
              <div className="sticky top-0 bg-cream-50 pb-6 mb-6 border-b border-sage-900/10 z-10">
                <h3 className="text-2xl font-serif text-sage-900">Recenziile clienților noștri</h3>
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-sage-500 gap-4">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-sm tracking-widest uppercase">Se încarcă...</span>
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-sage-500 text-center">
                  <MessageSquareQuote size={32} className="mb-4 opacity-50" />
                  <p className="font-light">Nu există încă nicio recenzie.<br/>Fii primul care lasă una!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white p-6 shadow-sm border border-sage-100 rounded-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium text-sage-900">{review.name}</h4>
                          <span className="text-[10px] text-sage-400 uppercase tracking-wider">
                            {review.createdAt?.toDate()?.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' }) || 'Acum'}
                          </span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={14} 
                              className={star <= review.rating ? 'fill-gold-400 text-gold-400' : 'text-sage-200'} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sage-600 text-sm font-light leading-relaxed">
                        "{review.text}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
