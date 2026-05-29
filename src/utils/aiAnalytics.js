// src/utils/aiAnalytics.js
// Semua kalkulasi data dilakukan di sini (JS murni), AI hanya narasi.
// PENTING: Jangan serahkan kalkulasi ke AI → boros token & tidak akurat.

import { getUserTransactions } from "../firebase/transactions";
import { getUserAccounts } from "../firebase/accounts";
import { getUserBudgets } from "../firebase/budget";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};

const getWeekRange = (date = new Date()) => {
  const day = date.getDay(); // 0 = minggu
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // senin
  const start = new Date(date.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val.toDate) return val.toDate(); // Firestore Timestamp
  return new Date(val);
};

const isInRange = (transaction, start, end) => {
  const date = toDate(transaction.date || transaction.createdAt);
  if (!date) return false;
  return date >= start && date <= end;
};

// ─── Monthly Summary ─────────────────────────────────────────────────────────

export const getMonthlyInsightData = async () => {
  const { start, end } = getMonthRange();
  const transactions = await getUserTransactions(500);
  const budgets = await getUserBudgets();

  const monthTx = transactions.filter((t) => isInRange(t, start, end));

  // Income & expense
  const income = monthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const expense = monthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Category breakdown
  const categoryMap = {};
  monthTx
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = t.category || "Lainnya";
      categoryMap[cat] = (categoryMap[cat] || 0) + (t.amount || 0);
    });

  const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0]?.[0] || null;
  const topAmount = sortedCategories[0]?.[1] || 0;

  // Budget usage
  const now = new Date();
  const activeBudgets = budgets.filter((b) => {
    const s = toDate(b.periodStart);
    const e = toDate(b.periodEnd);
    return s && e && now >= s && now <= e;
  });

  const budgetUsedPercent = activeBudgets.length
    ? Math.round(
        activeBudgets.reduce((sum, b) => {
          const used = monthTx
            .filter((t) => t.category === b.category && t.type === "expense")
            .reduce((s, t) => s + (t.amount || 0), 0);
          return sum + (used / b.amount) * 100;
        }, 0) / activeBudgets.length
      )
    : 0;

  return {
    income,
    expense,
    balance: income - expense,
    topCategory,
    topAmount,
    categoryBreakdown: sortedCategories.slice(0, 5),
    budgetUsedPercent,
    transactionCount: monthTx.length,
  };
};

// ─── Weekly Summary ──────────────────────────────────────────────────────────

export const getWeeklyInsightData = async () => {
  const { start, end } = getWeekRange();
  const transactions = await getUserTransactions(200);

  const weekTx = transactions.filter((t) => isInRange(t, start, end));
  const expense = weekTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const dailyExpense = {};
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  weekTx
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const d = toDate(t.date || t.createdAt);
      if (d) {
        const dayName = days[d.getDay()];
        dailyExpense[dayName] = (dailyExpense[dayName] || 0) + (t.amount || 0);
      }
    });

  const busiestDay = Object.entries(dailyExpense).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const dayCount = Object.keys(dailyExpense).length || 1;

  return {
    expense,
    dailyAvg: Math.round(expense / dayCount),
    busiestDay,
    dailyExpense,
    transactionCount: weekTx.length,
  };
};

// ─── Budget Status ────────────────────────────────────────────────────────────

export const getBudgetInsightData = async () => {
  const { start, end } = getMonthRange();
  const transactions = await getUserTransactions(500);
  const budgets = await getUserBudgets();

  const now = new Date();
  const monthTx = transactions.filter((t) => isInRange(t, start, end));

  const activeBudgets = budgets
    .filter((b) => {
      const s = toDate(b.periodStart);
      const e = toDate(b.periodEnd);
      return s && e && now >= s && now <= e;
    })
    .map((b) => {
      const used = monthTx
        .filter((t) => t.category === b.category && t.type === "expense")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const percent = Math.round((used / b.amount) * 100);
      return {
        category: b.category,
        limit: b.amount,
        used,
        remaining: b.amount - used,
        percent,
        isOver: used > b.amount,
      };
    });

  return {
    budgets: activeBudgets,
    overBudgetCount: activeBudgets.filter((b) => b.isOver).length,
    safeBudgetCount: activeBudgets.filter((b) => b.percent <= 80).length,
  };
};

// ─── Q&A Context Builder ─────────────────────────────────────────────────────
// Bangun context minimal sesuai pertanyaan user (hemat token)

// Nama bulan Indonesia → angka (0-indexed)
const BULAN_MAP = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
};

