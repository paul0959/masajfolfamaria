export interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  benefits: string;
  image: string;
}

export const services: Service[] = [
  {
    id: "terapeutic",
    name: "Masaj Terapeutic",
    duration: "50 min",
    price: "140 RON",
    benefits: "Ameliorează durerile musculare și articulare, corectează postura.",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "relaxare",
    name: "Masaj de Relaxare",
    duration: "50 min",
    price: "140 RON",
    benefits: "Reduce stresul, îmbunătățește circulația și induce o stare profundă de bine.",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "drenaj",
    name: "Drenaj Limfatic",
    duration: "50 min",
    price: "140 RON",
    benefits: "Elimină toxinele și reduce retenția de apă din organism.",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "ventuze",
    name: "Terapie cu Ventuze",
    duration: "50 min",
    price: "140 RON",
    benefits: "Decompresie musculară profundă, ideală pentru contracturi severe.",
    image: "https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "pietre",
    name: "Masaj cu Pietre Calde",
    duration: "50 min",
    price: "140 RON",
    benefits: "Relaxează sistemul nervos central prin transferul termic profund.",
    image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "reflexoterapie",
    name: "Reflexoterapie",
    duration: "50 min",
    price: "140 RON",
    benefits: "Stimulează organele interne prin punctele reflexogene din tălpi.",
    image: "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "anticelulitic",
    name: "Masaj Anticelulitic",
    duration: "50 min",
    price: "140 RON",
    benefits: "Remodelează țesutul adipos și îmbunătățește elasticitatea pielii.",
    image: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "trigger",
    name: "Terapia Trigger Points",
    duration: "50 min",
    price: "140 RON",
    benefits: "Dezactivarea punctelor dureroase specifice și eliberarea tensiunii.",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=600"
  }
];

export interface Appointment {
  id?: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}