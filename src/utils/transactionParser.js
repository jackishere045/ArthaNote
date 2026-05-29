// src/utils/transactionParser.js
// Post-process hasil parsing AI: validasi, mapping, normalisasi
// Business logic tetap di sini, bukan di AI

import { getUserAccounts } from "../firebase/accounts";
import { getUserBudgets } from "../firebase/budget";

// Kategori yang didukung (sinkronkan dengan categories.js kamu)
export const SUPPORTED_CATEGORIES = [
  "Makanan",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Tagihan",
  "Gaji",
  "Investasi",
  "Tabungan",
  "nongki",
  "Lainnya",
];

// Alias populer untuk fuzzy matching kategori
const CATEGORY_ALIASES = {
  makan: "Makanan",
  makanan: "Makanan",
  kopi: "Makanan",
  minum: "Makanan",
  resto: "Makanan",
  restoran: "Makanan",
  "warung": "Makanan",
  bensin: "Transportasi",
  ojek: "Transportasi",
  grab: "Transportasi",
  gojek: "Transportasi",
  parkir: "Transportasi",
  tol: "Transportasi",
  belanja: "Belanja",
  beli: "Belanja",
  shopee: "Belanja",
  tokopedia: "Belanja",
  nongki: "nongki",
  cafe: "nongki",
  ngopi: "nongki",
  hiburan: "Hiburan",
  netflix: "Hiburan",
  spotify: "Hiburan",
  game: "Hiburan",
  listrik: "Tagihan",
  air: "Tagihan",
  internet: "Tagihan",
  pulsa: "Tagihan",
  gaji: "Gaji",
  salary: "Gaji",
  transfer: "Gaji",
  freelance: "Gaji",
};

// Alias untuk nama akun (fuzzy match ke nama akun user)
const ACCOUNT_ALIASES = {
  dana: "dana",
  seabank: "seabank",
  sea: "seabank",
  bri: "bri",
  bca: "bca",
  mandiri: "mandiri",
  ovo: "ovo",
  gopay: "gopay",
  "dompet": "dompet",
  cash: "dompet",
  tunai: "dompet",
  wallet: "dompet",
};

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Validasi dan normalisasi hasil parsing AI
 * @param {object} aiResult - raw output dari AI (JSON)
 * @returns {object} { isValid, data, errors, warnings }
 */
export const validateAndNormalize = async (aiResult, originalText = "") => {
  const errors = [];
  const warnings = [];

  if (!aiResult) {
    return { isValid: false, errors: ["AI tidak bisa memparse input"], data: null };
  }

  const data = { ...aiResult };

  // ── 1. Validasi type ────────────────────────────────────────────────────────
  if (!["income", "expense"].includes(data.type)) {
    if (data.type === "savings") {
      warnings.push("Transaksi tabungan sebaiknya dikelola dari halaman Tabungan");
    } else {
      errors.push("Jenis transaksi tidak dikenali (harus income atau expense)");
    }
  }

  // ── 2. Validasi amount ──────────────────────────────────────────────────────
  // AI sering salah parse angka (misal 10.000 → 100000)
  // Kalau ada teks asli user, ekstrak amount dari sana sebagai ground truth
  let amount = parseAmount(data.amount);

  if (originalText) {
    const amountFromText = parseAmountFromText(originalText);
    if (amountFromText && amount) {
      // Kalau beda lebih dari 10x → AI hampir pasti salah, pakai dari teks
      const ratio = Math.max(amount, amountFromText) / Math.min(amount, amountFromText);
      if (ratio >= 10) {
        amount = amountFromText;
      }
    } else if (amountFromText && !amount) {
      // AI tidak dapat amount sama sekali, fallback ke teks
      amount = amountFromText;
    }
  }

  if (!amount || amount <= 0) {
    errors.push("Nominal tidak valid");
  } else {
    data.amount = amount;
  }

  // ── 3. Map kategori ─────────────────────────────────────────────────────────
  if (data.category) {
    data.category = mapCategory(data.category);
  } else {
    data.category = "Lainnya";
    warnings.push("Kategori tidak terdeteksi, set ke Lainnya");
  }

  // ── 4. Map akun ke accountId ─────────────────────────────────────────────────
  if (data.accountId || data.account) {
    const accounts = await getUserAccounts();
    const mapped = mapAccountId(data.accountId || data.account, accounts);
    if (mapped) {
      data.accountId = mapped.id;
      data.accountName = mapped.name;
    } else {
      data.accountId = null;
      warnings.push("Akun tidak ditemukan, perlu dipilih manual");
    }
  } else {
    data.accountId = null;
    warnings.push("Akun tidak disebutkan, perlu dipilih manual");
  }

  // ── 5. Note default ─────────────────────────────────────────────────────────
  if (!data.note) {
    data.note = "";
  }

  // ── 6. Date ──────────────────────────────────────────────────────────────────
  data.date = new Date(); // default sekarang

  return {
    isValid: errors.length === 0,
    data,
    errors,
    warnings,
  };
};

/**
 * Parse jumlah uang dari berbagai format:
 * "20rb" → 20000, "1jt" → 1000000, "50.000" → 50000
 */
