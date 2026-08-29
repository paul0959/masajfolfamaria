import { motion } from 'motion/react';
import { CalendarDays } from 'lucide-react';

export default function Hero({ onOpenBooking }: { onOpenBooking?: () => void }) {
  return (
    <section id="acasa" className="relative flex items-center justify-center bg-cream-50 overflow-hidden pt-28 pb-4 md:pt-40 md:pb-16 min-h-[auto] md:min-h-[100vh]">
      <div className="absolute inset-0 bg-gradient-to-b from-cream-100/50 to-cream-50/20 pointer-events-none"></div>
      
      <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center relative z-10 py-4 md:py-16">
        
        {/* Left Content */}
        <div className="order-2 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-4 mb-8"
          >
            <span className="w-12 h-[1px] bg-gold-400 hidden lg:block"></span>
            <span className="text-sage-600 font-medium tracking-[0.3em] uppercase text-xs md:text-sm">
              Cabinet de Terapie & Masaj
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-6xl lg:text-[5rem] xl:text-[5.5rem] text-sage-900 font-serif leading-[1.2] tracking-tight mb-8"
          >
            <span className="block mb-2">
              <span className="font-semibold">Răsfăț</span>{' '}
              <span className="italic font-light text-sage-600/80">pentru</span>{' '}
              <span className="font-semibold">corp,</span>
            </span>
            <span className="block">
              <span className="font-semibold">liniște</span>{' '}
              <span className="italic font-light text-sage-600/80">pentru</span>{' '}
              <span className="font-semibold relative inline-block">
                suflet<span className="text-gold-500">.</span>
                {/* Linia fină aurie pentru efect vizual de lux */}
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gold-400/60 rounded-full"></span>
              </span>
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="text-lg md:text-xl text-sage-700 mb-12 max-w-lg font-light leading-relaxed"
          >
            Descoperă arta masajului terapeutic. O experiență rafinată și personalizată, dedicată echilibrului și stării tale de bine.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto"
          >
            <button 
              onClick={onOpenBooking}
              className="group relative flex items-center justify-center gap-3 bg-sage-900 text-cream-50 px-10 py-5 w-full sm:w-auto overflow-hidden transition-all hover:shadow-lg rounded-sm"
            >
              <div className="absolute inset-0 bg-sage-800 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
              <CalendarDays size={18} className="relative z-10" />
              <span className="relative z-10 text-xs font-medium tracking-[0.2em] uppercase">Programează-te Online</span>
            </button>
            <a 
              href="#servicii"
              className="text-xs font-medium tracking-[0.2em] uppercase text-sage-900 hover:text-gold-500 transition-colors py-4 relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1px] after:bg-gold-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            >
              Descoperă Serviciile
            </a>
          </motion.div>
        </div>

        {/* Right Content - Hero Image */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="order-1 lg:order-2 relative"
        >
          <div className="aspect-[4/5] lg:aspect-[3/4] relative overflow-hidden bg-sage-100 rounded-sm shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=1200" 
              alt="Masaj terapeutic și relaxare" 
              className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-[2s] ease-in-out"
            />
            {/* Elegant overlay frame */}
            <div className="absolute inset-4 border border-white/30 pointer-events-none"></div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gold-400/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-sage-600/10 rounded-full blur-3xl -z-10"></div>
        </motion.div>

      </div>
    </section>
  );
}