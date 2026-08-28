import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onOpenReviews?: () => void;
  onOpenBooking?: () => void;
  onOpenAdmin?: () => void;
}

export default function Navbar({ onOpenReviews, onOpenBooking, onOpenAdmin }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Acasă', href: '#acasa' },
    { name: 'Servicii', href: '#servicii' },
    { name: 'Despre', href: '#despre' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b bg-white/95 backdrop-blur-md border-sage-900/10 ${
        isScrolled ? 'py-3 shadow-sm' : 'py-5 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        <a href="#acasa" className="flex items-center gap-4 group">
          <div className="relative overflow-hidden rounded-full p-[2px] bg-gradient-to-tr from-gold-400/40 to-sage-900/20 transition-transform duration-500 group-hover:scale-105">
            <img 
              src="https://i.postimg.cc/6pbFhN9G/Screenshot-20260823-192055-Instagram.jpg" 
              alt="Folfa Maria" 
              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-cream-50 shadow-sm"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-serif tracking-[0.15em] uppercase text-sage-900">
              Folfa Maria
            </span>
            <span className="text-[9px] md:text-[10px] font-medium tracking-[0.4em] text-sage-500 uppercase mt-0.5">
              Terapie & Masaj
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-[11px] font-semibold tracking-[0.25em] uppercase text-sage-900/80 hover:text-sage-900 transition-colors relative after:absolute after:-bottom-2 after:left-0 after:w-full after:h-[1px] after:bg-gold-400 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300"
            >
              {link.name}
            </a>
          ))}
          <button 
            onClick={onOpenReviews}
            className="text-[11px] font-semibold tracking-[0.25em] uppercase text-sage-900/80 hover:text-sage-900 transition-colors relative after:absolute after:-bottom-2 after:left-0 after:w-full after:h-[1px] after:bg-gold-400 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300"
          >
            Recenzii
          </button>
          
          {/* Buton Admin Desktop */}
          <button 
            onClick={onOpenAdmin}
            className="text-[10px] font-bold tracking-[0.2em] uppercase text-sage-800 border border-sage-900/20 hover:border-sage-900 hover:bg-sage-900 hover:text-white px-3.5 py-1.5 rounded-full transition-all duration-300 shadow-sm"
          >
            Admin
          </button>
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-sage-900"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Meniu"
        >
          {isMobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 bg-cream-50 border-b border-sage-900/10 shadow-2xl md:hidden overflow-hidden"
          >
            <div className="flex flex-col px-6 py-8 gap-6">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sage-900 text-sm font-medium tracking-[0.2em] uppercase border-b border-sage-900/10 pb-4"
                >
                  {link.name}
                </a>
              ))}
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenReviews?.();
                }}
                className="text-sage-900 text-sm font-medium tracking-[0.2em] uppercase text-left border-b border-sage-900/10 pb-4"
              >
                Recenzii
              </button>
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenBooking?.();
                }}
                className="text-sage-900 text-sm font-medium tracking-[0.2em] uppercase text-left border-b border-sage-900/10 pb-4"
              >
                Programare
              </button>
              {/* Ultimul buton în meniul pe mobil */}
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAdmin?.();
                }}
                className="text-sage-900 text-sm font-bold tracking-[0.2em] uppercase text-left flex items-center justify-between pt-2 text-gold-600"
              >
                <span>Admin</span>
                <span className="text-[10px] bg-sage-200/60 px-2 py-0.5 rounded text-sage-800">Acces</span>
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}