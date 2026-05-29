// src/hooks/useAI.js
// Custom hook untuk semua AI state & logic
// Komponen hanya panggil hook ini, bukan service langsung

import { useState, useCallback, useRef } from "react";
import {
  parseTransactionText,
  generateInsight,
  answerFinanceQuestion,
} from "../services/aiService";
import {
  getMonthlyInsightData,
  getWeeklyInsightData,
  getBudgetInsightData,
  buildQAContext,
  checkReminders,
} from "../utils/aiAnalytics";
import {
  validateAndNormalize,
  formatTransactionSummary,
} from "../utils/transactionParser";
import { getUserAccounts } from "../firebase/accounts";
import { SUPPORTED_CATEGORIES } from "../utils/transactionParser";
import { addTransaction } from "../firebase/transactions";

// ─── Types ────────────────────────────────────────────────────────────────────
// message: { id, role: "user"|"ai"|"system", content, type?, data?, timestamp }

const createMessage = (role, content, extra = {}) => ({
  id: Date.now() + Math.random(),
  role,
  content,
  timestamp: new Date(),
  ...extra,
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAI = () => {
  const [messages, setMessages] = useState([
    createMessage("ai", "Halo! Ada yang bisa dibantu soal keuangan kamu? 👋", {
      type: "greeting",
    }),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null); // transaksi tunggu konfirmasi
  const [reminders, setReminders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const cooldownRef = useRef(false);

  // ── Add message helper ───────────────────────────────────────────────────────
  const addMessage = useCallback((role, content, extra = {}) => {
    setMessages((prev) => [...prev, createMessage(role, content, extra)]);
  }, []);

  // ── Rate limiting ────────────────────────────────────────────────────────────
  const withCooldown = async (fn) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    try {
      await fn();
    } finally {
      setTimeout(() => {
        cooldownRef.current = false;
      }, 2000);
    }
  };

  // ── Send user message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (userInput) => {
      if (!userInput.trim() || isLoading) return;

      await withCooldown(async () => {
        addMessage("user", userInput);
        setIsLoading(true);

        try {
          // Cek apakah user konfirmasi/tolak transaksi pending
          if (pendingTransaction) {
            await handleTransactionConfirmation(userInput);
            return;
          }

          // Deteksi intent
          const intent = detectIntent(userInput);

          if (intent === "add_transaction") {
            await handleTransactionParsing(userInput);
          } else {
            await handleQA(userInput);
          }
        } catch (err) {
          addMessage("ai", "Aduh, ada error nih. Coba lagi ya? 🙏", {
            type: "error",
          });
          console.error("AI error:", err);
        } finally {
          setIsLoading(false);
        }
      });
    },
    [isLoading, pendingTransaction, messages]
  );

  // ── Quick Actions ────────────────────────────────────────────────────────────
  const handleQuickAction = useCallback(
    async (action) => {
      if (isLoading) return;

      await withCooldown(async () => {
        const labels = {
          monthly: "Analisa bulan ini",
          weekly: "Ringkas minggu ini",
          budget: "Budget saya aman?",
          add: "Tambah transaksi",
        };

        addMessage("user", labels[action] || action);
        setIsLoading(true);

        try {
          if (action === "add") {
            addMessage(
              "ai",
              "Oke, ketik transaksinya. Contoh:\n• \"beli kopi 20rb pake dana\"\n• \"gajian 3jt masuk BRI\"\n• \"bensin 50 ribu\"",
              { type: "prompt" }
            );
            return;
          }

          let summaryData;
          let insightType = action;

          if (action === "monthly") summaryData = await getMonthlyInsightData();
          else if (action === "weekly") summaryData = await getWeeklyInsightData();
          else if (action === "budget") {
            summaryData = await getBudgetInsightData();
            insightType = "budget";
          }

          const insight = await generateInsight(summaryData, insightType);
          addMessage("ai", insight, { type: "insight" });
        } catch (err) {
          addMessage("ai", "Gagal ambil data. Coba lagi ya 🙏");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      });
    },
    [isLoading]
  );

  // ── Transaction Parsing ───────────────────────────────────────────────────────
  const handleTransactionParsing = async (userInput) => {
    const accounts = await getUserAccounts();

    addMessage("ai", "Sebentar, aku parse dulu...", { type: "loading" });

    const aiResult = await parseTransactionText(
      userInput,
      accounts,
      SUPPORTED_CATEGORIES
    );

    const { isValid, data, errors, warnings } = await validateAndNormalize(aiResult, userInput);

    if (!isValid) {
      addMessage(
        "ai",
        `Hmm, ada yang kurang jelas nih:\n${errors.join("\n")}\n\nCoba ketik ulang dengan format:\n"[item] [nominal] pake [akun]"`,
        { type: "error" }
      );
      return;
    }

    // Ada warning → tanya ke user
    if (!data.accountId) {
      const accountList = accounts.map((a, i) => `${i + 1}. ${a.name}`).join("\n");
      setPendingTransaction({ ...data, needsAccount: true, accounts });
      addMessage(
        "ai",
        `Oke, ketemu nih:\n✅ ${formatTransactionSummary(data)}\n\nTapi akun belum jelas. Pilih akun:\n${accountList}\n\nKetik nomornya (contoh: "1")`,
        { type: "confirm_partial", data }
      );
      return;
    }

    // Semua lengkap → langsung simpan tanpa konfirmasi
    try {
      await addTransaction({
        type: data.type,
        amount: data.amount,
        category: data.category,
        account: data.accountId,
        accountName: data.accountName || "",
        note: data.note || "",
        date: new Date(),
      });
      setPendingTransaction(null);
      addMessage("ai", `✅ Tersimpan! ${formatTransactionSummary(data)}`, {
        type: "success",
      });
    } catch (err) {
      addMessage("ai", "Gagal nyimpen transaksi. Coba dari halaman Transaksi ya 🙏");
      console.error(err);
    }
  };

  // ── Konfirmasi transaksi pending ──────────────────────────────────────────────
  const handleTransactionConfirmation = async (userInput) => {
    const lower = userInput.toLowerCase().trim();

    // User pilih nomor akun
    if (pendingTransaction?.needsAccount) {
      const num = parseInt(lower);
      if (!isNaN(num) && pendingTransaction.accounts?.[num - 1]) {
        const chosen = pendingTransaction.accounts[num - 1];
        const updatedTx = {
          ...pendingTransaction,
          accountId: chosen.id,
          accountName: chosen.name,
          needsAccount: false,
          accounts: undefined,
        };
        // Langsung simpan tanpa konfirmasi ulang
        try {
          await addTransaction({
            type: updatedTx.type,
            amount: updatedTx.amount,
            category: updatedTx.category,
            account: updatedTx.accountId,
            accountName: updatedTx.accountName || "",
            note: updatedTx.note || "",
            date: new Date(),
          });
          setPendingTransaction(null);
          addMessage("ai", `✅ Tersimpan! ${formatTransactionSummary(updatedTx)}`, {
            type: "success",
          });
        } catch (err) {
          addMessage("ai", "Gagal nyimpen transaksi. Coba dari halaman Transaksi ya 🙏");
          console.error(err);
        }
        return;
      } else {
        addMessage("ai", "Nomor akun tidak valid. Coba ketik angkanya aja ya.");
        return;
      }
    }

    if (["ya", "yes", "iya", "ok", "oke", "benar", "bener", "save", "simpan"].includes(lower)) {
      // Simpan ke Firebase
      try {
        await addTransaction({
          type: pendingTransaction.type,
          amount: pendingTransaction.amount,
          category: pendingTransaction.category,
          account: pendingTransaction.accountId,
          accountName: pendingTransaction.accountName || "",
          note: pendingTransaction.note || "",
          date: new Date(),
        });

        addMessage("ai", `✅ Tersimpan! ${formatTransactionSummary(pendingTransaction)}`, {
          type: "success",
        });
        setPendingTransaction(null);
      } catch (err) {
        addMessage("ai", "Gagal nyimpen transaksi. Coba dari halaman Transaksi ya 🙏");
        console.error(err);
      }
    } else if (["batal", "tidak", "enggak", "no", "cancel"].includes(lower)) {
      setPendingTransaction(null);
      addMessage("ai", "Oke, dibatalkan. Ada yang lain? 😊");
    } else {
      addMessage("ai", "Ketik **ya** untuk simpan atau **batal** untuk batalkan ya.");
    }
  };

  // ── Q&A Handler ───────────────────────────────────────────────────────────────
  const handleQA = async (question) => {
    const context = await buildQAContext(question);
    const chatHistory = messages.slice(-6).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    const answer = await answerFinanceQuestion(question, context, chatHistory);
    addMessage("ai", answer, { type: "answer" });
  };

  // ── Load reminders ────────────────────────────────────────────────────────────
  const loadReminders = useCallback(async () => {
    try {
      const r = await checkReminders();
      setReminders(r);
    } catch (err) {
      console.error("Reminder check failed:", err);
    }
  }, []);

  // ── Clear chat ────────────────────────────────────────────────────────────────
  const clearChat = useCallback(() => {
    setMessages([
      createMessage("ai", "Chat dibersihkan. Ada yang bisa dibantu? 😊", { type: "greeting" }),
    ]);
    setPendingTransaction(null);
  }, []);

  return {
    messages,
    isLoading,
    pendingTransaction,
    reminders,
    isOpen,
    setIsOpen,
    sendMessage,
    handleQuickAction,
    loadReminders,
    clearChat,
  };
};

// ─── Intent Detection (rule-based, hemat token) ───────────────────────────────
const TRANSACTION_KEYWORDS = [
  "beli", "beli ", "bayar", "bayar ", "jajan", "makan", "minum",
  "isi", "bensin", "transfer", "kirim", "gajian", "gaji", "dapat",
  "masuk", "keluar", "habis", "pake", "pakai", "ribu", "rb", "juta", "jt",
  "pemasukan", "pengeluaran", "tambah transaksi",
];

const detectIntent = (text) => {
  const lower = text.toLowerCase();
  const isTransaction = TRANSACTION_KEYWORDS.some((kw) => lower.includes(kw));

  // Juga deteksi pola nominal (angka + satuan)
  const hasAmount = /\d+\s*(rb|ribu|k|jt|juta|000)/.test(lower);

  return isTransaction || hasAmount ? "add_transaction" : "qa";
};