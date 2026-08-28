export interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  image: string;
  benefits: string;
}

export const services: Service[] = [
  {
    id: 'terapeutic',
    name: 'Masaj Terapeutic',
    duration: '50 min',
    price: '140 RON',
    image: '/terapeutic.jpg',
    benefits: 'Ameliorează durerile musculare și articulare, elimină contracturile și accelerează recuperarea fizică.'
  },
  {
    id: 'relaxare',
    name: 'Masaj de Relaxare',
    duration: '50 min',
    price: '140 RON',
    image: '/relaxare.jpg',
    benefits: 'Reduce stresul și anxietatea, îmbunătățește calitatea somnului și relaxează profund sistemul nervos.'
  },
  {
    id: 'drenaj-limfatic',
    name: 'Drenaj Limfatic',
    duration: '50 min',
    price: '140 RON',
    image: '/drenaj.jpg',
    benefits: 'Stimulează eliminarea toxinelor, reduce retenția de apă și întărește sistemul imunitar.'
  },
  {
    id: 'ventuze',
    name: 'Terapie cu Ventuze',
    duration: '50 min',
    price: '140 RON',
    image: '/ventuze.jpg',
    benefits: 'Decomprimă țesuturile, deblochează circulația sanguină și eliberează rapid contracturile profunde.'
  },
  {
    id: 'pietre-calde',
    name: 'Masaj cu Pietre Calde',
    duration: '50 min',
    price: '140 RON',
    image: '/pietre.jpg',
    benefits: 'Combină căldura rocilor vulcanice cu tehnicile de masaj pentru o relaxare musculară absolută.'
  },
  {
    id: 'reflexoterapie',
    name: 'Reflexoterapie',
    duration: '50 min',
    price: '140 RON',
    image: '/reflexoterapie.jpg',
    benefits: 'Stimulează punctele reflexogene din tălpi pentru a echilibra funcțiile organelor interne.'
  },
  {
    id: 'anticelulitic',
    name: 'Masaj Anticelulitic',
    duration: '50 min',
    price: '140 RON',
    image: '/anticelulitic.jpg',
    benefits: 'Acționează viguros asupra țesutului adipos pentru a diminua aspectul de coajă de portocală.'
  },
  {
    id: 'trigger-points',
    name: 'Terapie Trigger Points',
    duration: '50 min',
    price: '140 RON',
    image: '/trigger.jpg',
    benefits: 'Aplică presiune pe punctele specifice de tensiune musculară pentru a dezactiva durerea iradiată.'
  }
];