import { motion } from 'motion/react';
import { services } from '../types';
import { Clock } from 'lucide-react';

interface ServicesProps {
  onSelectService: (serviceId: string) => void;
}

export default function Services({ onSelectService }: ServicesProps) {
  return (
    <section id="servicii" className="pt-10 pb-20 md:py-32 bg-white relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-20 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        <div className="text-center mb-10 md:mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sage-500 font-medium tracking-[0.3em] uppercase text-xs md:text-sm block mb-4"
          >
            Meniul de Terapii
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-5xl lg:text-6xl font-serif text-sage-900 mb-6"
          >
            Servicii de Masaj
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-16 h-[1px] bg-gold-400 mx-auto mb-8"
          ></motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-sage-600 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Fiecare sesiune este o călătorie personalizată spre echilibru. Folosim tehnici manuale rafinate pentru a elibera tensiunea, a restabili armonia și a revitaliza corpul.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
              className="group flex flex-col bg-cream-50/50 hover:bg-cream-50 transition-colors duration-500 rounded-sm shadow-sm hover:shadow-md border border-sage-100/50"
            >
              <div className="relative h-56 md:h-64 overflow-hidden rounded-t-sm">
                <img 
                  src={service.image} 
                  alt={service.name} 
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute top-4 left-4 bg-sage-900/80 backdrop-blur-md px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-cream-50 flex items-center gap-1.5">
                  <Clock size={12} />
                  {service.duration}
                </div>
              </div>
              
              <div className="p-6 md:p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-serif text-sage-900 mb-3">{service.name}</h3>
                <p className="text-sage-600 text-sm mb-8 flex-grow font-light leading-relaxed">
                  {service.benefits}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-sage-900/10">
                  <span className="text-xl font-serif text-sage-900">{service.price}</span>
                  <button 
                    onClick={() => onSelectService(service.id)}
                    className="text-[10px] font-medium tracking-[0.2em] text-sage-900 hover:text-gold-500 uppercase transition-colors relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1px] after:bg-gold-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
                  >
                    Selectează
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
