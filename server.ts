import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import https from 'https';

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

function trimiteEmailJS(payload: any) {
  const data = JSON.stringify(payload);
  const req = https.request('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    if (res.statusCode === 200) console.log("Email expediat cu succes prin HTTPS nativ!");
    else console.error("Eroare EmailJS:", res.statusCode);
  });
  req.on('error', (e) => console.error("Eroare rețea EmailJS:", e));
  req.write(data);
  req.end();
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000; 

  app.use(express.json());

  // API Endpoint pentru SALVARE PROGRAMĂRI + EMAIL
  app.post('/api/book', async (req, res) => {
    try {
      const { name, phone, email, serviceName, date, time } = req.body;

      await addDoc(collection(db, 'programari'), {
         name, phone, email: email || '', serviceName, date, time, dataCreare: serverTimestamp()
      });

      res.json({ success: true, message: 'Programare salvată cu succes.' });

      try {
        trimiteEmailJS({
          service_id: 'service_ozdh5vo', template_id: 'template_ttdpsfh', user_id: '9hW5rySbyy76L-RZr',
          template_params: { nume: name, telefon: phone, email: email || 'Nu a lăsat', serviciu: serviceName, data: date, ora: time }
        });

        if (email && email.includes('@')) {
          trimiteEmailJS({
            service_id: 'service_ozdh5vo', template_id: 'template_faubiae', user_id: '9hW5rySbyy76L-RZr',
            template_params: { nume: name, email: email, serviciu: serviceName, data: date, ora: time }
          });
        }
      } catch (emailErr) {}
    } catch (error) {
      if (!res.headersSent) res.status(500).json({ error: 'Eroare la salvarea programării.' });
    }
  });

  // API Endpoint pentru CITIRE PROGRAMĂRI (Pentru Admin)
  app.get(['/api/book', '/api/bookings', '/api/programari'], async (req, res) => {
    try {
      const q = query(collection(db, 'programari'), orderBy('dataCreare', 'desc'));
      const querySnapshot = await getDocs(q);
      res.json(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      res.status(500).json({ error: 'Eroare.' });
    }
  });

  // API Endpoint pentru ADĂUGARE/CITIRE RECENZII
  app.post('/api/reviews', async (req, res) => {
    try {
      const { author, rating, text } = req.body;
      await addDoc(collection(db, 'recenzii'), { author, rating, text, dataCreare: serverTimestamp() });
      res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Eroare.' }); }
  });

  app.get('/api/reviews', async (req, res) => {
    try {
      const q = query(collection(db, 'recenzii'), orderBy('dataCreare', 'desc'));
      const querySnapshot = await getDocs(q);
      res.json(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { res.status(500).json({ error: 'Eroare.' }); }
  });

  // API Endpoint pentru Chatbot Gemini (Optimizat pentru viteză)
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY lipsește.' });
      
      const formattedHistory = history && history.length > 0 
        ? history.map((h: any) => `${h.role === 'user' ? 'Client' : 'Mia'}: ${h.content}`).join("\n") 
        : "";
        
      const finalPrompt = formattedHistory 
        ? `Iată conversația de până acum:\n${formattedHistory}\n\nAcum răspunde la următorul mesaj al clientului:\nClient: ${message}`
        : message;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: finalPrompt,
        config: { 
          systemInstruction: `Ești Mia, asistenta virtuală a Mariei Folfa, un tehnician maseur profesionist (activă din 2018). Cabinetul este în Bistrița, strada Zorilor Nr. 15. Răspunzi politicos, prietenos, calm și concis. Toate tipurile de masaj au durata de 50 de minute și prețul unic de 140 RON. Programul este Luni-Vineri 08:00 - 20:00, dar vinerea nu se fac programări online. REGULĂ STRICTĂ: Dacă primești întrebări cu tentă sexuală, jignitoare, aluzii indecente sau întrebări despre servicii "cu finalizare", refuză imediat, politicos, dar extrem de ferm. Menționează clar că Maria oferă strict servicii profesionale și terapeutice de masaj și încheie conversația pe acel subiect.`,
          maxOutputTokens: 150, // Limitează lungimea maximă a răspunsului pentru a genera textul instantaneu
          temperature: 0.5,     // Menține răspunsurile directe și la obiect
          safetySettings: [
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
            { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any }
          ]
        }
      });
      
      const replyText = response.text || (response.candidates && response.candidates[0]?.content?.parts[0]?.text) || "Scuză-mă, nu am putut procesa acest mesaj.";

      res.json({ reply: replyText });
    } catch (error: any) {
      console.error("Eroare detaliată Gemini:", error);
      res.status(500).json({ error: 'Ne pare rău, dar sistemul a blocat acest mesaj, sau a apărut o eroare tehnică.' });
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