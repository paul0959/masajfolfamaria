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
      console.log("Programare salvat\u0103 \xEEn Firebase!");
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
        console.error("Eroare la procesarea emailurilor:", emailErr);
      }
    } catch (error) {
      console.error("Eroare backend la programare:", error);
      if (!res.headersSent) res.status(500).json({ error: "Eroare la salvarea program\u0103rii." });
    }
  });
  app.get(["/api/book", "/api/bookings", "/api/programari"], async (req, res) => {
    try {
      const q = (0, import_firestore.query)((0, import_firestore.collection)(db, "programari"), (0, import_firestore.orderBy)("dataCreare", "desc"));
      const querySnapshot = await (0, import_firestore.getDocs)(q);
      res.json(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      res.status(500).json({ error: "Eroare la citirea program\u0103rilor." });
    }
  });
  app.post("/api/reviews", async (req, res) => {
    try {
      const { author, rating, text } = req.body;
      await (0, import_firestore.addDoc)((0, import_firestore.collection)(db, "recenzii"), { author, rating, text, dataCreare: (0, import_firestore.serverTimestamp)() });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Eroare la salvarea recenziei." });
    }
  });
  app.get("/api/reviews", async (req, res) => {
    try {
      const q = (0, import_firestore.query)((0, import_firestore.collection)(db, "recenzii"), (0, import_firestore.orderBy)("dataCreare", "desc"));
      const querySnapshot = await (0, import_firestore.getDocs)(q);
      res.json(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      res.status(500).json({ error: "Eroare la citirea recenziilor." });
    }
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY lipse\u0219te." });
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: (history && history.length > 0 ? "Istoric:\n" + history.map((h) => `${h.role}: ${h.content}`).join("\n") + "\n\n" : "") + message,
        config: { systemInstruction: `E\u0219ti Mia, asistenta virtual\u0103 a Mariei Folfa, un tehnician maseur profesionist (activ\u0103 din 2018). Cabinetul este \xEEn Bistri\u021Ba, strada Zorilor Nr. 15. R\u0103spunzi politicos, prietenos, calm \u0219i concis. Toate tipurile de masaj au durata de 50 de minute \u0219i pre\u021Bul unic de 140 RON.` }
      });
      res.json({ reply: response.text });
    } catch (error) {
      res.status(500).json({ error: "Eroare AI." });
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
