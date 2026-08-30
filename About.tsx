import { motion } from 'motion/react';


export default function About() {
  return (
    <section id="despre" className="py-16 md:py-24 bg-sage-900 text-cream-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[3/4] overflow-hidden rounded-md shadow-2xl">
              <img 
                src="https://i.postimg.cc/6pbFhN9G/Screenshot-20260823-192055-Instagram.jpg"
                alt="Maria Folfa - Masaj terapeutic" 
                className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
              />
            </div>
            {/* Decorative border */}
            <div className="absolute -inset-4 border border-gold-400/30 z-[-1] hidden md:block"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-serif mb-6 text-white">Povestea și Experiența</h2>
            <div className="w-16 h-1 bg-gold-400 mb-8"></div>
            
            <h3 className="text-2xl font-light text-cream-200 mb-6">
              "Răsfăț pentru corp,
liniște pentru suflet."
            </h3>
            
            <div className="space-y-6 text-cream-100/80 font-light leading-relaxed">
              <p>
                Sunt <strong>Maria Folfa</strong>, tehnician maseur cu o experiență neîntreruptă și o pasiune profundă pentru arta vindecării manuale, activând în acest domeniu încă din anul 2018.
              </p>
              <p>
                De-a lungul anilor, am ajutat sute de clienți să își regăsească echilibrul fizic și mental. Fie că este vorba despre dureri cronice de spate, tensiuni musculare acumulate din cauza stresului cotidian, sau pur și simplu nevoia de o pauză de relaxare profundă, abordarea mea este întotdeauna personalizată.
              </p>
              <p>
                În cabinetul meu combin tehnici tradiționale de masaj terapeutic cu terapii complementare (ventuze, roci vulcanice, reflexoterapie) pentru a oferi rezultate reale, vizibile și durabile.
              </p>
            </div>
            
            <div className="mt-12 grid grid-cols-2 gap-8 border-t border-sage-700 pt-8">
              <div>
                <p className="text-4xl font-serif text-gold-400 mb-2">2018</p>
                <p className="text-sm tracking-widest uppercase text-cream-200">Anul înființării</p>
              </div>
              <div>
                <p className="text-4xl font-serif text-gold-400 mb-2">1000+</p>
                <p className="text-sm tracking-widest uppercase text-cream-200">Sesiuni realizate</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
