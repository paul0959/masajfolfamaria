import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import Contact from './components/Contact';
import Chatbot from './components/Chatbot';
import BookingModal from './components/BookingModal';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginModal from './components/AdminLoginModal';
import ReviewsModal from './components/ReviewsModal';
import ReviewsSection from './components/ReviewsSection'; 
import TherapistAdminModal from './components/TherapistAdminModal'; // IMPORT NOU PENTRU ADMIN TERAPEUT

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const [showBooking, setShowBooking] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // STARE NOUĂ PENTRU MODALUL DE TERAPEUT (din Navbar)
  const [isTherapistAdminOpen, setIsTherapistAdminOpen] = useState(false);

  const handleOpenBooking = (serviceId?: string) => {
    setSelectedServiceId(serviceId || null);
    setShowBooking(true);
  };

  if (isAdminMode) {
    return <AdminDashboard onLogout={() => setIsAdminMode(false)} />;
  }

  return (
    <div className="relative min-h-screen">
      <Navbar 
        onOpenReviews={() => setShowReviews(true)} 
        onOpenBooking={() => handleOpenBooking()} 
        onOpenAdmin={() => setIsTherapistAdminOpen(true)} // PROP NOU PENTRU NAVBAR
      />
      
      <main>
        <Hero onOpenBooking={() => handleOpenBooking()} />
        
        <Services onSelectService={handleOpenBooking} />
        <About />
        
        {/* AICI ESTE SECȚIUNEA DE RECENZII PUBLICE */}
        <ReviewsSection />

        <Contact />
      </main>

      <footer className="bg-sage-900 text-sage-400 py-6 border-t border-sage-800 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© {new Date().getFullYear()} Folfa Maria. Toate drepturile rezervate.</p>
          {/* Aici rămâne butonul tău original de admin general, ascuns în subsol */}
          <button 
            onClick={() => setShowAdminLogin(true)}
            className="text-xs uppercase tracking-widest hover:text-white transition-colors"
          >
            © Admin
          </button>
        </div>
      </footer>

      <Chatbot />
      
      <BookingModal 
        isOpen={showBooking} 
        onClose={() => setShowBooking(false)} 
        preselectedServiceId={selectedServiceId}
      />

      <ReviewsModal 
        isOpen={showReviews}
        onClose={() => setShowReviews(false)}
      />

      <AdminLoginModal 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)}
        onLogin={() => {
          setShowAdminLogin(false);
          setIsAdminMode(true);
        }}
      />

      {/* COMPONENTA NOUĂ PENTRU PANOUL DE TERAPEUT (Acces prin butonul din meniu) */}
      <TherapistAdminModal 
        isOpen={isTherapistAdminOpen} 
        onClose={() => setIsTherapistAdminOpen(false)} 
      />
    </div>
  );
}