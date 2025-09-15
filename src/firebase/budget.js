// src/firebase/budget.js
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
  serverTimestamp 
} from "firebase/firestore";

// ✅ Add new budget
export const addBudget = async (budgetData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetsRef = collection(db, "users", user.uid, "budgets");

    // Check if budget already exists for this category and period
    const existingBudgetQuery = query(
      budgetsRef,
      where("category", "==", budgetData.category),
      where("period", "==", budgetData.period)
    );
    
    const existingBudgets = await getDocs(existingBudgetQuery);
    
    if (!existingBudgets.empty) {
      throw new Error("Budget already exists for this category and period");
    }

    const docRef = await addDoc(budgetsRef, {
      ...budgetData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { id: docRef.id, ...budgetData };
  } catch (error) {
    console.error("Error adding budget:", error);
    throw error;
  }
};

// ✅ Get all budgets for current user
export const getUserBudgets = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetsRef = collection(db, "users", user.uid, "budgets");
    const q = query(budgetsRef, orderBy("createdAt", "desc"));
    
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
    
    // Check if budget exists
    const budgetDoc = await getDoc(budgetRef);
    if (!budgetDoc.exists()) {
      throw new Error("Budget not found");
    }

    // If updating category or period, check for duplicates
    if (updatedData.category || updatedData.period) {
      const currentData = budgetDoc.data();
      const newCategory = updatedData.category || currentData.category;
      const newPeriod = updatedData.period || currentData.period;

      const budgetsRef = collection(db, "users", user.uid, "budgets");
      const existingBudgetQuery = query(
        budgetsRef,
        where("category", "==", newCategory),
        where("period", "==", newPeriod)
      );
      
      const existingBudgets = await getDocs(existingBudgetQuery);
      const duplicates = existingBudgets.docs.filter(doc => doc.id !== budgetId);
      
      if (duplicates.length > 0) {
        throw new Error("Budget already exists for this category and period");
      }
    }

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

// ✅ Delete budget
export const deleteBudget = async (budgetId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetRef = doc(db, "users", user.uid, "budgets", budgetId);
    
    // Check if budget exists
    const budgetDoc = await getDoc(budgetRef);
    if (!budgetDoc.exists()) {
      throw new Error("Budget not found");
    }

    await deleteDoc(budgetRef);
    return budgetId;
  } catch (error) {
    console.error("Error deleting budget:", error);
    throw error;
  }
};

// ✅ Get budget by category and period
export const getBudgetByCategory = async (category, period) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const budgetsRef = collection(db, "users", user.uid, "budgets");
    const q = query(
      budgetsRef,
      where("category", "==", category),
      where("period", "==", period)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error("Error fetching budget by category:", error);
    throw error;
  }
};