export const parseAmount = (rawAmount) => {
  if (!rawAmount && rawAmount !== 0) return null;

  // Kalau sudah number, langsung return
  if (typeof rawAmount === "number") return rawAmount > 0 ? rawAmount : null;

  const str = String(rawAmount).toLowerCase().replace(/\s/g, "");

  // Handle singkatan: 20rb, 20ribu, 20k
  if (/\d+(rb|ribu|k)$/.test(str)) {
    const num = parseFloat(str.replace(/(rb|ribu|k)$/, ""));
    return isNaN(num) ? null : num * 1000;
  }
  // Handle singkatan: 1jt, 1.5jt, 1juta
  if (/\d+(jt|juta)$/.test(str)) {
    const num = parseFloat(str.replace(/(jt|juta)$/, ""));
    return isNaN(num) ? null : num * 1_000_000;
  }

  // Handle format dengan titik ribuan Indonesia: "10.000", "1.500.000"
  // Bedakan: "10.000" (titik ribuan) vs "10.5" (desimal)
  // Heuristik: kalau semua grup setelah titik = 3 digit → titik ribuan
  if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    // Format ribuan Indonesia murni: 10.000 / 1.500.000
    return parseInt(str.replace(/\./g, ""), 10);
  }
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(str)) {
    // 10.000,50 → 10000.50
    return parseFloat(str.replace(/\./g, "").replace(",", "."));
  }

  // Angka biasa tanpa pemisah: "10000", "500"
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }

  // Desimal biasa: "10.5", "100.00"
  const cleaned = str.replace(/,/g, ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Parse amount langsung dari teks natural user (fallback jika AI salah)
 * Contoh: "beli kuaci 10000" → 10000, "jajan 20rb" → 20000
 */
export const parseAmountFromText = (text) => {
  const str = text.toLowerCase().replace(/\s/g, "");

  // Cari pola: angka + satuan (urutan penting: cek satuan dulu)
  const patterns = [
    // Dengan satuan juta/jt
    { re: /(\d+[.,]?\d*)(juta|jt)/, mul: 1_000_000 },
    // Dengan satuan ribu/rb/k
    { re: /(\d+[.,]?\d*)(ribu|rb|k)/, mul: 1_000 },
    // Format ribuan Indonesia multi-titik: 1.500.000
    { re: /(\d{1,3}(?:[.,]\d{3}){2,})/, mul: 1 },
    // Format ribuan Indonesia satu titik: 10.000 atau 10,000
    { re: /(\d{1,3}[.,]\d{3})(?![\d])/, mul: 1 },
    // Angka biasa 4+ digit: 25000
    { re: /(\d{4,})/, mul: 1 },
  ];

  for (const { re, mul } of patterns) {
    const match = str.match(re);
    if (match) {
      const raw = match[1].replace(/[.,]/g, "");
      const num = parseFloat(raw);
      if (!isNaN(num)) return num * mul;
    }
  }
  return null;
};

/**
 * Map nama kategori (fuzzy) ke kategori yang valid
 */
const mapCategory = (rawCategory) => {
  if (!rawCategory) return "Lainnya";
  const lower = rawCategory.toLowerCase().trim();

  // Exact match
  const exactMatch = SUPPORTED_CATEGORIES.find(
    (c) => c.toLowerCase() === lower
  );
  if (exactMatch) return exactMatch;

  // Alias match
  for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
    if (lower.includes(alias)) return category;
  }

  return "Lainnya";
};

/**
 * Map nama akun (string dari AI) ke accountId dari Firestore
 */
const mapAccountId = (rawAccount, accounts) => {
  if (!rawAccount || !accounts?.length) return null;
  const lower = String(rawAccount).toLowerCase().trim();

  // Coba match langsung dengan nama akun user
  const directMatch = accounts.find(
    (a) => a.name?.toLowerCase() === lower || a.id === rawAccount
  );
  if (directMatch) return directMatch;

  // Fuzzy match via alias
  for (const [alias, keyword] of Object.entries(ACCOUNT_ALIASES)) {
    if (lower.includes(alias)) {
      const matched = accounts.find((a) => a.name?.toLowerCase().includes(keyword));
      if (matched) return matched;
    }
  }

  // Partial name match
  const partialMatch = accounts.find((a) =>
    a.name?.toLowerCase().includes(lower) || lower.includes(a.name?.toLowerCase())
  );
  return partialMatch || null;
};

// ─── Budget checker ───────────────────────────────────────────────────────────

/**
 * Cek apakah transaksi ini terkait dengan budget yang aktif
 * @returns {object|null} budget yang relevan atau null
 */
export const findRelevantBudget = async (category) => {
  if (!category) return null;
  const budgets = await getUserBudgets();
  const now = new Date();

  return budgets.find((b) => {
    const start = b.periodStart?.toDate?.() || new Date(b.periodStart);
    const end = b.periodEnd?.toDate?.() || new Date(b.periodEnd);
    return b.category === category && now >= start && now <= end && !b.isArchived;
  }) || null;
};

// ─── Format helpers ───────────────────────────────────────────────────────────

export const formatCurrency = (amount) =>
  `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;

export const formatTransactionSummary = (data) => {
  const typeLabel = data.type === "income" ? "Pemasukan" : "Pengeluaran";
  return `${typeLabel} ${formatCurrency(data.amount)} untuk ${data.category}${data.accountName ? ` dari ${data.accountName}` : ""}`;
};