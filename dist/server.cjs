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
var import_nodemailer = __toESM(require("nodemailer"), 1);
import_dotenv.default.config();
var ai = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "MISSING_KEY" });
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/book", async (req, res) => {
    try {
      const { name, phone, email, serviceName, date, time } = req.body;
      try {
        const transporter = import_nodemailer.default.createTransport({
          service: "gmail",
          auth: {
            user: "terapeutmaria@gmail.com",
            pass: process.env.EMAIL_APP_PASSWORD || "qsrg zqii khgx bfyk"
          }
        });
        const mailOptionsAdmin = {
          from: "terapeutmaria@gmail.com",
          to: "terapeutmaria@gmail.com",
          subject: `NOU\u0102 PROGRAMARE: ${name} - ${serviceName}`,
          text: `Ai primit o nou\u0103 programare!

Detalii client:
Nume: ${name}
Telefon: ${phone}
Email: ${email}

Detalii serviciu:
Serviciu: ${serviceName}
Data: ${date}
Ora: ${time}

Programarea a fost salvat\u0103 \xEEn baza de date.`
        };
        const mailOptionsClient = email ? {
          from: "terapeutmaria@gmail.com",
          to: email,
          subject: `Confirmare Programare - Cabinet Masaj Terapeutic Maria Folfa`,
          text: `Bun\u0103 ${name},

\xCE\u021Bi mul\u021Bumesc pentru \xEEncredere! Programarea ta a fost \xEEnregistrat\u0103 \u0219i confirmat\u0103 cu succes.

Detalii Programare:
Serviciu: ${serviceName}
Data: ${date}
Ora: ${time}

Loca\u021Bie: Loc. \u0218an\u021B, str. Principal\u0103 nr. 931, jud. Bistri\u021Ba-N\u0103s\u0103ud.

Te a\u0219tept cu drag la o sesiune de relaxare \u0219i echilibru. Dac\u0103 intervin modific\u0103ri, te rog s\u0103 m\u0103 anun\u021Bi \xEEn prealabil.

Cu prietenie,
Maria Folfa - Tehnician Maseur`
        } : null;
        if (process.env.EMAIL_APP_PASSWORD || true) {
          transporter.sendMail(mailOptionsAdmin).catch((err) => console.error("Eroare admin email:", err));
          if (mailOptionsClient) {
            transporter.sendMail(mailOptionsClient).catch((err) => console.error("Eroare client email:", err));
          }
        }
      } catch (emailErr) {
        console.error("Eroare initializare email:", emailErr);
      }
      console.log(`[Google Calendar] Solicitare de blocare pentru: ${date} ora ${time}`);
      res.json({ success: true, message: "Procesat cu succes." });
    } catch (error) {
      console.error("Eroare backend book API:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Eroare intern\u0103 la procesare." });
      }
    }
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        return res.status(500).json({ error: "GEMINI_API_KEY lipse\u0219te. Te rog s\u0103 configurezi cheia \xEEn set\u0103rile aplica\u021Biei." });
      }
      const systemInstruction = `E\u0219ti Mia, asistenta virtual\u0103 a Mariei Folfa, un tehnician maseur profesionist (activ\u0103 din 2018). Cabinetul este \xEEn Localitatea \u0218an\u021B, strada Principal\u0103, nr 931, jud. Bistri\u021Ba-N\u0103s\u0103ud. R\u0103spunzi politicos, prietenos, calm \u0219i concis la \xEEntreb\u0103ri despre masaje, beneficii \u0219i loca\u021Bie. E\u0219ti cald\u0103, empatic\u0103 \u0219i folose\u0219ti un ton relaxant (po\u021Bi folosi emoji-uri potrivite precum \u{1F338}, \u2728, \u{1F33F}). Oferi doar informa\u021Bii legate de serviciile noastre. Direc\u021Bionezi clientul s\u0103 se programeze online apasand butonul din pagina. Nu inventa pre\u021Buri dac\u0103 nu e\u0219ti sigur\u0103, spune-i clientului s\u0103 verifice sec\u021Biunea de servicii.`;
      const context = history && history.length > 0 ? "Istoric conversa\u021Bie:\n" + history.map((h) => `${h.role}: ${h.content}`).join("\n") + "\n\nMesaj nou: " : "";
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: context + message,
        config: {
          systemInstruction
        }
      });
      res.json({ reply: response.text });
    } catch (error) {
      console.error("Eroare Gemini:", error);
      res.status(500).json({ error: "Eroare la procesarea cererii c\u0103tre AI: " + (error.message || String(error)) });
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
