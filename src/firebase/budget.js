import { db, auth } from "./config";
import { Timestamp } from "firebase/firestore";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  query, 
  orderBy, 
  where,
  serverTimestamp,
  Timestamp  // ← INI JUGA
} from "firebase/firestore";

// Helper: Get current period
const getCurrentPeriod = () => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let periodStart, periodEnd;
  
  if (currentDay >= 20) {
    periodStart = new Date(currentYear, currentMonth, 20, 0, 0, 0, 0);
    periodEnd = new Date(currentYear, currentMonth + 1, 19, 23, 59, 59, 999);
  } else {
    periodStart = new Date(currentYear, currentMonth - 1, 20, 0, 0, 0, 0);
    periodEnd = new Date(currentYear, currentMonth, 19, 23, 59, 59, 999);
  }
  
  return {
    periodStart: Timestamp.fromDate(periodStart),
    periodEnd: Timestamp.fromDate(periodEnd)
  };
};

// ✅ Add new budget - SELALU BUAT BARU
export const addBudget = async (budgetData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetsRef = collection(db, "users", user.uid, "budgets");
    const { periodStart, periodEnd } = getCurrentPeriod();

    // TIDAK CEK DUPLIKAT LAGI - langsung buat baru
    const docRef = await addDoc(budgetsRef, {
      ...budgetData,
      periodStart,
      periodEnd,
      isArchived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { id: docRef.id, ...budgetData };
  } catch (error) {
    console.error("Error adding budget:", error);
    throw error;
  }
};

// ✅ Get ACTIVE budgets (periode sekarang + tidak archived)
export const getUserBudgets = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetsRef = collection(db, "users", user.uid, "budgets");
    const { periodStart, periodEnd } = getCurrentPeriod();
    
    // Query: isArchived = false DAN dalam periode aktif
    const q = query(
      budgetsRef,
      where("isArchived", "==", false),
      where("periodStart", "==", periodStart),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const budgets = [];
    
    querySnapshot.forEach((doc) => {
      budgets.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return budgets;
  } catch (error) {
    console.error("Error fetching budgets:", error);
    throw error;
  }
};

// ✅ Update budget - masih boleh update di periode yang sama
export const updateBudget = async (budgetId, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetRef = doc(db, "users", user.uid, "budgets", budgetId);
    const budgetDoc = await getDoc(budgetRef);
    
    if (!budgetDoc.exists()) {
      throw new Error("Budget not found");
    }

    // TIDAK CEK DUPLIKAT - user bebas edit
    await updateDoc(budgetRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });

    return { id: budgetId, ...updatedData };
  } catch (error) {
    console.error("Error updating budget:", error);
    throw error;
  }
};

// ✅ Delete budget → ARCHIVE, bukan hard delete
export const deleteBudget = async (budgetId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetRef = doc(db, "users", user.uid, "budgets", budgetId);
    const budgetDoc = await getDoc(budgetRef);
    
    if (!budgetDoc.exists()) {
      throw new Error("Budget not found");
    }

    // SOFT DELETE - set isArchived = true
    await updateDoc(budgetRef, {
      isArchived: true,
      updatedAt: serverTimestamp()
    });

    return budgetId;
  } catch (error) {
    console.error("Error deleting budget:", error);
    throw error;
  }
};

// ✅ Get budget by category - periode aktif saja
export const getBudgetByCategory = async (category, period) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetsRef = collection(db, "users", user.uid, "budgets");
    const { periodStart } = getCurrentPeriod();
    
    const q = query(
      budgetsRef,
      where("category", "==", category),
      where("isArchived", "==", false),
      where("periodStart", "==", periodStart)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error fetching budget by category:", error);
    throw error;
  }
};