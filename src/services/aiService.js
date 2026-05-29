// src/services/aiService.js
// Semua komunikasi dengan Replicate API.
// Prompt diambil dari aiPrompts.js — jangan hardcode prompt di sini.

import {
  getTransactionParserPrompt,
  INSIGHT_SYSTEM_PROMPT,
  buildMonthlyInsightPrompt,
  buildWeeklyInsightPrompt,
  buildBudgetInsightPrompt,
  buildSavingsInsightPrompt,
  QA_SYSTEM_PROMPT,
  buildQAPrompt,
  getReceiptParserPrompt,
  REMINDER_SYSTEM_PROMPT,
  buildReminderPrompt,
} from "../utils/aiPrompts";


// Pakai proxy Vite di dev agar tidak kena CORS, langsung ke Replicate di production
const REPLICATE_BASE =
  import.meta.env.DEV
    ? "/api/replicate"
    : "/.netlify/functions/replicate";

// ─── Core: call Replicate ─────────────────────────────────────────────────────

const callReplicate = async (prompt, systemPrompt, maxTokens = 300) => {
  const res = await fetch(`${REPLICATE_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // ← Tidak perlu Authorization header lagi, token ada di server
    body: JSON.stringify({
      version: "5a6809ca6288247d06daf6365557e5e429063f32a21146b2a807c682652136b8",
      input: {
        prompt,
        system_prompt: systemPrompt,
        max_new_tokens: maxTokens,
        temperature: 0.3,
        top_p: 0.9,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Replicate error: ${err.error || res.statusText}`);
  }

  const data = await res.json();
  return data.output || "";
};

const pollPrediction = async (predictionId) => {
  const MAX = 30;
  for (let i = 0; i < MAX; i++) {
    await sleep(1000);

    const res = await fetch(
      `${REPLICATE_BASE}/predictions/${predictionId}`,
      { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } }
    );

    const data = await res.json();

    if (data.status === "succeeded") {
      return Array.isArray(data.output) ? data.output.join("") : data.output || "";
    }

    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Prediction ${data.status}: ${data.error || ""}`);
    }
  }

  throw new Error("Replicate timeout setelah 30 detik.");
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Public API ───────────────────────────────────────────────────────────────

export const parseTransactionText = async (userText, accounts = [], categories = []) => {
  const { system, user } = getTransactionParserPrompt(accounts, categories);
  const result = await callReplicate(user(userText), system, 150);
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.warn("AI parse JSON failed:", result);
    return null;
  }
};

export const generateInsight = async (summaryData, type = "monthly") => {
  const promptBuilders = {
    monthly: buildMonthlyInsightPrompt,
    weekly: buildWeeklyInsightPrompt,
    budget: buildBudgetInsightPrompt,
    savings: buildSavingsInsightPrompt,
  };
  const buildPrompt = promptBuilders[type] || buildMonthlyInsightPrompt;
  const prompt = buildPrompt(summaryData);
  return await callReplicate(prompt, INSIGHT_SYSTEM_PROMPT, 200);
};

export const answerFinanceQuestion = async (question, context, chatHistory = []) => {
  const prompt = buildQAPrompt(question, context, chatHistory);
  return await callReplicate(prompt, QA_SYSTEM_PROMPT, 300);
};

export const parseReceiptText = async (receiptText, accounts = [], categories = []) => {
  const { system, user } = getReceiptParserPrompt(accounts, categories);
  const result = await callReplicate(user(receiptText), system, 400);
  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.warn("Receipt parse JSON failed:", result);
    return null;
  }
};

export const generateReminder = async (reminderData) => {
  const prompt = buildReminderPrompt(reminderData);
  return await callReplicate(prompt, REMINDER_SYSTEM_PROMPT, 100);
};