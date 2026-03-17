// scripts/models.mjs — LLM API callers with retry and rate limiting
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env if present
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const [key, ...vals] = line.split('=');
    if (key && !key.startsWith('#')) process.env[key.trim()] = vals.join('=').trim();
  }
}

export const DELAY_MS = 500; // Increase if hitting rate limits
const MAX_RETRIES = 3;

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        const wait = Math.pow(2, i + 1) * 1000;
        console.log(`  Rate limited. Waiting ${wait}ms...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

const MODELS = {
  claude: {
    name: "claude-sonnet-4-20250514",
    call: async (sys, prompt) => {
      const res = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: sys, messages: [{ role: "user", content: prompt }] }),
      });
      const d = await res.json();
      return d.content?.map(c => c.text || "").join("") || JSON.stringify(d);
    }
  },
  gpt4o: {
    name: "gpt-4o",
    call: async (sys, prompt) => {
      const res = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: "gpt-4o", max_tokens: 1000, messages: [{ role: "system", content: sys }, { role: "user", content: prompt }] }),
      });
      const d = await res.json();
      return d.choices?.[0]?.message?.content || JSON.stringify(d);
    }
  },
  gemini: {
    name: "gemini-2.0-flash",
    call: async (sys, prompt) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`;
      const res = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_instruction: { parts: [{ text: sys }] }, contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1000 } }),
      });
      const d = await res.json();
      return d.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(d);
    }
  },
};

export function getAvailableModels() {
  const available = [];
  if (process.env.ANTHROPIC_API_KEY) available.push("claude");
  if (process.env.OPENAI_API_KEY) available.push("gpt4o");
  if (process.env.GOOGLE_API_KEY) available.push("gemini");
  return available;
}

export async function callModel(modelKey, systemPrompt, userPrompt) {
  return MODELS[modelKey].call(systemPrompt, userPrompt);
}

export function getModelName(modelKey) {
  return MODELS[modelKey]?.name || modelKey;
}

export const SYSTEM_PROMPT = "You are a senior Google Ads strategist analyzing a multi-account portfolio. Answer based ONLY on the provided context. Be specific: cite exact numbers, campaign names, account names, and relationships. If the context does not contain enough information to answer fully, explicitly state what is missing.";
