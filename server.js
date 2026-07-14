// Movimientos MBC — backend intermediario
// Guarda la llave de Anthropic como variable de entorno (ANTHROPIC_API_KEY) y
// nunca la expone al navegador. El dashboard le habla a este servicio en vez
// de hablarle directo a la API de Anthropic.

import express from "express";
import cors from "cors";

const app = express();
app.use(cors()); // abierto para que cualquier persona con el link del dashboard pueda usarlo
app.use(express.json({ limit: "2mb" }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FOODOLOGY_MCP_URL = process.env.FOODOLOGY_MCP_URL || "https://foodology-redshift-mcp-gx27.onrender.com/mcp";
const FOODOLOGY_MCP_TOKEN = process.env.FOODOLOGY_MCP_TOKEN || ""; // solo si el MCP de Foodology exige autenticación propia

function buildMcpServers() {
  const server = { type: "url", url: FOODOLOGY_MCP_URL, name: "foodology-redshift" };
  if (FOODOLOGY_MCP_TOKEN) server.authorization_token = FOODOLOGY_MCP_TOKEN;
  return [server];
}

app.get("/", (req, res) => {
  res.json({ service: "Movimientos MBC backend", status: "activo", endpoints: ["GET /health", "POST /api/query"] });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, has_api_key: Boolean(ANTHROPIC_API_KEY) });
});

app.post("/api/query", async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "El servidor no tiene configurada la variable de entorno ANTHROPIC_API_KEY." });
    }
    const { system, prompt, maxTokens } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: "Falta el campo 'prompt' en la solicitud." });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "mcp-client-2025-04-04"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens || 1000,
        system: system || "",
        messages: [{ role: "user", content: prompt }],
        mcp_servers: buildMcpServers()
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({ error: data?.error?.message || "Error al llamar a la API de Anthropic." });
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    res.json({ text, stop_reason: data.stop_reason });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error inesperado en el servidor." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Movimientos MBC backend escuchando en el puerto ${PORT}`));
