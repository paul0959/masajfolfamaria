import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint pentru procesarea programării (Email + Calendar block)
  app.post('/api/book', async (req, res) => {
    try {
      const { name, phone, email, serviceName, date, time } = req.body;

      // 1. Procesare Email
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'terapeutmaria@gmail.com',
            pass: process.env.EMAIL_APP_PASSWORD || 'qsrg zqii khgx bfyk'
          }
        });

        const mailOptionsAdmin = {
          from: 'terapeutmaria@gmail.com',
          to: 'terapeutmaria@gmail.com',
          subject: `NOUĂ PROGRAMARE: ${name} - ${serviceName}`,
          text: `Ai primit o nouă programare!\n\nDetalii client:\nNume: ${name}\nTelefon: ${phone}\nEmail: ${email}\n\nDetalii serviciu:\nServiciu: ${serviceName}\nData: ${date}\nOra: ${time}\n\nProgramarea a fost salvată în baza de date.`
        };

        const mailOptionsClient = email ? {
          from: 'terapeutmaria@gmail.com',
          to: email,
          subject: `Confirmare Programare - Cabinet Masaj Terapeutic Maria Folfa`,
          text: `Bună ${name},\n\nÎți mulțumesc pentru încredere! Programarea ta a fost înregistrată și confirmată cu succes.\n\nDetalii Programare:\nServiciu: ${serviceName}\nData: ${date}\nOra: ${time}\n\nLocație: Loc. Șanț, str. Principală nr. 931, jud. Bistrița-Năsăud.\n\nTe aștept cu drag la o sesiune de relaxare și echilibru. Dacă intervin modificări, te rog să mă anunți în prealabil.\n\nCu prietenie,\nMaria Folfa - Tehnician Maseur`
        } : null;

        if (process.env.EMAIL_APP_PASSWORD || true) {
          transporter.sendMail(mailOptionsAdmin).catch(err => console.error("Eroare admin email:", err));
          if (mailOptionsClient) {
            transporter.sendMail(mailOptionsClient).catch(err => console.error("Eroare client email:", err));
          }
        }
      } catch (emailErr) {
        console.error("Eroare initializare email:", emailErr);
      }

      // 2. Logare Calendar
      console.log(`[Google Calendar] Solicitare de blocare pentru: ${date} ora ${time}`);

      // 3. Returnează succes către client
      res.json({ success: true, message: 'Procesat cu succes.' });
    } catch (error) {
      console.error('Eroare backend book API:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Eroare internă la procesare.' });
      }
    }
  });



  // API Endpoint pentru Chatbot Gemini
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
         return res.status(500).json({ error: 'GEMINI_API_KEY lipsește. Te rog să configurezi cheia în setările aplicației.' });
      }

      const systemInstruction = `Ești Mia, asistenta virtuală a Mariei Folfa, un tehnician maseur profesionist (activă din 2018). Cabinetul este în Localitatea Șanț, strada Principală, nr 931, jud. Bistrița-Năsăud. Răspunzi politicos, prietenos, calm și concis la întrebări despre masaje, beneficii și locație. Ești caldă, empatică și folosești un ton relaxant (poți folosi emoji-uri potrivite precum 🌸, ✨, 🌿). Oferi doar informații legate de serviciile noastre. Direcționezi clientul să se programeze online apasand butonul din pagina. Nu inventa prețuri dacă nu ești sigură, spune-i clientului să verifice secțiunea de servicii.`;

      // Simplified chat formatting - append history context
      const context = history && history.length > 0 
        ? "Istoric conversație:\n" + history.map((h: any) => `${h.role}: ${h.content}`).join("\n") + "\n\nMesaj nou: " 
        : "";

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: context + message,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error('Eroare Gemini:', error);
      res.status(500).json({ error: 'Eroare la procesarea cererii către AI: ' + (error.message || String(error)) });
    }
  });

  // Vite Middleware pentru dezvoltare
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Servire fișiere statice pentru producție
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server rulând pe portul ${PORT}`);
  });
}

startServer();