// Deteksi bulan spesifik dari teks pertanyaan
// Contoh: "april 2026" → { year: 2026, month: 3 }
const detectMonthFromQuestion = (lowerQ) => {
  for (const [nama, idx] of Object.entries(BULAN_MAP)) {
    if (lowerQ.includes(nama)) {
      const yearMatch = lowerQ.match(/20\d{2}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
      return { year, month: idx };
    }
  }
  return null;
};

const summarizeTx = (txList) => {
  const income = txList.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const expense = txList.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  return { income, expense, balance: income - expense };
};

const categoryBreakdown = (txList) => {
  const catMap = {};
  txList
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      catMap[t.category || "Lainnya"] = (catMap[t.category || "Lainnya"] || 0) + (t.amount || 0);
    });
  return Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amount]) => ({ cat, amount }));
};

export const buildQAContext = async (question) => {
  const lowerQ = question.toLowerCase();
  const transactions = await getUserTransactions(500);

  // Deteksi intent
  const wantsBudget = /budget|anggaran|limit/.test(lowerQ);
  const wantsCategory = /kategori|makan|transport|boros|beli|pengeluaran|laporan/.test(lowerQ);
  const wantsBalance = /saldo|sisa|punya|berapa|uang/.test(lowerQ);
  const wantsLastMonth = /bulan lalu|kemarin|sebelumnya/.test(lowerQ);
  const specificMonth = detectMonthFromQuestion(lowerQ);

  const context = {};
  const now = new Date();

  // ── Bulan ini (selalu disertakan) ──
  const { start: s0, end: e0 } = getMonthRange(now);
  const thisTx = transactions.filter((t) => isInRange(t, s0, e0));
  context.bulanIni = summarizeTx(thisTx);
  if (wantsCategory) context.kategoriBulanIni = categoryBreakdown(thisTx);

  // ── Bulan lalu ──
  if (wantsLastMonth) {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const { start: s1, end: e1 } = getMonthRange(lastMonth);
    const lastTx = transactions.filter((t) => isInRange(t, s1, e1));
    context.bulanLalu = summarizeTx(lastTx);
    context.kategoriBulanLalu = categoryBreakdown(lastTx);
    context.labelBulanLalu = lastMonth.toLocaleString("id-ID", { month: "long", year: "numeric" });
  }

  // ── Bulan spesifik (misal "april 2026") ──
  if (specificMonth) {
    const targetDate = new Date(specificMonth.year, specificMonth.month, 1);
    const { start: ss, end: se } = getMonthRange(targetDate);
    const specificTx = transactions.filter((t) => isInRange(t, ss, se));
    const label = targetDate.toLocaleString("id-ID", { month: "long", year: "numeric" });

    context.bulanSpesifik = {
      label,
      ...summarizeTx(specificTx),
      transactionCount: specificTx.length,
    };
    context.kategoriBulanSpesifik = categoryBreakdown(specificTx);

    // Kalau data kosong, tandai supaya AI tau
    if (specificTx.length === 0) {
      context.bulanSpesifik.kosong = true;
    }
  }

  // ── Budget ──
  if (wantsBudget) {
    const budgetData = await getBudgetInsightData();
    context.budget = budgetData.budgets;
  }

  // ── Saldo akun ──
  if (wantsBalance || lowerQ.includes("akun") || lowerQ.includes("rekening")) {
    const accounts = await getUserAccounts();
    context.akun = accounts.map((a) => ({ nama: a.name, saldo: a.balance }));
  }

  return context;
};

// ─── Reminder Checker ─────────────────────────────────────────────────────────

export const checkReminders = async () => {
  const reminders = [];
  const budgetData = await getBudgetInsightData();
  const { start, end } = getMonthRange();
  const transactions = await getUserTransactions(200);
  const monthTx = transactions.filter((t) => isInRange(t, start, end));

  // Budget hampir habis (>80%)
  budgetData.budgets
    .filter((b) => b.percent >= 80 && !b.isOver)
    .forEach((b) => {
      reminders.push({
        type: "budget_warning",
        message: `Budget ${b.category} sudah ${b.percent}% terpakai`,
        severity: "warning",
      });
    });

  // Budget sudah over
  budgetData.budgets
    .filter((b) => b.isOver)
    .forEach((b) => {
      reminders.push({
        type: "budget_over",
        message: `Budget ${b.category} sudah melebihi limit!`,
        severity: "danger",
      });
    });

  // Tidak ada pemasukan bulan ini
  const hasIncome = monthTx.some((t) => t.type === "income");
  if (!hasIncome) {
    reminders.push({
      type: "no_income",
      message: "Belum ada pemasukan bulan ini yang tercatat",
      severity: "info",
    });
  }

  return reminders;
};