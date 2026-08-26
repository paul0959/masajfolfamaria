import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// --- IMPORTĂM FIREBASE ---
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';

dotenv.config();

// --- CONFIGURAȚIA TA FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBg-SxPEDd4Vn29rDwkfqRAEBc-mRuk4rQ",
  authDomain: "salon-masaj-maria.firebaseapp.com",
  projectId: "salon-masaj-maria",
  storageBucket: "salon-masaj-maria.firebasestorage.app",
  messagingSenderId: "670170578722",
  appId: "1:670170578722:web:99e912912b1821bf54ef7b"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY' });

async function startServer() {
  const app = express();
  // Folosim portul oferit de Render, altfel 3000
  const PORT = process.env.PORT || 3000; 

  app.use(express.json());

  // 1. API Endpoint pentru PROGRAMĂRI (Email + Bază de date)
  app.post('/api/book', async (req, res) => {
    try {
      const { name, phone, email, serviceName, date, time } = req.body;

      // SALVARE ÎN FIREBASE
      try {
         await addDoc(collection(db, 'programari'), {
            name,
            phone,
            email: email || '',
            serviceName,
            date,
            time,
            dataCreare: serverTimestamp()
         });
         console.log("Programare salvată în Firebase cu succes!");
      } catch (dbErr) {
         console.error("Eroare la salvarea în baza de date:", dbErr);
      }

      // 1. TRIMITERE EMAIL CĂTRE ADMINISTRATOR (EmailJS)
      try {
        const payloadAdmin = {
          service_id: 'service_ozdh5vo',
          template_id: 'template_ttdpsfh',
          user_id: '9hW5rySbyy76L-RZr',
          template_params: {
            nume: name,
            telefon: phone,
            email: email || 'Nu a lăsat',
            serviciu: serviceName,
            data: date,
            ora: time
          }
        };

        fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadAdmin)
        }).then(res => {
          if (res.ok) console.log("Email Admin trimis cu succes!");
        }).catch(err => console.error("Eroare admin email:", err));
      } catch (e) {
        console.error("Eroare try-catch admin:", e);
      }

      // 2. TRIMITERE EMAIL CĂTRE CLIENT (Doar dacă a scris un email valid)
      if (email && email.includes('@')) {
        try {
          const payloadClient = {
            service_id: 'service_ozdh5vo',
            template_id: 'template_faubiae',
            user_id: '9hW5rySbyy76L-RZr',
            template_params: {
              nume: name,
              email: email, 
              serviciu: serviceName,
              data: date,
              ora: time
            }
          };

          fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadClient)
          }).then(res => {
            if (res.ok) console.log("Email Client trimis cu succes!");
          }).catch(err => console.error("Eroare client email:", err));
        } catch (e) {
          console.error("Eroare try-catch client:", e);
        }
      }

      res.json({ success: true, message: 'Procesat cu succes.' });
    } catch (error) {
      console.error('Eroare backend book API:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Eroare internă la procesare.' });
      }
    }
  });

  // 2. API Endpoint pentru ADĂUGARE RECENZII
  app.post('/api/reviews', async (req, res) => {
    try {
      const { author, rating, text } = req.body;
      await addDoc(collection(db, 'recenzii'), {
         author,
         rating,
         text,
         dataCreare: serverTimestamp()
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Eroare adaugare recenzie:", error);
      res.status(500).json({ error: 'Eroare la salvarea recenziei.' });
    }
  });

  // 3. API Endpoint pentru CITIRE RECENZII
  app.get('/api/reviews', async (req, res) => {
    try {
      const q = query(collection(db, 'recenzii'), orderBy('dataCreare', 'desc'));
      const querySnapshot = await getDocs(q);
      const recenzii = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(recenzii);
    } catch (error) {
      console.error("Eroare citire recenzii:", error);
      res.status(500).json({ error: 'Eroare la citirea recenziilor.' });
    }
  });

  // 4. API Endpoint pentru Chatbot Gemini
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
         return res.status(500).json({ error: 'GEMINI_API_KEY lipsește.' });
      }

      const systemInstruction = `Ești Mia, asistenta virtuală a Mariei Folfa, un tehnician maseur profesionist (activă din 2018). Cabinetul este în Localitatea Șanț, strada Principală, nr 931, jud. Bistrița-Năsăud. Răspunzi politicos, prietenos, calm și concis la întrebări despre masaje, beneficii și locație. Ești caldă, empatică și folosești un ton relaxant (poți folosi emoji-uri potrivite precum 🌸, ✨, 🌿). Oferi doar informații legate de serviciile noastre. Direcționezi clientul să se programeze online apasand butonul din pagina. Nu inventa prețuri dacă nu ești sigură, spune-i clientului să verifice secțiunea de servicii.`;

      const context = history && history.length > 0 
        ? "Istoric conversație:\n" + history.map((h: any) => `${h.role}: ${h.content}`).join("\n") + "\n\nMesaj nou: " 
        : "";

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: context + message,
        config: { systemInstruction: systemInstruction }
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error('Eroare Gemini:', error);
      res.status(500).json({ error: 'Eroare AI: ' + (error.message || String(error)) });
    }
  });

  // Servim imaginile din public și folderul dist
  app.use(express.static(path.join(process.cwd(), 'public')));
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server rulând pe portul ${PORT}`);
  });
}

startServer();