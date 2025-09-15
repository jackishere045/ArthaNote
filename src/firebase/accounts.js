// src/firebase/accounts.js
import { db, auth } from "./config";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

/* =========================
   🔹 Fungsi Baru (Untuk Savings Integration)
   ========================= */

// Update account balance dengan delta (positif = tambah, negatif = kurang)
export const updateAccountBalance = async (accountId, deltaAmount) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const accountRef = doc(db, "users", user.uid, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) throw new Error("Account not found");

    const currentBalance = accountSnap.data().balance || 0;
    const newBalance = currentBalance + deltaAmount;

    await updateDoc(accountRef, {
      balance: newBalance,
      updatedAt: serverTimestamp()
    });

    return newBalance;
  } catch (error) {
    console.error("Error updating account balance:", error);
    throw error;
  }
};

// Ambil 1 akun berdasarkan ID
export const getAccountById = async (accountId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const accountRef = doc(db, "users", user.uid, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) throw new Error("Account not found");

    return { id: accountSnap.id, ...accountSnap.data() };
  } catch (error) {
    console.error("Error fetching account:", error);
    throw error;
  }
};

// Cek apakah saldo akun cukup
export const checkAccountBalance = async (accountId, requiredAmount) => {
  try {
    const account = await getAccountById(accountId);
    return (account.balance || 0) >= requiredAmount;
  } catch (error) {
    console.error("Error checking account balance:", error);
    return false;
  }
};

/* =========================
   🔹 Fungsi Lama (Tetap Dipertahankan)
   ========================= */

// Get all accounts
export const getUserAccounts = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const accountsRef = collection(db, "users", user.uid, "accounts");
    const q = query(accountsRef, orderBy("createdAt", "asc"));

    const querySnapshot = await getDocs(q);
    const accounts = [];

    querySnapshot.forEach((doc) => {
      accounts.push({ id: doc.id, ...doc.data() });
    });

    return accounts;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
};

// Add account
export const addAccount = async (accountData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const accountsRef = collection(db, "users", user.uid, "accounts");
    const docRef = await addDoc(accountsRef, {
      ...accountData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { id: docRef.id, ...accountData };
  } catch (error) {
    console.error("Error adding account:", error);
    throw error;
  }
};

// Update account
export const updateAccount = async (accountId, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const accountRef = doc(db, "users", user.uid, "accounts", accountId);
    await updateDoc(accountRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });

    return { id: accountId, ...updatedData };
  } catch (error) {
    console.error("Error updating account:", error);
    throw error;
  }
};

// Delete account
export const deleteAccount = async (accountId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const accountRef = doc(db, "users", user.uid, "accounts", accountId);
    await deleteDoc(accountRef);

    return accountId;
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};

// Legacy adjust balance (tetap bisa dipakai)
export const adjustAccountBalance = async (accountId, amount, type) => {
  const deltaAmount = type === "income" ? amount : -amount;
  return await updateAccountBalance(accountId, deltaAmount);
};

// Summary akun
export const getAccountsSummary = async () => {
  try {
    const accounts = await getUserAccounts();
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalAccounts = accounts.length;

    const accountsByType = accounts.reduce((acc, a) => {
      const type = a.type || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return { totalBalance, totalAccounts, accountsByType, accounts };
  } catch (error) {
    console.error("Error calculating accounts summary:", error);
    throw error;
  }
};
