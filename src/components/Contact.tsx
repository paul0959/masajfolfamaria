import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Contact() {
  return (
    <section id="contact" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif text-sage-900 mb-6">Contact & Locație</h2>
            <div className="w-16 h-1 bg-gold-400 mb-8"></div>
            
            <p className="text-sage-600 mb-10 leading-relaxed">
              Programează o ședință de masaj sau contactează-mă pentru orice întrebare legată de serviciile oferite.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center shrink-0">
                  <MapPin className="text-sage-600" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-sage-900 mb-1">Adresa Cabinetului</h4>
                  <p className="text-sage-600">Localitatea Șanț, strada Principală, nr 931<br/>Jud. Bistrița-Năsăud</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center shrink-0">
                  <Phone className="text-sage-600" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-sage-900 mb-1">Telefon</h4>
                  <a href="tel:0745240799" className="text-sage-600 hover:text-gold-500 transition-colors">0745 240 799</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center shrink-0">
                  <Mail className="text-sage-600" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-sage-900 mb-1">Email</h4>
                  <a href="mailto:terapeutmaria@gmail.com" className="text-sage-600 hover:text-gold-500 transition-colors">terapeutmaria@gmail.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center shrink-0">
                  <Clock className="text-sage-600" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-sage-900 mb-1">Program</h4>
                  <p className="text-sage-600">Luni - Vineri: 09:00 - 18:00<br/>Sâmbătă: 09:00 - 14:00</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="h-[500px] bg-cream-100 relative"
          >
            {/* Embedded Google Maps Placeholder */}
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d87178.53037894589!2d24.89679632832032!3d47.464197999999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4735c0500f40d39b%3A0xc68297b5e48601ea!2s%C8%98an%C8%9B%20427320!5e0!3m2!1sen!2sro!4v1709210000000!5m2!1sen!2sro" 
              className="w-full h-full border-0 grayscale opacity-80 mix-blend-multiply" 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
            
            <div className="absolute inset-0 border border-sage-200 pointer-events-none mix-blend-overlay"></div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
