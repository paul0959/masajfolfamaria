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
  const PORT = process.env.PORT || 3000; 

  app.use(express.json());

  // 1. API Endpoint pentru SALVARE PROGRAMĂRI
  app.post('/api/book', async (req, res) => {
    try {
      const { name, phone, email, serviceName, date, time } = req.body;

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

      res.json({ success: true, message: 'Programare salvată cu succes.' });
    } catch (error) {
      console.error('Eroare la salvarea în baza de date:', error);
      res.status(500).json({ error: 'Eroare la salvarea programării.' });
    }
  });

  // 1.5 API Endpoint pentru CITIRE PROGRAMĂRI (Asta lipsea pentru AdminDashboard!)
  app.get(['/api/book', '/api/bookings', '/api/programari'], async (req, res) => {
    try {
      const q = query(collection(db, 'programari'), orderBy('dataCreare', 'desc'));
      const querySnapshot = await getDocs(q);
      const programari = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(programari);
    } catch (error) {
      console.error("Eroare la citirea programărilor:", error);
      res.status(500).json({ error: 'Eroare la citirea programărilor din Firebase.' });
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
      
      if (!process.env.GEMINI_API_KEY) {
         return res.status(500).json({ error: 'GEMINI_API_KEY lipsește.' });
      }

      const systemInstruction = `Ești Mia, asistenta virtuală a Mariei Folfa, un tehnician maseur profesionist (activă din 2018). Cabinetul este în Localitatea Șanț, strada Principală, nr 931, jud. Bistrița-Năsăud. Răspunzi politicos, prietenos, calm și concis la întrebări despre masaje, beneficii și locație.`;

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
      res.status(500).json({ error: 'Eroare AI.' });
    }
  });

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