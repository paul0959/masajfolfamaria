var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_https = __toESM(require("https"), 1);
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
import_dotenv.default.config();
var firebaseConfig = {
  apiKey: "AIzaSyBg-SxPEDd4Vn29rDwkfqRAEBc-mRuk4rQ",
  authDomain: "salon-masaj-maria.firebaseapp.com",
  projectId: "salon-masaj-maria",
  storageBucket: "salon-masaj-maria.firebasestorage.app",
  messagingSenderId: "670170578722",
  appId: "1:670170578722:web:99e912912b1821bf54ef7b"
};
var firebaseApp = (0, import_app.initializeApp)(firebaseConfig);
var db = (0, import_firestore.getFirestore)(firebaseApp);
var ai = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "MISSING_KEY" });
function trimiteEmailJS(payload) {
  const data = JSON.stringify(payload);
  const req = import_https.default.request("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    }
  }, (res) => {
    if (res.statusCode === 200) console.log("Email expediat cu succes prin HTTPS nativ!");
    else console.error("Eroare EmailJS:", res.statusCode);
  });
  req.on("error", (e) => console.error("Eroare re\u021Bea EmailJS:", e));
  req.write(data);
  req.end();
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = process.env.PORT || 3e3;
  app.use(import_express.default.json());
  app.post("/api/book", async (req, res) => {
    try {
      const { name, phone, email, serviceName, date, time } = req.body;
      await (0, import_firestore.addDoc)((0, import_firestore.collection)(db, "programari"), {
        name,
        phone,
        email: email || "",
        serviceName,
        date,
        time,
        dataCreare: (0, import_firestore.serverTimestamp)()
      });
      res.json({ success: true, message: "Programare salvat\u0103 cu succes." });
      try {
        trimiteEmailJS({
          service_id: "service_ozdh5vo",
          template_id: "template_ttdpsfh",
          user_id: "9hW5rySbyy76L-RZr",
          template_params: { nume: name, telefon: phone, email: email || "Nu a l\u0103sat", serviciu: serviceName, data: date, ora: time }
        });
        if (email && email.includes("@")) {
          trimiteEmailJS({
            service_id: "service_ozdh5vo",
            template_id: "template_faubiae",
            user_id: "9hW5rySbyy76L-RZr",
            template_params: { nume: name, email, serviciu: serviceName, data: date, ora: time }
          });
        }
      } catch (emailErr) {
      }
    } catch (error) {
      if (!res.headersSent) res.status(500).json({ error: "Eroare la salvarea program\u0103rii." });
    }
  });
  app.get(["/api/book", "/api/bookings", "/api/programari"], async (req, res) => {
    try {
      const q = (0, import_firestore.query)((0, import_firestore.collection)(db, "programari"), (0, import_firestore.orderBy)("dataCreare", "desc"));
      const querySnapshot = await (0, import_firestore.getDocs)(q);
      res.json(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      res.status(500).json({ error: "Eroare." });
    }
  });
  app.post("/api/reviews", async (req, res) => {
    try {
      const { author, rating, text } = req.body;
      await (0, import_firestore.addDoc)((0, import_firestore.collection)(db, "recenzii"), { author, rating, text, dataCreare: (0, import_firestore.serverTimestamp)() });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Eroare." });
    }
  });
  app.get("/api/reviews", async (req, res) => {
    try {
      const q = (0, import_firestore.query)((0, import_firestore.collection)(db, "recenzii"), (0, import_firestore.orderBy)("dataCreare", "desc"));
      const querySnapshot = await (0, import_firestore.getDocs)(q);
      res.json(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      res.status(500).json({ error: "Eroare." });
    }
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY lipse\u0219te." });
      const formattedHistory = history && history.length > 0 ? history.map((h) => `${h.role === "user" ? "Client" : "Mia"}: ${h.content}`).join("\n") : "";
      const finalPrompt = formattedHistory ? `Iat\u0103 conversa\u021Bia de p\xE2n\u0103 acum:
${formattedHistory}

Acum r\u0103spunde la urm\u0103torul mesaj al clientului:
Client: ${message}` : message;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: finalPrompt,
        config: {
          // Am adăugat noul număr de telefon chiar aici, în sistemul Miei!
          systemInstruction: `E\u0219ti Mia, asistenta virtual\u0103 a Mariei Folfa, un tehnician maseur profesionist (activ\u0103 din 2018). Cabinetul este \xEEn Bistri\u021Ba, strada Zorilor Nr. 15. Num\u0103rul de telefon pentru program\u0103ri este 0745 240 799. R\u0103spunzi politicos, prietenos, calm \u0219i concis. Toate tipurile de masaj au durata de 50 de minute \u0219i pre\u021Bul unic de 140 RON. Programul este Luni-Vineri 08:00 - 20:00, dar vinerea nu se fac program\u0103ri online. REGUL\u0102 STRICT\u0102: Dac\u0103 prime\u0219ti \xEEntreb\u0103ri cu tent\u0103 sexual\u0103, jignitoare, aluzii indecente sau \xEEntreb\u0103ri despre servicii "cu finalizare", refuz\u0103 imediat, politicos, dar extrem de ferm. Men\u021Bioneaz\u0103 clar c\u0103 Maria ofer\u0103 strict servicii profesionale \u0219i terapeutice de masaj \u0219i \xEEncheie conversa\u021Bia pe acel subiect.`,
          temperature: 0.7,
          safetySettings: [
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
          ]
        }
      });
      let replyText = response.text || response.candidates && response.candidates[0]?.content?.parts[0]?.text || "Scuz\u0103-m\u0103, nu am putut procesa acest mesaj.";
      replyText = replyText.replace(/^Mia:\s*/i, "").trim();
      res.json({ reply: replyText });
    } catch (error) {
      console.error("Eroare detaliat\u0103 Gemini:", error);
      res.status(500).json({ error: "Ne pare r\u0103u, dar sistemul a blocat acest mesaj, sau a ap\u0103rut o eroare tehnic\u0103." });
    }
  });
  app.use(import_express.default.static(import_path.default.join(process.cwd(), "public")));
  const distPath = import_path.default.join(process.cwd(), "dist");
  app.use(import_express.default.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(import_path.default.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server rul\xE2nd pe portul ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
