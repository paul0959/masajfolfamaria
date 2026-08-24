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

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const [showBooking, setShowBooking] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

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
      />
      
      <main>
        <Hero onOpenBooking={() => handleOpenBooking()} />
        
        <Services onSelectService={handleOpenBooking} />
        <About />
        <Contact />
      </main>

      <footer className="bg-sage-900 text-sage-400 py-6 border-t border-sage-800 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© {new Date().getFullYear()} Folfa Maria. Toate drepturile rezervate.</p>
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
    </div>
  );
}
