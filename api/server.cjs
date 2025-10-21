// api/server.cjs
// Backend pronto para receber arquivo e chamar Gemini (ou simular se não estiver disponível)

const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
require("dotenv").config();

let genModule = null;
try {
  genModule = require("@google/generative-ai");
} catch (e) {
  console.warn("Pacote @google/generative-ai não encontrado no servidor. Gemini não poderá ser chamado diretamente aqui.");
}

const PORT = process.env.PORT || 5001;
const app = express();

// CORS: permitir acesso do front-end em 5173
app.use(cors({ origin: "http://localhost:5173" }));

// Middleware
app.use(fileUpload());
app.use(express.json({ limit: "10mb" }));

// Função para chamar Gemini
async function analyzeWithGemini(content, filename) {
  if (!genModule) throw new Error("SDK do Gemini não instalado no servidor.");
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não definido no .env");

  try {
    const GoogleGenerativeAI = genModule.GoogleGenerativeAI || genModule;
    const client = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

    if (typeof client.getGenerativeModel === "function") {
      const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(`
Analise o conteúdo abaixo (arquivo: ${filename}). Gere:
- Principais pontos
- Oportunidades comerciais
- Riscos/dúvidas
- 3 ações práticas para a equipe
Conteúdo:
${content.slice(0, 20000)}
      `);
      const response = await result.response;
      if (typeof response.text === "function") return await response.text();
      if (response.output_text) return response.output_text;
      return JSON.stringify(response);
    } else if (typeof client.generate === "function") {
      const res = await client.generate({ model: "gemini-1.5-flash", input: `Analise: ${content.slice(0, 20000)}` });
      if (res.output_text) return res.output_text;
      return JSON.stringify(res);
    } else {
      throw new Error("SDK instalado tem API inesperada. Veja a documentação do pacote.");
    }
  } catch (err) {
    console.error("Erro chamando Gemini:", err);
    throw err;
  }
}

// Endpoint de análise
app.post("/analyze", async (req, res) => {
  try {
    if (!req.files || !req.files.file) return res.status(400).json({ error: "Envie um arquivo no campo 'file'." });

    const f = req.files.file;
    let text = f.data.toString("utf8");

    let analysis;
    try {
      analysis = await analyzeWithGemini(text, f.name);
    } catch (err) {
      // fallback: simula análise se Gemini não estiver disponível
      analysis = `ANÁLISE SIMULADA (Gemini indisponível):\nErro ao usar Gemini: ${err.message}\n\nConteúdo recebido (preview):\n${text.slice(0, 2000)}`;
    }

    return res.json({ analysis });
  } catch (err) {
    console.error("Erro no /analyze:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

app.listen(PORT, () => console.log(`Servidor de IA rodando em http://localhost:${PORT}`));
