import { db, auth } from "./config";
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
  Timestamp
} from "firebase/firestore";

// ✅ Add budget - SELALU BUAT BARU
export const addBudget = async (budgetData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetsRef = collection(db, "users", user.uid, "budgets");

    const docRef = await addDoc(budgetsRef, {
      category: budgetData.category,
      amount: budgetData.amount,
      periodStart: budgetData.periodStart, // Timestamp dari form
      periodEnd: budgetData.periodEnd,     // Timestamp dari form
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

// ✅ Get ALL active budgets (filter periode di frontend)
export const getUserBudgets = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetsRef = collection(db, "users", user.uid, "budgets");
    
    // Query sederhana: hanya filter archived & sort
    const q = query(
      budgetsRef,
      where("isArchived", "==", false),
      orderBy("periodStart", "desc")
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

// ✅ Update budget
export const updateBudget = async (budgetId, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetRef = doc(db, "users", user.uid, "budgets", budgetId);
    const budgetDoc = await getDoc(budgetRef);
    
    if (!budgetDoc.exists()) {
      throw new Error("Budget not found");
    }

    await updateDoc(budgetRef, {
      category: updatedData.category,
      amount: updatedData.amount,
      periodStart: updatedData.periodStart,
      periodEnd: updatedData.periodEnd,
      updatedAt: serverTimestamp()
    });

    return { id: budgetId, ...updatedData };
  } catch (error) {
    console.error("Error updating budget:", error);
    throw error;
  }
};

// ✅ Delete budget → SOFT DELETE
export const deleteBudget = async (budgetId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetRef = doc(db, "users", user.uid, "budgets", budgetId);
    const budgetDoc = await getDoc(budgetRef);
    
    if (!budgetDoc.exists()) {
      throw new Error("Budget not found");
    }

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