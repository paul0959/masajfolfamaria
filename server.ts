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

  app.post('/api/book', async (req, res) => {
    try {
      const { name, phone, email, serviceName, date, time } = req.body;

      // 1. SALVARE ÎN FIREBASE
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

      // 2. TRIMITERE EMAIL CĂTRE ADMINISTRATOR (EmailJS)
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

        const responseAdmin = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadAdmin)
        });
        
        if (responseAdmin.ok) {
           console.log("Email Admin trimis cu succes!");
        } else {
           const errText = await responseAdmin.text();
           console.error("Eroare de la EmailJS (Admin):", errText);
        }
      } catch (e) {
        console.error("Eroare rețea admin:", e);
      }

      // 3. TRIMITERE EMAIL CĂTRE CLIENT
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

          const responseClient = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadClient)
          });

          if (responseClient.ok) {
             console.log("Email Client trimis cu succes!");
          } else {
             const errText = await responseClient.text();
             console.error("Eroare de la EmailJS (Client):", errText);
          }
        } catch (e) {
          console.error("Eroare rețea client:", e);
        }
      }

      // Răspunsul este trimis abia DUPĂ ce emailurile au fost procesate
      res.json({ success: true, message: 'Procesat cu succes.' });
    } catch (error) {
      console.error('Eroare backend book API:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Eroare internă la procesare.' });
      }
    }
  });

  app.post('/api/reviews', async (req, res) => {
    try {
      const { author, rating, text } = req.body;
      await addDoc(collection(db, 'recenzii'), { author, rating, text, dataCreare: serverTimestamp() });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Eroare.' });
    }
  });

  app.get('/api/reviews', async (req, res) => {
    try {
      const q = query(collection(db, 'recenzii'), orderBy('dataCreare', 'desc'));
      const querySnapshot = await getDocs(q);
      res.json(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      res.status(500).json({ error: 'Eroare.' });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Cheie lipsă.' });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: (history ? history.map((h: any) => `${h.role}: ${h.content}`).join("\n") + "\n\n" : "") + message,
        config: { systemInstruction: `Ești Mia, asistenta virtuală...` }
      });
      res.json({ reply: response.text });
    } catch (error: any) {
      res.status(500).json({ error: 'Eroare AI' });
    }
  });

  app.use(express.static(path.join(process.cwd(), 'public')));
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => console.log(`Server rulând pe portul ${PORT}`));
}

startServer();